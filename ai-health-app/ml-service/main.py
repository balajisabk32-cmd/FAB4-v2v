import os
import pickle
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="SAKHI ML Microservice")

# Model Paths
CYCLE_MODEL_PATH = "cycle.pkl"
PCOS_MODEL_PATH = "pcos.pkl"

# Global references to models
model_cycle = None
model_pcos = None

@app.on_event("startup")
def load_models():
    global model_cycle, model_pcos
    if os.path.exists(CYCLE_MODEL_PATH):
        with open(CYCLE_MODEL_PATH, "rb") as f:
            model_cycle = pickle.load(f)
    if os.path.exists(PCOS_MODEL_PATH):
        with open(PCOS_MODEL_PATH, "rb") as f:
            model_pcos = pickle.load(f)
    print("Models loaded successfully.")

# Request Schemas
class CycleRequest(BaseModel):
    last_period_date: str  # Format: YYYY-MM-DD
    cycle_length_avg: int

class PCOSRequest(BaseModel):
    weight: float
    cycle_regularity: int  # 0 for irregular, 1 for regular
    acne_severity: int     # 1 to 10

@app.post("/predict/cycle")
def predict_cycle(req: CycleRequest):
    if model_cycle is None:
        raise HTTPException(status_code=500, detail="Cycle prediction model not loaded.")
    
    try:
        dt = datetime.strptime(req.last_period_date, "%Y-%m-%d")
        days_since_last_period = (datetime.now() - dt).days
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    
    # Run prediction
    features = np.array([[req.cycle_length_avg, days_since_last_period]])
    prediction = int(model_cycle.predict(features)[0])
    probabilities = model_cycle.predict_proba(features)[0]
    prob_regular = float(probabilities[1])

    # Simple rule: if days since last period is close to cycle_length_avg, next period is due soon
    days_until_next = max(0, req.cycle_length_avg - days_since_last_period)
    
    return {
        "status": "success",
        "days_since_last_period": days_since_last_period,
        "is_regular": prediction,
        "probability_regular": prob_regular,
        "days_until_next_period": days_until_next
    }

@app.post("/predict/pcos")
def predict_pcos(req: PCOSRequest):
    if model_pcos is None:
        raise HTTPException(status_code=500, detail="PCOS prediction model not loaded.")
    
    # Run prediction
    features = np.array([[req.weight, req.cycle_regularity, req.acne_severity]])
    prediction = int(model_pcos.predict(features)[0])
    probabilities = model_pcos.predict_proba(features)[0]
    prob_pcos = float(probabilities[1])
    
    return {
        "status": "success",
        "has_pcos": prediction,
        "probability_pcos": prob_pcos
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": {
            "cycle": model_cycle is not None,
            "pcos": model_pcos is not None
        }
    }
