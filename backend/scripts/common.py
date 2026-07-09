"""
common.py
Shared utilities for all SAKHI ML models.

Data-leakage rules enforced everywhere in this project:
  1. GROUP-AWARE SPLITTING — a given person's records never appear in both
     train and test. We split by ClientID / User ID (GroupShuffleSplit /
     GroupKFold), never by row. Row-level random splits would let the model
     "see" a person during training and get tested on that same person's
     other cycles -> inflated, fake accuracy.
  2. CAUSAL FEATURES ONLY — any rolling/lag statistic (rolling mean cycle
     length, rolling std, etc.) is computed using .shift(1) so a cycle's
     features only ever use *past* cycles, never itself or the future.
  3. FIT-ON-TRAIN-ONLY PREPROCESSING — scalers, encoders, and imputers are
     always inside an sklearn Pipeline and fit_transform'd on the train
     fold only, then .transform'd on test. Never fit on the full dataset
     before splitting.
  4. NO TARGET-DERIVED FEATURES — we never build a feature out of a
     quantity that is a deterministic function of the label (e.g. using
     "Next Cycle Start Date - Cycle Start Date" as a feature to predict
     "Cycle Length" would be circular).
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit, GroupKFold


def group_train_test_split(df: pd.DataFrame, group_col: str, test_size: float = 0.2, random_state: int = 42):
    """Split so that all rows belonging to the same group (person) land
    entirely in either train or test. Prevents person-level leakage."""
    gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    groups = df[group_col].values
    train_idx, test_idx = next(gss.split(df, groups=groups))
    return df.iloc[train_idx].copy(), df.iloc[test_idx].copy()


def make_group_kfold(n_splits: int = 5):
    """GroupKFold for cross-validation / GridSearchCV so hyperparameter
    tuning never leaks a person across folds."""
    return GroupKFold(n_splits=n_splits)


def add_causal_lag_features(df: pd.DataFrame, group_col: str, sort_col: str, value_col: str,
                             lags=(1,), rolling_windows=(3,)):
    """Adds shift(1)-based lag and rolling features computed ONLY from past
    rows of the same group. Row i never sees value_col of row i itself."""
    df = df.sort_values([group_col, sort_col]).copy()
    grp = df.groupby(group_col)[value_col]

    for lag in lags:
        df[f"{value_col}_lag{lag}"] = grp.shift(lag)

    shifted = grp.shift(1)  # exclude current row from any rolling stat
    df["_shifted_for_roll"] = shifted
    for w in rolling_windows:
        df[f"{value_col}_rollmean{w}"] = (
            df.groupby(group_col)["_shifted_for_roll"]
              .transform(lambda s: s.rolling(window=w, min_periods=1).mean())
        )
        df[f"{value_col}_rollstd{w}"] = (
            df.groupby(group_col)["_shifted_for_roll"]
              .transform(lambda s: s.rolling(window=w, min_periods=2).std())
        )
    df = df.drop(columns=["_shifted_for_roll"])
    return df


def regression_report(y_true, y_pred, label=""):
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    # Calculate "accuracy" within practical windows
    errors = np.abs(y_true - y_pred)
    acc_2d = np.mean(errors <= 2.5) * 100  # <= 2.5 effectively covers ±2 days rounded
    acc_3d = np.mean(errors <= 3.5) * 100
    
    print(f"[{label}] MAE={mae:.2f}  RMSE={rmse:.2f}  R2={r2:.3f}")
    print(f"[{label}] Accuracy (±2 days)={acc_2d:.1f}%  Accuracy (±3 days)={acc_3d:.1f}%")
    return {"mae": mae, "rmse": rmse, "r2": r2, "acc_2d": acc_2d, "acc_3d": acc_3d}


def classification_report_full(y_true, y_pred, y_proba=None, label=""):
    from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                                  f1_score, roc_auc_score, confusion_matrix)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    print(f"[{label}] Acc={acc:.3f}  Precision={prec:.3f}  Recall={rec:.3f}  F1={f1:.3f}")
    if y_proba is not None and len(set(y_true)) == 2:
        try:
            auc = roc_auc_score(y_true, y_proba)
            print(f"[{label}] ROC-AUC={auc:.3f}")
        except ValueError:
            auc = None
    print(f"[{label}] Confusion matrix:\n{confusion_matrix(y_true, y_pred)}")
    return {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1}
