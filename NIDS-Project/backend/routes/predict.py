from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from database.db import get_db, Alert, TrafficLog
from ml.model import nids_model
from datetime import datetime

router = APIRouter()

class PredictRequest(BaseModel):
    features:    List[float]
    source_ip:   str = "Unknown"
    dest_ip:     str = "Unknown"
    protocol:    str = "Unknown"
    packet_size: int = 0

class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    is_attack:  bool
    alert_id:   int = None

@router.post("/predict", response_model=PredictResponse)
def predict(
    req: PredictRequest,
    db: Session = Depends(get_db)
):
    if nids_model.model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run train.py first."
        )

    result = nids_model.predict(req.features)

    # Log every traffic entry
    log = TrafficLog(
        source_ip   = req.source_ip,
        dest_ip     = req.dest_ip,
        protocol    = req.protocol,
        packet_size = req.packet_size,
        label       = result["label"]
    )
    db.add(log)

    alert_id = None

    if result["is_attack"]:
        alert = Alert(
            source_ip   = req.source_ip,
            dest_ip     = req.dest_ip,
            protocol    = req.protocol,
            attack_type = result["label"],
            confidence  = result["confidence"] / 100,
            status      = "Active",
            details     = f"Detected at {datetime.now()}"
        )
        db.add(alert)
        db.flush()
        alert_id = alert.id

    db.commit()

    return PredictResponse(
        prediction = result["label"],
        confidence = result["confidence"],
        is_attack  = result["is_attack"],
        alert_id   = alert_id
    )
