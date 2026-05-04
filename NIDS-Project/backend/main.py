import sys

# Avoid UnicodeEncodeError on Windows consoles (cp1252) when titles/logs use UTF-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
from routes import predict, alerts, stats

app = FastAPI(
    title="🔐 NIDS API",
    description="Network Intrusion Detection System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
init_db()

# Register all routes
app.include_router(predict.router, prefix="/api",
                   tags=["Prediction"])
app.include_router(alerts.router,  prefix="/api",
                   tags=["Alerts"])
app.include_router(stats.router,   prefix="/api",
                   tags=["Stats"])


@app.get("/api")
def api_root():
    """Avoid 404 when opening /api in the browser; lists real routes."""
    return {
        "message": "NIDS API — use these paths (base URL already includes /api)",
        "docs": "/docs",
        "health": "/health",
        "routes": {
            "POST /api/predict": "Run intrusion prediction",
            "GET /api/alerts": "List alerts",
            "GET /api/alerts/stats": "Dashboard summary counts",
            "GET /api/stats/traffic": "Traffic series for charts",
            "GET /api/stats/protocols": "Protocol breakdown",
        },
    }


@app.get("/")
def root():
    return {
        "message": "🔐 NIDS API is Running!",
        "docs":    "http://localhost:8000/docs",
        "version": "2.0.0"
    }

@app.get("/health")
def health():
    return {"status": "✅ healthy"}
