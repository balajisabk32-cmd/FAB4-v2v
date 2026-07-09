# SAKHI — ML pipeline (Menstrual Mode)

Five features, five files. Run in order (`01` → `05`). Each script is self-contained
and saves its trained model as a `.pkl` next to it.

```
pip install -r requirements.txt
python 01_cycle_ovulation_prediction.py
python 02_irregular_cycle_detection.py
python 03_pcos_risk_prediction.py      # needs PCOS dataset — see below
python 04_thyroid_risk_prediction.py   # needs thyroid dataset — see below
python 05_symptom_triage_rules.py      # no training — instant
```

## What ran on your uploaded data (tested, results below)

| File | Model | Data used | Test result (unseen people) |
|---|---|---|---|
| `01_cycle_ovulation_prediction.py` (Part A) | RandomForestRegressor, tuned | `menstrual_cycle_dataset_with_factors.csv` | MAE=6.57, RMSE=7.61, R²=0.016 vs. naive MAE=9.11 |
| `01_cycle_ovulation_prediction.py` (Part B) | RandomForestRegressor, tuned | `FedCycleData071012...csv` | MAE=1.32, RMSE=1.79, R²=0.511 vs. naive MAE=1.76 |
| `02_irregular_cycle_detection.py` | RandomForest vs XGBoost, tuned, best picked by CV | `menstrual_cycle_dataset_with_factors.csv` | RF: F1=0.87, ROC-AUC=0.65 |
| `05_symptom_triage_rules.py` | Rule-based, not ML | — | Deterministic, smoke-tested |

**Honest caveat on Part A (cycle length forecasting):** R² is low (~0.02).
The model still meaningfully beats the naive baseline on MAE, but the
`menstrual_cycle_dataset_with_factors.csv` file has cycle lengths spanning
25–50 days with high per-user variance — this looks like synthetic/simulated
data rather than a real clinical population, so don't expect this exact MAE
to hold once you retrain on your app's real user data. The pipeline code
itself (leakage controls, tuning, evaluation) is correct and reusable — just
recalibrate expectations once real logging data comes in.

**Honest caveat on `02` (irregular cycle detection):** there is no ground-truth
PCOS/thyroid diagnosis in the uploaded data, so `irregular_next` is a
**heuristic label** built from WHO's abnormal-cycle-length rule (<21 or >35
days) plus a >9-day deviation-from-personal-baseline rule — not a diagnosis.
Say this explicitly in the app UI: "your pattern looks irregular, consider
getting checked" — not "you may have PCOS."

## What's templated but not yet runnable

`03_pcos_risk_prediction.py` and `04_thyroid_risk_prediction.py` are complete,
production-shaped pipelines (GridSearchCV tuning, leakage-safe preprocessing,
schema auto-detection) built against the standard Kaggle schemas for these
two datasets. They were **not uploaded**, so these two scripts currently exit
with a clear instruction message instead of a crash. To activate them:

1. Download the PCOS dataset: https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos
2. Download a thyroid dataset, e.g.: https://www.kaggle.com/datasets/emmanuelfwerr/thyroid-disease-data
3. Upload both CSVs to me, or drop them in `/mnt/user-data/uploads/` and update
   `PCOS_CSV_PATH` / `THYROID_CSV_PATH` at the top of each script.
4. Re-run — the scripts will auto-detect the target column and train immediately.

## Data leakage checklist (applied to every model)

- [x] **Group-aware splitting** — `GroupShuffleSplit`/`GroupKFold` by `User ID`/
      `ClientID` for the two cycle datasets, so one person's cycles never
      appear in both train and test. Plain random row splits would let the
      model "memorize" a person during training and get an inflated score
      testing on that same person's other cycles.
- [x] **Causal lag features only** — every rolling/lag statistic uses
      `.shift(1)` (see `common.add_causal_lag_features`), so a cycle's
      features are built only from that person's *past* cycles, never
      itself or the future.
- [x] **Forecasting framing, not describing** — Part A predicts the *next*
      cycle length, not the current one, and irregular-cycle detection
      predicts whether the *next* cycle will be irregular. This is what
      makes these useful in production (predicting ahead of time) instead
      of just re-deriving a value that's already known.
- [x] **Fit-on-train-only preprocessing** — every scaler/imputer/encoder
      lives inside an `sklearn.Pipeline` and is `fit()` only on the train
      fold, never on the full dataset before splitting.
- [x] **Leakage-prone columns dropped explicitly** — ID columns in the PCOS
      template, and `"* measured"` flag columns in the thyroid template
      (which would otherwise let the model learn "was this test even
      ordered" as a shortcut for "was this patient already suspected sick").
- [x] **Class imbalance handled without leaking** — `class_weight="balanced"` /
      `scale_pos_weight`, computed only from the train fold. No oversampling
      before the split (oversampling-then-splitting is a common leakage bug:
      synthetic copies of a test-set row can end up back in train).

## Why symptom triage (`05`) is rule-based, not ML

Neither dataset has a labeled "urgency" outcome, and getting triage wrong
has real consequences. Training a classifier would mean inventing labels
ourselves — a bad foundation for something safety-critical. The rule engine
uses established red-flag thresholds (soaking a pad hourly, fainting, high
fever, severe sudden pain, etc.) and returns one of `EMERGENCY` / `SEE_DOCTOR`
/ `MONITOR` / `NORMAL` with the specific reasons that triggered it, so it's
auditable — you can see exactly why it made a call. A learned model could
slot in later to help a clinician prioritize review queues, but user-facing
urgency decisions should stay rule-based and clinician-reviewed for now.

## Wiring into your chatbot

Each `.pkl` here is exactly what the Flask/FastAPI model-serving layer from
our last conversation expects — `joblib.load("cycle_length_model.pkl")`,
build a feature vector matching each script's `feature_cols`, and return
`.predict()` / `.predict_proba()` as JSON for Gemini's function-calling to consume.
