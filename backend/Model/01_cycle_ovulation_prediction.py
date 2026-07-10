"""
01_cycle_ovulation_prediction.py

TWO regression models, trained from scratch:

  A) NEXT CYCLE LENGTH forecaster
     Data: menstrual_cycle_dataset_with_factors.csv (100 users, ~9 cycles each)
     Target: the user's NEXT cycle length (predict forward, not describe backward)
     Features: lifestyle factors (age, BMI, stress, sleep, exercise, diet) +
               CAUSAL lag/rolling features of past cycle lengths only.

  B) OVULATION DAY predictor
     Data: FedCycleData071012 (159 clients, 1665 cycles, real fertility-tracking data)
     Target: EstimatedDayofOvulation for a cycle
     Features: that cycle's LengthofCycle + CAUSAL lag/rolling features from
               the same client's earlier cycles.

Leakage controls used (see common.py for the reusable helpers):
  - Person-level GroupShuffleSplit (train/test never share a user/client)
  - All lag/rolling features use .shift(1) -> only past cycles are visible
  - Preprocessing (imputer, scaler, one-hot encoder) lives inside an
    sklearn Pipeline and is fit on the TRAIN fold only
  - GridSearchCV uses GroupKFold, not plain KFold, so tuning itself can't leak
"""

import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV

from common import group_train_test_split, make_group_kfold, add_causal_lag_features, regression_report

RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# PART A — Next cycle length forecaster
# ---------------------------------------------------------------------------
def build_cycle_length_model(path="c:/Users/Balaji/OneDrive/Desktop/Hackathon/Vibe2Vision/files (3)/menstrual_cycle_dataset_with_factors.csv"):
    print("\n=== A) Next cycle length forecaster ===")
    df = pd.read_csv(path)
    df["Cycle Start Date"] = pd.to_datetime(df["Cycle Start Date"])

    # Causal lag/rolling features from *past* cycles of the same user only
    df = add_causal_lag_features(
        df, group_col="User ID", sort_col="Cycle Start Date",
        value_col="Cycle Length", lags=(1, 2, 3, 4), rolling_windows=(3, 6)
    )

    # TARGET = the user's NEXT cycle length (forecast forward)
    df = df.sort_values(["User ID", "Cycle Start Date"])
    df["target_next_cycle_length"] = df.groupby("User ID")["Cycle Length"].shift(-1)

    # Drop rows with no next cycle (last cycle per user) or no lag history yet
    model_df = df.dropna(subset=["target_next_cycle_length", "Cycle Length_lag4"]).copy()
    
    # --- BMI & Age Explicit Priors (per Bull et al. 2019) ---
    model_df["Is_Perimenopausal"] = (model_df["Age"] >= 40).astype(int)
    model_df["Is_High_Variance_BMI"] = (model_df["BMI"] >= 35).astype(int)

    feature_cols_num = [
        "Age", "BMI", "Stress Level", "Sleep Hours", "Period Length",
        "Is_Perimenopausal", "Is_High_Variance_BMI",
        "Cycle Length_lag1", "Cycle Length_lag2", "Cycle Length_lag3", "Cycle Length_lag4",
        "Cycle Length_rollmean3", "Cycle Length_rollstd3",
        "Cycle Length_rollmean6", "Cycle Length_rollstd6",
    ]
    feature_cols_cat = ["Exercise Frequency", "Diet"]

    X = model_df[feature_cols_num + feature_cols_cat]
    y = model_df["target_next_cycle_length"]
    groups = model_df["User ID"]

    train_df, test_df = group_train_test_split(model_df, "User ID", test_size=0.2, random_state=RANDOM_STATE)
    X_train, y_train = train_df[feature_cols_num + feature_cols_cat], train_df["target_next_cycle_length"]
    X_test, y_test = test_df[feature_cols_num + feature_cols_cat], test_df["target_next_cycle_length"]
    groups_train = train_df["User ID"]

    preprocess = ColumnTransformer([
        ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                           ("scale", StandardScaler())]), feature_cols_num),
        ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                           ("onehot", OneHotEncoder(handle_unknown="ignore"))]), feature_cols_cat),
    ])

    xgb_pipe = Pipeline([
        ("prep", preprocess),
        ("model", XGBRegressor(random_state=RANDOM_STATE, n_jobs=1)),
    ])
    param_grid = {
        "model__n_estimators": [100, 200, 300],
        "model__max_depth": [3, 4, 6],
        "model__learning_rate": [0.01, 0.05, 0.1],
        "model__subsample": [0.8, 1.0],
    }
    cv = make_group_kfold(n_splits=5)
    search = GridSearchCV(xgb_pipe, param_grid, cv=cv, scoring="neg_mean_absolute_error", n_jobs=-1)
    search.fit(X_train, y_train, groups=groups_train)
    best_xgb = search.best_estimator_
    print("Best XGB params:", search.best_params_)

    # Baseline for comparison: plain linear regression, same pipeline
    lr_pipe = Pipeline([("prep", preprocess), ("model", LinearRegression())])
    lr_pipe.fit(X_train, y_train)

    print("\n-- Held-out test set (unseen users) --")
    regression_report(y_test, best_xgb.predict(X_test), label="XGBoost (tuned)")
    regression_report(y_test, lr_pipe.predict(X_test), label="LinearRegression (baseline)")

    # Naive baseline: "predict last cycle length again" — a real model must beat this
    naive_pred = X_test["Cycle Length_lag1"]
    regression_report(y_test, naive_pred, label="Naive (repeat last cycle)")

    joblib.dump(best_xgb, "cycle_length_model.pkl")
    print("Saved -> cycle_length_model.pkl")
    return best_xgb


