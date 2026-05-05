import requests
import time
import pandas as pd

URL = "http://127.0.0.1:8000/api/predict"

df = pd.read_csv("../dataset/kddtest.csv")

for _, row in df.iterrows():
    data = {
        "features": row[:-1].tolist(),
        "source_ip": "simulated",
        "dest_ip": "server",
        "protocol": "TCP",
        "packet_size": 500
    }

    try:
        res = requests.post(URL, json=data, timeout=5)

        print("Status:", res.status_code)

        if res.status_code == 200:
            try:
                print("Response:", res.json())
            except:
                print("⚠️ Non-JSON response:", res.text)
        else:
            print("❌ Error response:", res.text)

    except requests.exceptions.RequestException as e:
        print("🚨 Request failed:", e)

    time.sleep(0.5)   # IMPORTANT: load kam karo