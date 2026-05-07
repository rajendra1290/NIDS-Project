"""
Live Packet Sniffer — NIDS Mode 2
Captures real network packets and sends to FastAPI for prediction.
Run with Admin/Root privileges!
"""

from scapy.all import sniff, IP, TCP, UDP, ICMP, get_if_list
import requests
import threading
import time
import sys
import os
from datetime import datetime
from collections import defaultdict

API_URL     = "http://localhost:8000/api/predict"
BACKEND_URL = "http://localhost:8000/health"

# ── Connection tracker (for better feature extraction) ────────────
connection_tracker = defaultdict(lambda: {
    "count": 0, "srv_count": 0,
    "serror_rate": 0.0, "rerror_rate": 0.0,
    "same_srv_rate": 1.0, "diff_srv_rate": 0.0,
    "last_seen": time.time()
})

# Stats
stats = {"total": 0, "attacks": 0, "normal": 0, "errors": 0}

# ── Feature Extraction ────────────────────────────────────────────
def extract_features(packet):
    """
    Extract 41 NSL-KDD style features from a live packet.
    Returns list of 41 floats.
    """
    features = [0.0] * 41

    if IP not in packet:
        return None

    src_ip  = packet[IP].src
    dst_ip  = packet[IP].dst
    pkt_len = len(packet)

    # ── Feature 0: duration (0 for single packets)
    features[0] = 0.0

    # ── Feature 1: protocol_type (0=tcp, 1=udp, 2=icmp)
    if TCP in packet:
        features[1] = 0.0
    elif UDP in packet:
        features[1] = 1.0
    elif ICMP in packet:
        features[2] = 2.0

    # ── Feature 2: service (simplified port mapping)
    port = 0
    if TCP in packet:
        port = packet[TCP].dport
    elif UDP in packet:
        port = packet[UDP].dport

    service_map = {
        80: 10, 443: 11, 22: 12, 23: 13,
        21: 14, 25: 15, 53: 16, 110: 17,
        143: 18, 3306: 19, 8080: 20
    }
    features[2] = float(service_map.get(port, 0))

    # ── Feature 3: flag (TCP flags)
    features[3] = 0.0
    if TCP in packet:
        flags = int(packet[TCP].flags)
        # SF=normal, REJ=reset, S0=SYN only (possible attack)
        if flags & 0x01 and flags & 0x10:  # FIN+ACK = SF
            features[3] = 1.0
        elif flags & 0x04:                  # RST = REJ
            features[3] = 2.0
        elif flags == 0x02:                 # SYN only = S0
            features[3] = 3.0

    # ── Feature 4: src_bytes
    features[4] = float(pkt_len)

    # ── Feature 5: dst_bytes (0 for outgoing)
    features[5] = 0.0

    # ── Feature 6: land (1 if src==dst)
    features[6] = 1.0 if src_ip == dst_ip else 0.0

    # ── Feature 7: wrong_fragment
    if hasattr(packet[IP], 'frag'):
        features[7] = float(packet[IP].frag)

    # ── Feature 8: urgent
    if TCP in packet and hasattr(packet[TCP], 'urgptr'):
        features[8] = float(packet[TCP].urgptr)

    # ── Features 9-21: mostly 0 for single packets
    features[9]  = 0.0   # hot
    features[10] = 0.0   # num_failed_logins
    features[11] = 1.0   # logged_in (assume yes)
    features[12] = 0.0   # num_compromised
    features[13] = 0.0   # root_shell
    features[14] = 0.0   # su_attempted
    features[15] = 0.0   # num_root
    features[16] = 0.0   # num_file_creations
    features[17] = 0.0   # num_shells
    features[18] = 0.0   # num_access_files
    features[19] = 0.0   # num_outbound_cmds
    features[20] = 0.0   # is_host_login
    features[21] = 0.0   # is_guest_login

    # ── Features 22-30: connection-based (from tracker)
    key = f"{src_ip}:{dst_ip}"
    tracker = connection_tracker[key]
    tracker["count"] += 1
    tracker["last_seen"] = time.time()

    features[22] = min(float(tracker["count"]), 511.0)  # count
    features[23] = min(float(tracker["srv_count"]), 511.0)  # srv_count
    features[24] = tracker["serror_rate"]
    features[25] = tracker["serror_rate"]
    features[26] = tracker["rerror_rate"]
    features[27] = tracker["rerror_rate"]
    features[28] = tracker["same_srv_rate"]
    features[29] = tracker["diff_srv_rate"]
    features[30] = 0.0

    # ── Features 31-40: host-based
    features[31] = 255.0  # dst_host_count
    features[32] = 255.0  # dst_host_srv_count
    features[33] = 1.0    # dst_host_same_srv_rate
    features[34] = 0.0    # dst_host_diff_srv_rate
    features[35] = 0.01   # dst_host_same_src_port_rate
    features[36] = 0.0    # dst_host_srv_diff_host_rate
    features[37] = 0.0    # dst_host_serror_rate
    features[38] = 0.0    # dst_host_srv_serror_rate
    features[39] = 0.0    # dst_host_rerror_rate
    features[40] = 0.0    # dst_host_srv_rerror_rate

    # ── SYN flood detection heuristic
    if TCP in packet and int(packet[TCP].flags) == 0x02:
        tracker["serror_rate"] = min(
            tracker["serror_rate"] + 0.1, 1.0)
        features[24] = tracker["serror_rate"]
        features[37] = tracker["serror_rate"]

    return features