# ---------------------------------------------------------------------------
# PART B — Ovulation day predictor
# ---------------------------------------------------------------------------
def build_ovulation_model(path="c:/Users/Balaji/OneDrive/Desktop/Hackathon/Vibe2Vision/files (3)/FedCycleData071012 (2)-selected-columns.csv"):
    print("\n=== B) Ovulation day predictor ===")
    df = pd.read_csv(path)

    # Clean: blanks are stored as " " strings, not NaN
    for col in ["MeanCycleLength", "EstimatedDayofOvulation", "LengthofLutealPhase", "FirstDayofHigh"]:
        df[col] = pd.to_numeric(df[col].astype(str).str.strip(), errors="coerce")

    df = df.sort_values(["ClientID", "CycleNumber"])

    # Causal lag/rolling features on cycle length and ovulation day, past cycles only
    df = add_causal_lag_features(df, "ClientID", "CycleNumber", "LengthofCycle",
                                  lags=(1,), rolling_windows=(3,))
    df = add_causal_lag_features(df, "ClientID", "CycleNumber", "EstimatedDayofOvulation",
                                  lags=(1,), rolling_windows=(3,))

    model_df = df.dropna(subset=[
        "EstimatedDayofOvulation", "LengthofCycle",
        "EstimatedDayofOvulation_lag1", "LengthofCycle_lag1",
    ]).copy()

    feature_cols = [
        "LengthofCycle",                       # current cycle's known length
        "LengthofCycle_lag1", "LengthofCycle_rollmean3",
        "EstimatedDayofOvulation_lag1", "EstimatedDayofOvulation_rollmean3",
        "ReproductiveCategory",
    ]
    target_col = "EstimatedDayofOvulation"

    train_df, test_df = group_train_test_split(model_df, "ClientID", test_size=0.2, random_state=RANDOM_STATE)
    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]
    groups_train = train_df["ClientID"]

    preprocess = ColumnTransformer([
        ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                           ("scale", StandardScaler())]), feature_cols),
    ])
    rf_pipe = Pipeline([("prep", preprocess), ("model", RandomForestRegressor(random_state=RANDOM_STATE))])

    param_grid = {
        "model__n_estimators": [100, 200, 400],
        "model__max_depth": [3, 5, 8, None],
        "model__min_samples_leaf": [1, 3, 5],
    }
    cv = make_group_kfold(n_splits=5)
    search = GridSearchCV(rf_pipe, param_grid, cv=cv, scoring="neg_mean_absolute_error", n_jobs=-1)
    search.fit(X_train, y_train, groups=groups_train)
    best_rf = search.best_estimator_
    print("Best RF params:", search.best_params_)

    # --- Luteal Phase Clinical Constraint Wrapper (per Bull et al. 2019) ---
    # The study proves luteal phase is consistently around 12.4 days and rarely < 8 or > 16.
    class LutealConstraintWrapper:
        def __init__(self, model):
            self.model = model
        
        def predict(self, X):
            raw_pred = self.model.predict(X)
            # Cycle Length is available in X as "LengthofCycle"
            cycle_lengths = X["LengthofCycle"].values
            # Luteal phase = Cycle Length - Ovulation Day
            # We constrain Ovulation Day so that 8 <= Luteal Phase <= 16
            min_ov = cycle_lengths - 16
            max_ov = cycle_lengths - 8
            return np.clip(raw_pred, min_ov, max_ov)
            
    constrained_model = LutealConstraintWrapper(best_rf)

    print("\n-- Held-out test set (unseen clients) --")
    regression_report(y_test, constrained_model.predict(X_test), label="RandomForest (Luteal-Constrained)")
    naive_pred = X_test["EstimatedDayofOvulation_lag1"]
    regression_report(y_test, naive_pred, label="Naive (repeat last ovulation day)")

    joblib.dump(best_rf, "ovulation_day_model.pkl")
    print("Saved -> ovulation_day_model.pkl")
    return best_rf


if __name__ == "__main__":
    build_cycle_length_model()
    build_ovulation_model()
