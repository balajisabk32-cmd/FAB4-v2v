import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

# 1. Train and save dummy Cycle Prediction model
# Features: [cycle_length_avg, days_since_last_period]
# Target: is_regular (0 or 1)
np.random.seed(42)
X_cycle = np.random.randn(100, 2)
# center cycle_length_avg around 28 and days_since_last_period around 15
X_cycle[:, 0] = X_cycle[:, 0] * 3 + 28
X_cycle[:, 1] = X_cycle[:, 1] * 5 + 15
y_cycle = (X_cycle[:, 0] > 26).astype(int)

model_cycle = LogisticRegression()
model_cycle.fit(X_cycle, y_cycle)

with open("cycle.pkl", "wb") as f:
    pickle.dump(model_cycle, f)
print("Saved cycle.pkl successfully.")

# 2. Train and save dummy PCOS Prediction model
# Features: [weight, cycle_regularity, acne_severity]
# Target: has_pcos (0 or 1)
X_pcos = np.random.randn(100, 3)
# scale weight around 60, cycle_regularity (0 or 1), acne_severity (1 to 10)
X_pcos[:, 0] = X_pcos[:, 0] * 10 + 60
X_pcos[:, 1] = np.random.choice([0, 1], size=100)
X_pcos[:, 2] = np.random.randint(1, 11, size=100)
y_pcos = ((X_pcos[:, 1] == 0) & (X_pcos[:, 2] > 5)).astype(int)

model_pcos = LogisticRegression()
model_pcos.fit(X_pcos, y_pcos)

with open("pcos.pkl", "wb") as f:
    pickle.dump(model_pcos, f)
print("Saved pcos.pkl successfully.")
