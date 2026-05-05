from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db, Alert, TrafficLog
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/alerts")
def get_alerts(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(Alert)
        .order_by(Alert.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id":          a.id,
            "timestamp":   a.timestamp.isoformat(),
            "source_ip":   a.source_ip,
            "dest_ip":     a.dest_ip,
            "protocol":    a.protocol,
            "attack_type": a.attack_type,
            "confidence":  round(a.confidence * 100, 2),
            "status":      a.status,
            "details":     a.details
        }
        for a in alerts
    ]

@router.get("/alerts/stats")
def get_stats(db: Session = Depends(get_db)):
    total         = db.query(Alert).count()
    active        = db.query(Alert).filter(
        Alert.status == "Active").count()
    resolved      = db.query(Alert).filter(
        Alert.status == "Resolved").count()
    total_traffic  = db.query(TrafficLog).count()
    normal_traffic = db.query(TrafficLog).filter(
        TrafficLog.label == "Normal").count()

    since    = datetime.now() - timedelta(hours=24)
    last_24h = db.query(Alert).filter(
        Alert.timestamp >= since).count()

    return {
        "total_alerts":    total,
        "active_alerts":   active,
        "resolved_alerts": resolved,
        "total_traffic":   total_traffic,
        "normal_traffic":  normal_traffic,
        "attack_traffic":  total_traffic - normal_traffic,
        "last_24h_alerts": last_24h
    }

@router.patch("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404, detail="Alert not found")
    alert.status = "Resolved"
    db.commit()
    return {"message": f"Alert {alert_id} resolved ✅"}

@router.delete("/alerts/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": f"Alert {alert_id} deleted ✅"}

@router.delete("/alerts")
def clear_all_alerts(db: Session = Depends(get_db)):
    db.query(Alert).delete()
    db.commit()
    return {"message": "All alerts cleared ✅"}