# ── Send to API ───────────────────────────────────────────────────
def send_to_api(packet):
    """Send extracted features to FastAPI backend."""
    try:
        if IP not in packet:
            return

        features = extract_features(packet)
        if features is None:
            return

        src_ip      = packet[IP].src
        dst_ip      = packet[IP].dst
        protocol    = "tcp"  if TCP  in packet else \
                      "udp"  if UDP  in packet else \
                      "icmp" if ICMP in packet else "other"
        packet_size = len(packet)

        payload = {
            "features":    features,
            "source_ip":   src_ip,
            "dest_ip":     dst_ip,
            "protocol":    protocol,
            "packet_size": packet_size
        }

        stats["total"] += 1

        def post():
            try:
                r = requests.post(
                    API_URL, json=payload, timeout=2)
                result = r.json()
                if result.get("is_attack"):
                    stats["attacks"] += 1
                    ts = datetime.now().strftime("%H:%M:%S")
                    print(
                        f"  🚨 [{ts}] ATTACK from {src_ip}"
                        f" → {dst_ip} | {protocol.upper()}"
                        f" | conf: {result.get('confidence')}%"
                    )
                else:
                    stats["normal"] += 1
            except Exception:
                stats["errors"] += 1

        threading.Thread(target=post, daemon=True).start()

    except Exception as e:
        stats["errors"] += 1


# ── Print live stats ──────────────────────────────────────────────
def print_stats():
    while True:
        time.sleep(10)
        ts = datetime.now().strftime("%H:%M:%S")
        print(
            f"\n  📊 [{ts}] Stats → "
            f"Total: {stats['total']} | "
            f"Normal: {stats['normal']} | "
            f"Attacks: {stats['attacks']} | "
            f"Errors: {stats['errors']}\n"
        )


# ── Check backend reachable ───────────────────────────────────────
def check_backend():
    try:
        r = requests.get(BACKEND_URL, timeout=3)
        if r.status_code == 200:
            print("  ✅ Backend connected at :8000")
            return True
    except Exception:
        pass
    print("  ❌ Backend NOT reachable!")
    print("  ➡  Run: uvicorn main:app --reload --port 8000")
    return False


# ── List interfaces ───────────────────────────────────────────────
def list_interfaces():
    print("\n  📋 Available Network Interfaces:")
    ifaces = get_if_list()
    for i, iface in enumerate(ifaces):
        print(f"    [{i}] {iface}")
    print()
    return ifaces


# ── Main ──────────────────────────────────────────────────────────
def start_sniffing(interface=None, packet_count=0):
    print("\n" + "="*55)
    print("  🔐 NIDS — Live Network Packet Capture")
    print("="*55)

    if not check_backend():
        sys.exit(1)

    ifaces = list_interfaces()

    # Ask user to pick interface if not specified
    if interface is None:
        try:
            choice = input(
                "  Pick interface number "
                "(Enter = capture all): ").strip()
            if choice.isdigit():
                interface = ifaces[int(choice)]
                print(f"\n  ✅ Using: {interface}")
            else:
                print("\n  ✅ Capturing on ALL interfaces")
        except (KeyboardInterrupt, IndexError):
            print("\n  ✅ Capturing on ALL interfaces")

    print(f"\n  🎯 Filter: IP packets only")
    print(f"  📡 Starting capture... (Ctrl+C to stop)\n")

    # Stats printer thread
    threading.Thread(target=print_stats,
                     daemon=True).start()

    try:
        sniff(
            iface   = interface,
            prn     = send_to_api,
            store   = False,
            count   = packet_count,
            filter  = "ip"
        )
    except PermissionError:
        print("\n  ❌ Permission denied!")
        print("  ➡  Run VS Code / terminal as ADMINISTRATOR")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n  🛑 Capture stopped.")
        print(f"  📊 Final — Total: {stats['total']} | "
              f"Attacks: {stats['attacks']} | "
              f"Normal: {stats['normal']}")


if __name__ == "__main__":
    # Optional: pass interface as argument
    # python packet_sniffer.py "Wi-Fi"
    iface = sys.argv[1] if len(sys.argv) > 1 else None
    start_sniffing(interface=iface)
