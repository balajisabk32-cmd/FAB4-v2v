"""
04_thyroid_risk_prediction.py

Classification model: thyroid disorder risk, from scratch + GridSearchCV tuning.
Same pipeline pattern as 03_pcos_risk_prediction.py so the two are consistent
and easy to maintain together.

*** REQUIRES DATA YOU HAVEN'T UPLOADED YET ***
Targets the standard UCI-derived thyroid dataset commonly hosted on Kaggle
(columns like age, sex, on_thyroxine, TSH, T3, TT4, T4U, FTI, and a binary
target such as "binaryClass" / "target" / "Class", with sick/positive coded
as one class and negative/healthy as the other, and missing values often
stored as "?"). Download e.g.
https://www.kaggle.com/datasets/emmanuelfwerr/thyroid-disease-data
and place the CSV at THYROID_CSV_PATH below (or upload it to me directly).

Leakage controls:
  - Cross-sectional, one row per patient -> stratified train/test split
    (not group-based, since there's no repeated-patient structure here).
  - "*_measured" flag columns (present in the classic UCI version, e.g.
    "TSH measured") are DROPPED -- keeping them would let the model learn
    "was this test even ordered" as a proxy for "was the patient already
    suspected sick", which is a subtle real-world leakage trap in this
    exact dataset, not a hypothetical one.
  - All preprocessing (imputation of "?", scaling, encoding) is fit on the
    train fold only, inside a Pipeline.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from common import classification_report_full

RANDOM_STATE = 42
THYROID_CSV_PATH = "c:/Users/Balaji/OneDrive/Desktop/Hackathon/Vibe2Vision/files (3)/thyroidDF.csv"  # <-- update after upload

TARGET_CANDIDATES = ["binaryClass", "Class", "class", "target", "Target", "diagnosis"]
MEASURED_FLAG_SUFFIX = "measured"  # columns like "TSH measured" get dropped -- see docstring


def _find_target(df):
    for cand in TARGET_CANDIDATES:
        if cand in df.columns:
            return cand
    raise ValueError(
        f"Could not find a thyroid target column. Looked for {TARGET_CANDIDATES}.\n"
        f"Columns found in your file: {list(df.columns)}\n"
        f"Update TARGET_CANDIDATES at the top of this script to match your file."
    )


def build_thyroid_model(path=THYROID_CSV_PATH):
    if not os.path.exists(path):
        print(f"[!] Thyroid dataset not found at {path}.\n"
              f"    Upload the Kaggle thyroid CSV and update THYROID_CSV_PATH at the top of this script.")
        return None

    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    df = df.replace("?", np.nan)

    target_col = _find_target(df)

    # Drop the "was this test even ordered" flag columns -- see docstring.
    measured_cols = [c for c in df.columns if MEASURED_FLAG_SUFFIX in c.lower()]
    if measured_cols:
        print(f"Dropping potential-leakage 'measured' flag columns: {measured_cols}")
        df = df.drop(columns=measured_cols)

    # Normalize target to 0/1. Handle both string labels ("negative"/"sick",
    # "P"/"N") and already-numeric targets.
    y_raw = df[target_col]
    if not pd.api.types.is_numeric_dtype(y_raw):
        # '-' means negative/healthy. Any other letter string means some thyroid condition.
        y = y_raw.astype(str).str.strip().apply(lambda v: 0 if v == "-" else 1)
    else:
        y = y_raw.astype(int)

    # Drop target column and ID columns (which cause leakage in tree models)
    cols_to_drop = [target_col]
    if "patient_id" in df.columns:
        cols_to_drop.append("patient_id")
    X = df.drop(columns=cols_to_drop)
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]

    # Coerce object columns that are secretly numeric (common after "?" -> NaN)
    for col in list(cat_cols):
        coerced = pd.to_numeric(X[col], errors="coerce")
        if coerced.notna().mean() > 0.8:
            X[col] = coerced
            num_cols.append(col)
            cat_cols.remove(col)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    preprocess = ColumnTransformer([
        ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                           ("scale", StandardScaler())]), num_cols),
        ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                           ("onehot", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
    ])
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    # --- Random Forest ---
    rf_pipe = Pipeline([("prep", preprocess),
                         ("model", RandomForestClassifier(class_weight="balanced", random_state=RANDOM_STATE))])
    rf_grid = {
        "model__n_estimators": [200, 400, 600],
        "model__max_depth": [3, 5, 8, None],
        "model__min_samples_leaf": [1, 3, 5],
    }
    rf_search = GridSearchCV(rf_pipe, rf_grid, cv=cv, scoring="roc_auc", n_jobs=-1)
    rf_search.fit(X_train, y_train)
    print("Best RF params:", rf_search.best_params_)

    # --- XGBoost ---
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
    xgb_search = GridSearchCV(xgb_pipe, xgb_grid, cv=cv, scoring="roc_auc", n_jobs=-1)
    xgb_search.fit(X_train, y_train)
    print("Best XGB params:", xgb_search.best_params_)

    print("\n-- Held-out test set --")
    best_rf, best_xgb = rf_search.best_estimator_, xgb_search.best_estimator_
    classification_report_full(y_test, best_rf.predict(X_test),
                                best_rf.predict_proba(X_test)[:, 1], label="RandomForest")
    classification_report_full(y_test, best_xgb.predict(X_test),
                                best_xgb.predict_proba(X_test)[:, 1], label="XGBoost")

    final_model = best_rf if rf_search.best_score_ >= xgb_search.best_score_ else best_xgb
    joblib.dump(final_model, "thyroid_risk_model.pkl")
    print(f"\nSaved -> thyroid_risk_model.pkl "
          f"({'RandomForest' if final_model is best_rf else 'XGBoost'} selected by CV ROC-AUC)")
    return final_model


if __name__ == "__main__":
    build_thyroid_model()
