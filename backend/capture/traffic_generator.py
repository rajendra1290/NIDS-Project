"""
Traffic Generator — Demo/Testing ke liye
Fake normal aur attack traffic generate karta hai API pe
Scapy ya Admin privileges ki zaroorat NAHI hai!
"""

import requests
import random
import time
import threading
from datetime import datetime

API_URL = "http://localhost:8000/api/predict"

# ── Normal traffic templates ──────────────────────────────────────
NORMAL_TEMPLATES = [
    # HTTP traffic
    {"duration":0,"protocol":0,"service":10,"flag":1,
     "src_bytes":215,"dst_bytes":45076,
     "serror_rate":0.0,"rerror_rate":0.0,
     "same_srv_rate":1.0,"diff_srv_rate":0.0,
     "count":1,"srv_count":1},
    # HTTPS traffic
    {"duration":0,"protocol":0,"service":11,"flag":1,
     "src_bytes":300,"dst_bytes":60000,
     "serror_rate":0.0,"rerror_rate":0.0,
     "same_srv_rate":1.0,"diff_srv_rate":0.0,
     "count":2,"srv_count":2},
    # DNS traffic
    {"duration":0,"protocol":1,"service":16,"flag":0,
     "src_bytes":64,"dst_bytes":120,
     "serror_rate":0.0,"rerror_rate":0.0,
     "same_srv_rate":1.0,"diff_srv_rate":0.0,
     "count":1,"srv_count":1},
]

# ── Attack traffic templates ──────────────────────────────────────
ATTACK_TEMPLATES = [
    # DoS — Neptune (SYN flood)
    {"duration":0,"protocol":0,"service":0,"flag":3,
     "src_bytes":0,"dst_bytes":0,
     "serror_rate":1.0,"rerror_rate":0.0,
     "same_srv_rate":1.0,"diff_srv_rate":0.0,
     "count":511,"srv_count":511},
    # Probe — PortSweep
    {"duration":0,"protocol":0,"service":0,"flag":2,
     "src_bytes":0,"dst_bytes":0,
     "serror_rate":0.0,"rerror_rate":1.0,
     "same_srv_rate":0.06,"diff_srv_rate":0.06,
     "count":1,"srv_count":19},
    # DoS — Smurf
    {"duration":0,"protocol":2,"service":8,"flag":0,
     "src_bytes":1032,"dst_bytes":0,
     "serror_rate":0.0,"rerror_rate":0.0,
     "same_srv_rate":1.0,"diff_srv_rate":0.0,
     "count":511,"srv_count":511},
]

NORMAL_IPS = [
    "192.168.1.10","192.168.1.15","192.168.1.20",
    "192.168.1.25","10.0.0.5","10.0.0.10"
]
ATTACK_IPS = [
    "45.33.32.156","198.51.100.1","203.0.113.5",
    "172.16.0.99","10.10.10.10"
]
PROTOCOLS = ["tcp","udp","icmp"]


def make_features(t, noise=True):
    """Template se 41 features banao"""
    f = [0.0] * 41
    f[0]  = float(t.get("duration", 0))
    f[1]  = float(t.get("protocol", 0))
    f[2]  = float(t.get("service", 0))
    f[3]  = float(t.get("flag", 0))
    f[4]  = float(t.get("src_bytes", 0)) + (
                random.uniform(-10,10) if noise else 0)
    f[5]  = float(t.get("dst_bytes", 0)) + (
                random.uniform(-100,100) if noise else 0)
    f[22] = float(t.get("count", 1))
    f[23] = float(t.get("srv_count", 1))
    f[24] = float(t.get("serror_rate", 0))
    f[25] = float(t.get("serror_rate", 0))
    f[26] = float(t.get("rerror_rate", 0))
    f[27] = float(t.get("rerror_rate", 0))
    f[28] = float(t.get("same_srv_rate", 1.0))
    f[29] = float(t.get("diff_srv_rate", 0))
    f[31] = 255.0
    f[32] = 255.0
    f[33] = float(t.get("same_srv_rate", 1.0))
    return f


def send_packet(features, src_ip, dst_ip, protocol):
    try:
        payload = {
            "features":    features,
            "source_ip":   src_ip,
            "dest_ip":     dst_ip,
            "protocol":    protocol,
            "packet_size": int(features[4])
        }
        r = requests.post(API_URL, json=payload, timeout=3)
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def generate_normal(count=1):
    """Normal traffic generate karo"""
    results = []
    for _ in range(count):
        t        = random.choice(NORMAL_TEMPLATES)
        features = make_features(t)
        src_ip   = random.choice(NORMAL_IPS)
        dst_ip   = f"8.8.{random.randint(1,254)}.{random.randint(1,254)}"
        protocol = PROTOCOLS[int(t.get("protocol",0))]
        result   = send_packet(features, src_ip,
                               dst_ip, protocol)
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"  ✅ [{ts}] NORMAL  | {src_ip} → {dst_ip}"
              f" | {protocol.upper()}"
              f" | {result.get('confidence','?')}%")
        results.append(result)
    return results


