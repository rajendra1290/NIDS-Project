# 🔐 Network Intrusion Detection System (NIDS)

A full-stack NIDS built with FastAPI (Python) backend
and React frontend using ML (Random Forest) on KDD Cup 99 dataset.

---

## 📁 Project Structure

```
NIDS-Project/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── database/
│   │   └── db.py
│   ├── ml/
│   │   ├── preprocess.py
│   │   ├── train.py
│   │   └── model.py
│   └── routes/
│       ├── predict.py
│       ├── alerts.py
│       └── stats.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── api/
│       │   └── axios.js
│       └── components/
│           ├── Navbar.jsx
│           ├── Dashboard.jsx
│           ├── StatsCards.jsx
│           ├── TrafficChart.jsx
│           └── AlertTable.jsx
└── dataset/
    ├── kddtrain.csv   ← Download separately
    └── kddtest.csv    ← Download separately
```

---

## ⚙️ Setup & Run

### Step 1 — Get Dataset
Download from: https://github.com/rahulvigneswaran/Intrusion-Detection-Systems
Place `kddtrain.csv` and `kddtest.csv` in the `dataset/` folder.

### Step 2 — Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

### Step 3 — Train ML Model (first time only)
```bash
cd backend/ml
python train.py
```

### Step 4 — Start Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Step 5 — Start Frontend
```bash
cd frontend
npm install
npm run dev
```

python simulate_nids.py

## 🌐 URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | React Dashboard |
| http://localhost:8000/docs | FastAPI Swagger UI |
| http://localhost:8000/health | Health Check |

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **ML**: Scikit-learn (Random Forest), Pandas, NumPy
- **Frontend**: React, Recharts, Axios, Vite
- **Dataset**: KDD Cup 99
