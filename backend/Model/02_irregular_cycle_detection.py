"""
02_irregular_cycle_detection.py

Classification model: will the user's NEXT cycle be irregular?

Data: menstrual_cycle_dataset_with_factors.csv (no ground-truth PCOS/thyroid
diagnosis is present in this file, so we build a clinically-grounded HEURISTIC
label rather than pretending we have diagnosed irregularity):

  irregular_next = 1 if the user's NEXT cycle length is:
      < 21 days OR > 35 days                         (WHO abnormal-length rule)
      OR deviates from that user's own rolling-mean cycle length by > 9 days
                                                       (cycle-to-cycle variability rule)
  else 0

This is exactly the kind of pattern that is used clinically as a first-pass
screen suggesting "worth checking for PCOS/thyroid" — it is NOT a diagnosis,
and the model/README says so explicitly.

Leakage controls:
  - Label uses the NEXT cycle's length -> features only use CURRENT and PAST
    cycles (lag/rolling with shift(1)), so nothing about the label leaks into X.
  - Person-level GroupShuffleSplit + GroupKFold for tuning.
  - Preprocessing fit on train fold only, inside a Pipeline.
  - Class imbalance handled with class_weight="balanced" rather than
    oversampling before the split (oversampling before splitting is a classic
    leakage bug — synthetic copies of a test-fold sample can end up in train).
"""

import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from xgboost import XGBClassifier

from common import group_train_test_split, make_group_kfold, add_causal_lag_features, classification_report_full

RANDOM_STATE = 42
LOW, HIGH, DEVIATION_THRESHOLD = 21, 35, 9


def build_irregular_cycle_model(path="c:/Users/Balaji/OneDrive/Desktop/Hackathon/Vibe2Vision/files (3)/menstrual_cycle_dataset_with_factors.csv"):
    df = pd.read_csv(path)
    df["Cycle Start Date"] = pd.to_datetime(df["Cycle Start Date"])
    df = df.sort_values(["User ID", "Cycle Start Date"])

    df = add_causal_lag_features(
        df, group_col="User ID", sort_col="Cycle Start Date",
        value_col="Cycle Length", lags=(1, 2, 3, 4), rolling_windows=(3, 6)
    )

    # Target = is the NEXT cycle irregular (future event, not the current row's own value)
    df["next_cycle_length"] = df.groupby("User ID")["Cycle Length"].shift(-1)
    
    # Age-adjusted deviation threshold (per Bull et al. 2019)
    # Perimenopausal women (>40) have significantly higher natural variance (up to 3.1 days standard deviation)
    # We use a 14-day threshold for Age >= 40 to avoid false-positive PCOS flags, else 9 days.
    deviation_thresh = np.where(df["Age"] >= 40, 14, DEVIATION_THRESHOLD)

    df["irregular_next"] = (
        (df["next_cycle_length"] < LOW) | (df["next_cycle_length"] > HIGH) |
        ((df["next_cycle_length"] - df["Cycle Length_rollmean3"]).abs() > deviation_thresh)
    ).astype(int)

    model_df = df.dropna(subset=["next_cycle_length", "Cycle Length_lag4"]).copy()
    
    # --- BMI & Age Explicit Priors (per Bull et al. 2019) ---
    model_df["Is_Perimenopausal"] = (model_df["Age"] >= 40).astype(int)
    model_df["Is_High_Variance_BMI"] = (model_df["BMI"] >= 35).astype(int)

    print("Class balance (irregular_next):")
    print(model_df["irregular_next"].value_counts(normalize=True))

    feature_cols_num = [
        "Age", "BMI", "Stress Level", "Sleep Hours", "Period Length",
        "Is_Perimenopausal", "Is_High_Variance_BMI",
        "Cycle Length", "Cycle Length_lag1", "Cycle Length_lag2", "Cycle Length_lag3", "Cycle Length_lag4",
        "Cycle Length_rollmean3", "Cycle Length_rollstd3",
        "Cycle Length_rollmean6", "Cycle Length_rollstd6",
    ]
    feature_cols_cat = ["Exercise Frequency", "Diet"]

    train_df, test_df = group_train_test_split(model_df, "User ID", test_size=0.2, random_state=RANDOM_STATE)
    X_train = train_df[feature_cols_num + feature_cols_cat]
    y_train = train_df["irregular_next"]
    X_test = test_df[feature_cols_num + feature_cols_cat]
    y_test = test_df["irregular_next"]
    groups_train = train_df["User ID"]

    preprocess = ColumnTransformer([
        ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                           ("scale", StandardScaler())]), feature_cols_num),
        ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                           ("onehot", OneHotEncoder(handle_unknown="ignore"))]), feature_cols_cat),
    ])

    cv = make_group_kfold(n_splits=5)

    # --- Random Forest, tuned ---
    rf_pipe = Pipeline([("prep", preprocess),
                         ("model", RandomForestClassifier(class_weight="balanced", random_state=RANDOM_STATE))])
    rf_grid = {
        "model__n_estimators": [200, 400],
        "model__max_depth": [3, 5, 8, None],
        "model__min_samples_leaf": [1, 3, 5],
    }
    rf_search = GridSearchCV(rf_pipe, rf_grid, cv=cv, scoring="f1", n_jobs=-1)
    rf_search.fit(X_train, y_train, groups=groups_train)
    print("\nBest RF params:", rf_search.best_params_)

    # --- XGBoost, tuned ---
    pos = y_train.sum()
    neg = len(y_train) - pos
    scale_pos_weight = neg / max(pos, 1)
    xgb_pipe = Pipeline([("prep", preprocess),
                          ("model", XGBClassifier(eval_metric="logloss", random_state=RANDOM_STATE,
                                                   scale_pos_weight=scale_pos_weight))])
    xgb_grid = {
        "model__n_estimators": [200, 400],
        "model__max_depth": [3, 4, 6],
        "model__learning_rate": [0.05, 0.1],
    }
    xgb_search = GridSearchCV(xgb_pipe, xgb_grid, cv=cv, scoring="f1", n_jobs=-1)
    xgb_search.fit(X_train, y_train, groups=groups_train)
    print("Best XGB params:", xgb_search.best_params_)

    print("\n-- Held-out test set (unseen users) --")
    best_rf = rf_search.best_estimator_
    best_xgb = xgb_search.best_estimator_
    classification_report_full(y_test, best_rf.predict(X_test),
                                best_rf.predict_proba(X_test)[:, 1], label="RandomForest")
    classification_report_full(y_test, best_xgb.predict(X_test),
                                best_xgb.predict_proba(X_test)[:, 1], label="XGBoost")

    # Pick whichever scored higher on F1 during CV
    final_model = best_xgb if xgb_search.best_score_ >= rf_search.best_score_ else best_rf
    joblib.dump(final_model, "irregular_cycle_model.pkl")
    print(f"\nSaved -> irregular_cycle_model.pkl "
          f"({'XGBoost' if final_model is best_xgb else 'RandomForest'} selected by CV F1)")
    return final_model


if __name__ == "__main__":
    build_irregular_cycle_model()
