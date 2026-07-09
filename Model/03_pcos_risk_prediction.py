"""
03_pcos_risk_prediction.py

Classification model: PCOS risk, from scratch + GridSearchCV/RandomizedSearchCV tuning.

*** REQUIRES DATA YOU HAVEN'T UPLOADED YET ***
This script targets the standard Kaggle PCOS dataset (Kottarathil,
"Polycystic ovary syndrome (PCOS)" -- the one cited across most PCOS-ML
papers, 541 rows / 43 columns, target column "PCOS (Y/N)"). Download it
from https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos
and place the CSV at the PCOS_CSV_PATH below (or upload it to me and I will
point this script at it and re-run for you).

The script is schema-tolerant: it auto-detects the target column and strips
whitespace from column names (this dataset is notorious for trailing spaces
like " Age (yrs)"), and will print a clear diagnostic instead of crashing if
your file's columns don't match what's expected.

Leakage controls:
  - This dataset is one row per patient (cross-sectional, not longitudinal),
    so there is no person-level grouping concern the way there is for the
    cycle-tracking data -- but we still use a stratified train/test split
    (stratified on the target) so class balance is consistent, and all
    preprocessing is fit on the train fold only via Pipeline.
  - ID-only columns ("Sl. No", "Patient File No.") are dropped -- they carry
    zero clinical signal and, worse, can act as accidental row-order proxies.
  - RandomizedSearchCV/GridSearchCV use StratifiedKFold on the TRAIN fold
    only, so the held-out test set is never touched during tuning.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

from common import classification_report_full

RANDOM_STATE = 42
PCOS_CSV_PATH = "c:/Users/Balaji/OneDrive/Desktop/Hackathon/Vibe2Vision/PCOS_data_without_infertility.xlsx"  # <-- using the Excel file provided by user

ID_COLUMNS = ["Sl. No", "Sl.No", "Patient File No."]
TARGET_CANDIDATES = ["PCOS (Y/N)", "PCOS(Y/N)", "PCOS", "PCOS_YN"]


def _clean_columns(df):
    df.columns = [c.strip() for c in df.columns]
    return df


def _find_target(df):
    for cand in TARGET_CANDIDATES:
        if cand in df.columns:
            return cand
    raise ValueError(
        f"Could not find a PCOS target column. Looked for {TARGET_CANDIDATES}.\n"
        f"Columns found in your file: {list(df.columns)}\n"
        f"Update TARGET_CANDIDATES at the top of this script to match your file."
    )


def build_pcos_model(path=PCOS_CSV_PATH):
    if not os.path.exists(path):
        print(f"[!] PCOS dataset not found at {path}.\n"
              f"    Upload the Kaggle PCOS CSV and update PCOS_CSV_PATH at the top of this script.")
        return None

    if path.endswith(".xlsx"):
        df = pd.read_excel(path, sheet_name="Full_new")
    else:
        df = pd.read_csv(path)
    df = _clean_columns(df)
    target_col = _find_target(df)

    df = df.drop(columns=[c for c in ID_COLUMNS if c in df.columns], errors="ignore")

    # Some source files store numeric-looking columns as strings with stray
    # spaces (e.g. "II    beta-HCG(mIU/mL)"); coerce everything possible to numeric.
    for col in df.columns:
        if col == target_col:
            continue
        if df[col].dtype == object:
            coerced = pd.to_numeric(df[col].astype(str).str.strip(), errors="coerce")
            if coerced.notna().mean() > 0.8:  # column is "really" numeric
                df[col] = coerced

    df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    df = df.dropna(subset=[target_col])
    df[target_col] = df[target_col].astype(int)

    y = df[target_col]
    X = df.drop(columns=[target_col])

    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    if cat_cols:
        print(f"Note: dropping non-numeric columns not handled by this template: {cat_cols}")
        X = X[num_cols]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    preprocess = ColumnTransformer([
        ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                           ("scale", StandardScaler())]), num_cols),
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

    # --- SVM ---
    svm_pipe = Pipeline([("prep", preprocess),
                          ("model", SVC(probability=True, class_weight="balanced", random_state=RANDOM_STATE))])
    svm_grid = {
        "model__C": [0.1, 1, 10, 100],
        "model__gamma": ["scale", "auto", 0.01, 0.1],
        "model__kernel": ["rbf"],
    }
    svm_search = GridSearchCV(svm_pipe, svm_grid, cv=cv, scoring="roc_auc", n_jobs=-1)
    svm_search.fit(X_train, y_train)
    print("Best SVM params:", svm_search.best_params_)

    print("\n-- Held-out test set --")
    best_rf, best_svm = rf_search.best_estimator_, svm_search.best_estimator_
    classification_report_full(y_test, best_rf.predict(X_test),
                                best_rf.predict_proba(X_test)[:, 1], label="RandomForest")
    classification_report_full(y_test, best_svm.predict(X_test),
                                best_svm.predict_proba(X_test)[:, 1], label="SVM")

    final_model = best_rf if rf_search.best_score_ >= svm_search.best_score_ else best_svm
    joblib.dump(final_model, "pcos_risk_model.pkl")
    joblib.dump(num_cols, "pcos_risk_model_features.pkl")
    print(f"\nSaved -> pcos_risk_model.pkl "
          f"({'RandomForest' if final_model is best_rf else 'SVM'} selected by CV ROC-AUC)")

    # Feature importance (RF only) -- useful for your doctor-visit-brief feature
    if final_model is best_rf:
        importances = final_model.named_steps["model"].feature_importances_
        top = sorted(zip(num_cols, importances), key=lambda t: -t[1])[:10]
        print("\nTop 10 predictive features:")
        for name, imp in top:
            print(f"  {name}: {imp:.3f}")

    return final_model


if __name__ == "__main__":
    build_pcos_model()
