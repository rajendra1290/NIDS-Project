from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db, Alert, TrafficLog
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats/traffic")
def traffic_over_time(db: Session = Depends(get_db)):
    result = []
    for i in range(7, -1, -1):
        day   = datetime.now() - timedelta(days=i)
        start = day.replace(hour=0,  minute=0,  second=0)
        end   = day.replace(hour=23, minute=59, second=59)

        normal = db.query(TrafficLog).filter(
            TrafficLog.timestamp.between(start, end),
            TrafficLog.label == "Normal"
        ).count()

        attack = db.query(TrafficLog).filter(
            TrafficLog.timestamp.between(start, end),
            TrafficLog.label == "Attack"
        ).count()

        result.append({
            "date":   day.strftime("%b %d"),
            "Normal": normal,
            "Attack": attack
        })
    return result

@router.get("/stats/protocols")
def protocol_breakdown(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Alert.protocol,
            func.count(Alert.id).label("count")
        )
        .group_by(Alert.protocol)
        .all()
    )
    return [{"protocol": r.protocol,
             "count":    r.count} for r in rows]
