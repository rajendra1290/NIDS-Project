from sqlalchemy import (create_engine, Column,
    Integer, String, DateTime, Float, Text)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./nids.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
Base = declarative_base()

class Alert(Base):
    __tablename__ = "alerts"

    id          = Column(Integer, primary_key=True, index=True)
    timestamp   = Column(DateTime, default=datetime.now)
    source_ip   = Column(String, default="Unknown")
    dest_ip     = Column(String, default="Unknown")
    protocol    = Column(String, default="Unknown")
    attack_type = Column(String, default="Unknown")
    confidence  = Column(Float, default=0.0)
    status      = Column(String, default="Active")
    details     = Column(Text, default="")

class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id          = Column(Integer, primary_key=True, index=True)
    timestamp   = Column(DateTime, default=datetime.now)
    source_ip   = Column(String)
    dest_ip     = Column(String)
    protocol    = Column(String)
    packet_size = Column(Integer)
    label       = Column(String)  # Normal or Attack

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