def generate_attack(count=1, attack_type=None):
    """Attack traffic generate karo"""
    results = []
    templates = ATTACK_TEMPLATES
    if attack_type == "dos":
        templates = [ATTACK_TEMPLATES[0]]
    elif attack_type == "probe":
        templates = [ATTACK_TEMPLATES[1]]

    for _ in range(count):
        t        = random.choice(templates)
        features = make_features(t, noise=False)
        src_ip   = random.choice(ATTACK_IPS)
        dst_ip   = random.choice(NORMAL_IPS)
        protocol = PROTOCOLS[int(t.get("protocol",0))]
        result   = send_packet(features, src_ip,
                               dst_ip, protocol)
        ts = datetime.now().strftime("%H:%M:%S")
        label = result.get('prediction','?')
        conf  = result.get('confidence','?')
        print(f"  🚨 [{ts}] ATTACK  | {src_ip} → {dst_ip}"
              f" | {protocol.upper()}"
              f" | pred:{label} | {conf}%")
        results.append(result)
    return results


def run_demo_scenario(scenario="mixed",
                      packets=20, delay=0.5):
    """
    Demo scenario chalao:
    - 'mixed'   : normal + attack mix
    - 'dos'     : DoS attack simulation
    - 'probe'   : Port scan simulation
    - 'normal'  : Only normal traffic
    """
    print("\n" + "="*55)
    print(f"  🎬 Demo Scenario: {scenario.upper()}")
    print(f"  📦 Packets: {packets} | Delay: {delay}s")
    print("="*55 + "\n")

    for i in range(packets):
        if scenario == "normal":
            generate_normal(1)
        elif scenario == "dos":
            generate_attack(1, "dos")
        elif scenario == "probe":
            generate_attack(1, "probe")
        elif scenario == "mixed":
            # 70% normal, 30% attack
            if random.random() < 0.7:
                generate_normal(1)
            else:
                generate_attack(1)
        time.sleep(delay)

    print(f"\n  ✅ Scenario complete! "
          f"Check dashboard at http://localhost:5173")


def run_continuous(normal_rate=3, attack_rate=1):
    """
    Continuously generate traffic.
    normal_rate: normal packets per second
    attack_rate: attack packets per minute
    """
    print("\n" + "="*55)
    print("  🔄 Continuous Traffic Generator")
    print(f"  Normal: {normal_rate}/sec | "
          f"Attack: {attack_rate}/min")
    print("  Ctrl+C to stop")
    print("="*55 + "\n")

    attack_counter = 0
    attacks_per_cycle = max(1, 60 // attack_rate)

    try:
        while True:
            generate_normal(normal_rate)
            attack_counter += 1
            if attack_counter >= attacks_per_cycle:
                generate_attack(1)
                attack_counter = 0
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  🛑 Generator stopped.")


# ── Menu ──────────────────────────────────────────────────────────
def main():
    print("\n" + "="*55)
    print("  🔐 NIDS Traffic Generator")
    print("  Backend: http://localhost:8000")
    print("="*55)

    # Check backend
    try:
        r = requests.get(
            "http://localhost:8000/health", timeout=3)
        print("  ✅ Backend connected!\n")
    except Exception:
        print("  ❌ Backend not reachable!")
        print("  ➡  Pehle run karo: "
              "uvicorn main:app --reload --port 8000\n")
        return

    print("  Choose mode:")
    print("  [1] Mixed traffic demo (recommended)")
    print("  [2] DoS attack simulation")
    print("  [3] Port scan simulation")
    print("  [4] Normal traffic only")
    print("  [5] Continuous generator")
    print()

    choice = input("  Enter choice (1-5): ").strip()

    if choice == "1":
        n = input("  Packets (default 20): ").strip()
        run_demo_scenario("mixed",
                          int(n) if n.isdigit() else 20)
    elif choice == "2":
        n = input("  Attack packets (default 10): ").strip()
        run_demo_scenario("dos",
                          int(n) if n.isdigit() else 10,
                          delay=0.3)
    elif choice == "3":
        run_demo_scenario("probe", 15, delay=0.4)
    elif choice == "4":
        n = input("  Packets (default 20): ").strip()
        run_demo_scenario("normal",
                          int(n) if n.isdigit() else 20)
    elif choice == "5":
        run_continuous()
    else:
        print("  Invalid choice!")


if __name__ == "__main__":
    main()
