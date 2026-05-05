import joblib
import numpy as np
import os

MODEL_PATH  = os.path.join(
    os.path.dirname(__file__), 'saved/model.pkl')
SCALER_PATH = os.path.join(
    os.path.dirname(__file__), 'saved/scaler.pkl')

class NIDSModel:
    def __init__(self):
        self.model  = None
        self.scaler = None
        self.load()

    def load(self):
        try:
            self.model  = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
            print("Model loaded successfully.")
        except FileNotFoundError:
            print("Model not found. Run train.py first.")

    def predict(self, features: list):
        if self.model is None:
            return {"error": "Model not loaded"}

        arr        = np.array(features).reshape(1, -1)
        scaled     = self.scaler.transform(arr)
        prediction = self.model.predict(scaled)[0]
        proba      = self.model.predict_proba(scaled)[0]
        confidence = float(proba.max())

        return {
            "prediction":  int(prediction),
            "label":       "Attack" if prediction == 1
                           else "Normal",
            "confidence":  round(confidence * 100, 2),
            "is_attack":   bool(prediction == 1)
        }

# Singleton instance
nids_model = NIDSModel()
