import { useState, useEffect, useCallback, useRef, memo } from "react"
import API from "./api/axios"
import "./App.css"

// ── Clock — isolated so it NEVER triggers parent re-render ──────
const Clock = memo(() => {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span>{t.toLocaleTimeString()}</span>
})

// ── Icons (inline SVG) ──────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    shield:    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/>,
    activity:  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    alert:     <><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    chart:     <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    network:   <><circle cx="12" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><circle cx="5" cy="19" r="3"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="12" y1="14" x2="19" y2="16"/><line x1="12" y1="14" x2="5" y2="16"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    check:     <polyline points="20 6 9 17 4 12"/>,
    trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    refresh:   <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
    cpu:       <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
    zap:       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    server:    <><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    wifi:      <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 16 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display:"inline-block", verticalAlign:"middle" }}>
      {icons[name]}
    </svg>
  )
}

// ── Sparkline mini chart ──────────────────────────────────────────
const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 32
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - (v / max) * h}`
  ).join(" ")
  return (
    <svg width={w} height={h} style={{ opacity: 0.8 }}>
      <polyline points={pts} fill="none"
        stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, spark }) => (
  <div className="stat-card" style={{ "--accent": color }}>
    <div className="stat-top">
      <span className="stat-icon" style={{ color }}>
        <Icon name={icon} size={20}/>
      </span>
      <Sparkline data={spark} color={color}/>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
)

// ── Badge ─────────────────────────────────────────────────────────
const Badge = ({ children, type }) => {
  const colors = {
    attack:   { bg:"rgba(239,68,68,.15)",   text:"#f87171" },
    normal:   { bg:"rgba(34,197,94,.15)",   text:"#4ade80" },
    active:   { bg:"rgba(239,68,68,.15)",   text:"#f87171" },
    resolved: { bg:"rgba(34,197,94,.15)",   text:"#4ade80" },
    high:     { bg:"rgba(239,68,68,.15)",   text:"#f87171" },
    medium:   { bg:"rgba(251,191,36,.15)",  text:"#fbbf24" },
    low:      { bg:"rgba(96,165,250,.15)",  text:"#60a5fa" },
  }
  const c = colors[type] || colors.low
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "uppercase"
    }}>{children}</span>
  )
}

// ── Mini Bar Chart ────────────────────────────────────────────────
const MiniBarChart = ({ data }) => {
  if (!data?.length) return (
    <div style={{ color:"#4b5563", textAlign:"center",
                  padding:"40px 0" }}>No traffic data yet</div>
  )
  const maxN = Math.max(...data.map(d => d.Normal), 1)
  const maxA = Math.max(...data.map(d => d.Attack), 1)
  const maxV = Math.max(maxN, maxA, 1)
  return (
    <div style={{ display:"flex", alignItems:"flex-end",
                  gap:"6px", height:"140px",
                  padding:"0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex",
                              flexDirection:"column",
                              alignItems:"center", gap:"2px" }}>
          <div style={{ width:"100%", display:"flex",
                        gap:"2px", alignItems:"flex-end",
                        height:"110px" }}>
            <div style={{
              flex:1, background:"#22c55e",
              height: `${(d.Normal / maxV) * 100}%`,
              borderRadius:"3px 3px 0 0", minHeight:"2px",
              transition:"height .5s ease"
            }}/>
            <div style={{
              flex:1, background:"#ef4444",
              height: `${(d.Attack / maxV) * 100}%`,
              borderRadius:"3px 3px 0 0", minHeight:"2px",
              transition:"height .5s ease"
            }}/>
          </div>
          <div style={{ fontSize:"9px", color:"#6b7280",
                        whiteSpace:"nowrap" }}>{d.date}</div>
        </div>
      ))}
    </div>
  )
}

// ── Protocol Donut ────────────────────────────────────────────────
const ProtocolDonut = ({ data }) => {
  if (!data?.length) return (
    <div style={{ color:"#4b5563", textAlign:"center",
                  padding:"40px 0" }}>No protocol data</div>
  )
  const total = data.reduce((s, d) => s + d.count, 0) || 1
  const colors = ["#60a5fa","#f472b6","#34d399","#fbbf24","#a78bfa"]
  let cumulative = 0
  const size = 120, r = 45, cx = 60, cy = 60
  const circumference = 2 * Math.PI * r
  return (
    <div style={{ display:"flex", alignItems:"center",
                  gap:"24px", flexWrap:"wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.slice(0,5).map((d, i) => {
          const pct = d.count / total
          const offset = circumference * (1 - cumulative)
          const dash = circumference * pct
          cumulative += pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={colors[i]} strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              style={{ transform:"rotate(-90deg)",
                       transformOrigin:"center",
                       transition:"stroke-dasharray .5s" }}/>
          )
        })}
        <text x={cx} y={cy} textAnchor="middle"
          dominantBaseline="middle"
          fill="#f9fafb" fontSize="11"
          fontWeight="700">{total}</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
        {data.slice(0,5).map((d, i) => (
          <div key={i} style={{ display:"flex",
                                alignItems:"center", gap:"8px",
                                fontSize:"13px" }}>
            <div style={{ width:"10px", height:"10px",
                          borderRadius:"50%",
                          background: colors[i] }}/>
            <span style={{ color:"#9ca3af" }}>{d.protocol}</span>
            <span style={{ color:"#f9fafb", fontWeight:600,
                           marginLeft:"auto" }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TABS ──────────────────────────────────────────────────────────
const TABS = [
  { id:"overview",  label:"Overview",   icon:"activity" },
  { id:"alerts",    label:"Alerts",     icon:"alert"    },
  { id:"traffic",   label:"Traffic",    icon:"chart"    },
  { id:"predict",   label:"Predict",    icon:"search"   },
  { id:"system",    label:"System",     icon:"server"   },
]

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [tab,      setTab]      = useState("overview")
  const [stats,    setStats]    = useState({})
  const [alerts,   setAlerts]   = useState([])
  const [traffic,  setTraffic]  = useState([])
  const [protocol, setProtocol] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [sparkData] = useState({
    total:   [4,7,3,9,5,12,8,15],
    active:  [2,3,1,5,2,7,4,9],
    traffic: [20,35,28,42,31,50,38,60],
    normal:  [18,30,25,38,28,44,33,52],
  })

  // Predict tab state
  const [features,    setFeatures]    = useState(Array(41).fill(""))
  const [predResult,  setPredResult]  = useState(null)
  const [predLoading, setPredLoading] = useState(false)

  const initialLoad = useRef(true)

  const fetchAll = useCallback(async () => {
    try {
      const [s, a, t, p] = await Promise.all([
        API.get("/alerts/stats"),
        API.get("/alerts"),
        API.get("/stats/traffic"),
        API.get("/stats/protocols"),
      ])
      // Batch all state updates together to avoid multiple re-renders
      setStats(s.data)
      setAlerts(a.data)
      setTraffic(t.data)
      setProtocol(p.data)
      setError(null)
    } catch {
      setError("Cannot connect to backend — make sure FastAPI is running on :8000")
    } finally {
      // Only set loading false on very first fetch
      if (initialLoad.current) {
        setLoading(false)
        initialLoad.current = false
      }
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const dataInt = setInterval(fetchAll, 8000)
    return () => clearInterval(dataInt)
  }, [fetchAll])

  // Alert actions
  const resolveAlert = async (id) => {
    await API.patch(`/alerts/${id}/resolve`)
    fetchAll()
  }
  const deleteAlert = async (id) => {
    await API.delete(`/alerts/${id}`)
    fetchAll()
  }
  const clearAlerts = async () => {
    if (!window.confirm("Clear all alerts?")) return
    await API.delete("/alerts")
    fetchAll()
  }

  // Predict
  const handlePredict = async () => {
    const nums = features.map(f => parseFloat(f) || 0)
    if (nums.length !== 41) return
    setPredLoading(true)
    try {
      const res = await API.post("/predict", {
        features: nums,
        source_ip: "192.168.1.1",
        dest_ip:   "10.0.0.1",
        protocol:  "tcp"
      })
      setPredResult(res.data)
    } catch {
      setPredResult({ error: "Prediction failed" })
    }
    setPredLoading(false)
  }

  const fillSample = (type) => {
    if (type === "normal") {
      setFeatures(["0","tcp","http","SF","215","45076","0","0","0","0",
        "0","1","0","0","0","0","0","0","0","0","0","0","1","1","0.0",
        "0.0","0.0","0.0","1.0","0.0","0.0","0","0","0.0","0.0","0.0",
        "0.0","0.0","0.0","0.0","0.0"])
    } else {
      setFeatures(["0","tcp","private","REJ","0","0","0","0","0","0",
        "0","0","0","0","0","0","0","0","0","0","0","0","229","229",
        "0.0","0.0","1.0","1.0","0.0","1.0","0.0","255","255","1.0",
        "0.0","0.01","0.0","1.0","1.0","0.0","0.0"])
    }
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-orb"/>
      <div className="loading-text">
        <Icon name="shield" size={32}/>
        <span>Initializing NIDS...</span>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────
  //  TAB: OVERVIEW
  // ─────────────────────────────────────────────────────────────
  const TabOverview = () => (
    <div className="tab-content">
      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="alert"    label="Total Alerts"
          value={stats.total_alerts    || 0}
          sub={`+${stats.last_24h_alerts||0} last 24h`}
          color="#f87171" spark={sparkData.total}/>
        <StatCard icon="zap"      label="Active Threats"
          value={stats.active_alerts   || 0}
          sub="Needs attention"
          color="#fbbf24" spark={sparkData.active}/>
        <StatCard icon="check"    label="Resolved"
          value={stats.resolved_alerts || 0}
          sub="Cleared"
          color="#4ade80" spark={sparkData.total.map(v=>v*.6)}/>
        <StatCard icon="wifi"     label="Total Traffic"
          value={stats.total_traffic   || 0}
          sub="Packets analyzed"
          color="#60a5fa" spark={sparkData.traffic}/>
        <StatCard icon="activity" label="Normal Traffic"
          value={stats.normal_traffic  || 0}
          sub="Benign packets"
          color="#34d399" spark={sparkData.normal}/>
        <StatCard icon="eye"      label="Attack Traffic"
          value={stats.attack_traffic  || 0}
          sub="Malicious packets"
          color="#f472b6" spark={sparkData.total.map(v=>v*.4)}/>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="card">
          <div className="card-header">
            <span><Icon name="chart" size={16}/> Traffic (8 days)</span>
            <div className="legend">
              <span className="dot" style={{background:"#22c55e"}}/>Normal
              <span className="dot" style={{background:"#ef4444"}}/>Attack
            </div>
          </div>
          <MiniBarChart data={traffic}/>
        </div>
        <div className="card">
          <div className="card-header">
            <span><Icon name="network" size={16}/> Protocol Breakdown</span>
          </div>
          <ProtocolDonut data={protocol}/>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="card-header">
          <span><Icon name="alert" size={16}/> Recent Alerts</span>
          <button className="btn-ghost" onClick={() => setTab("alerts")}>
            View all →
          </button>
        </div>
        <AlertRows alerts={alerts.slice(0,5)}
          onResolve={resolveAlert} onDelete={deleteAlert}/>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────
  //  TAB: ALERTS
  // ─────────────────────────────────────────────────────────────
  const TabAlerts = () => {
    const [filter, setFilter] = useState("all")
    const filtered = alerts.filter(a =>
      filter === "all" ? true : a.status.toLowerCase() === filter)
    return (
      <div className="tab-content">
        <div className="card">
          <div className="card-header">
            <span><Icon name="alert" size={16}/> All Alerts
              <span className="count-badge">{filtered.length}</span>
            </span>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <div className="filter-tabs">
                {["all","active","resolved"].map(f => (
                  <button key={f}
                    className={`filter-btn ${filter===f?"active":""}`}
                    onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>
              <button className="btn-danger" onClick={clearAlerts}>
                <Icon name="trash" size={14}/> Clear All
              </button>
              <button className="btn-ghost" onClick={fetchAll}>
                <Icon name="refresh" size={14}/>
              </button>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="shield" size={40}/>
              <p>No alerts found</p>
            </div>
          ) : (
            <AlertRows alerts={filtered}
              onResolve={resolveAlert} onDelete={deleteAlert}
              showAll/>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  //  TAB: TRAFFIC
  // ─────────────────────────────────────────────────────────────
  const TabTraffic = () => (
    <div className="tab-content">
      <div className="stats-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <StatCard icon="wifi"   label="Total Packets"
          value={stats.total_traffic  || 0} color="#60a5fa"
          spark={sparkData.traffic}/>
        <StatCard icon="check"  label="Normal"
          value={stats.normal_traffic || 0} color="#4ade80"
          spark={sparkData.normal}/>
        <StatCard icon="zap"    label="Attacks"
          value={stats.attack_traffic || 0} color="#f87171"
          spark={sparkData.total.map(v=>v*.4)}/>
      </div>
      <div className="charts-row">
        <div className="card" style={{ flex:2 }}>
          <div className="card-header">
            <span><Icon name="chart" size={16}/> Daily Traffic Breakdown</span>
            <div className="legend">
              <span className="dot" style={{background:"#22c55e"}}/>Normal
              <span className="dot" style={{background:"#ef4444"}}/>Attack
            </div>
          </div>
          <MiniBarChart data={traffic}/>
          <div style={{ marginTop:"16px" }}>
            <table className="data-table">
              <thead><tr>
                <th>Date</th><th>Normal</th>
                <th>Attack</th><th>Total</th>
                <th>Attack %</th>
              </tr></thead>
              <tbody>
                {traffic.map((d,i) => {
                  const total = d.Normal + d.Attack || 1
                  const pct   = ((d.Attack/total)*100).toFixed(1)
                  return (
                    <tr key={i}>
                      <td>{d.date}</td>
                      <td style={{color:"#4ade80"}}>{d.Normal}</td>
                      <td style={{color:"#f87171"}}>{d.Attack}</td>
                      <td>{total}</td>
                      <td>
                        <div style={{ display:"flex",
                                      alignItems:"center", gap:"6px" }}>
                          <div style={{
                            width:"60px", height:"6px",
                            background:"#1f2937",
                            borderRadius:"3px", overflow:"hidden"
                          }}>
                            <div style={{
                              width:`${pct}%`, height:"100%",
                              background: parseFloat(pct)>30
                                ? "#ef4444" : "#fbbf24",
                              transition:"width .5s"
                            }}/>
                          </div>
                          <span style={{
                            color: parseFloat(pct)>30
                              ? "#f87171":"#fbbf24",
                            fontSize:"12px"
                          }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ flex:1 }}>
          <div className="card-header">
            <span><Icon name="network" size={16}/> Protocols</span>
          </div>
          <ProtocolDonut data={protocol}/>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────
  //  TAB: PREDICT
  // ─────────────────────────────────────────────────────────────
  const FEAT_NAMES = [
    "duration","protocol_type","service","flag","src_bytes",
    "dst_bytes","land","wrong_fragment","urgent","hot",
    "num_failed_logins","logged_in","num_compromised",
    "root_shell","su_attempted","num_root","num_file_creations",
    "num_shells","num_access_files","num_outbound_cmds",
    "is_host_login","is_guest_login","count","srv_count",
    "serror_rate","srv_serror_rate","rerror_rate","srv_rerror_rate",
    "same_srv_rate","diff_srv_rate","srv_diff_host_rate",
    "dst_host_count","dst_host_srv_count",
    "dst_host_same_srv_rate","dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate","dst_host_srv_diff_host_rate",
    "dst_host_serror_rate","dst_host_srv_serror_rate",
    "dst_host_rerror_rate","dst_host_srv_rerror_rate"
  ]

  const TabPredict = () => (
    <div className="tab-content">
      <div style={{ display:"grid",
                    gridTemplateColumns:"1fr 380px", gap:"20px" }}>
        {/* Input Panel */}
        <div className="card">
          <div className="card-header">
            <span><Icon name="search" size={16}/> Feature Input (41 features)</span>
            <div style={{ display:"flex", gap:"8px" }}>
              <button className="btn-ghost"
                onClick={() => fillSample("normal")}>
                Load Normal Sample
              </button>
              <button className="btn-ghost"
                onClick={() => fillSample("attack")}>
                Load Attack Sample
              </button>
            </div>
          </div>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(3,1fr)",
            gap:"8px", maxHeight:"480px",
            overflowY:"auto", paddingRight:"4px"
          }}>
            {FEAT_NAMES.map((name, i) => (
              <div key={i} className="feat-input-wrap">
                <label className="feat-label">{name}</label>
                <input
                  className="feat-input"
                  value={features[i] || ""}
                  onChange={e => {
                    const nf = [...features]
                    nf[i] = e.target.value
                    setFeatures(nf)
                  }}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop:"16px" }}>
            <button
              className="btn-primary"
              onClick={handlePredict}
              disabled={predLoading}
              style={{ width:"100%" }}>
              {predLoading
                ? "🔄 Analyzing..."
                : <><Icon name="search" size={16}/> Analyze Packet</>}
            </button>
          </div>
        </div>

        {/* Result Panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {predResult ? (
            predResult.error ? (
              <div className="card" style={{ borderColor:"#ef4444" }}>
                <div style={{ color:"#f87171", textAlign:"center",
                               padding:"20px" }}>
                  ❌ {predResult.error}
                </div>
              </div>
            ) : (
              <div className="card result-card"
                style={{
                  borderColor: predResult.is_attack
                    ? "#ef4444" : "#22c55e",
                  background: predResult.is_attack
                    ? "rgba(239,68,68,.05)"
                    : "rgba(34,197,94,.05)"
                }}>
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:"48px", marginBottom:"8px" }}>
                    {predResult.is_attack ? "🚨" : "✅"}
                  </div>
                  <div style={{
                    fontSize:"28px", fontWeight:800,
                    color: predResult.is_attack
                      ? "#f87171" : "#4ade80",
                    marginBottom:"8px"
                  }}>
                    {predResult.prediction}
                  </div>
                  <div style={{ color:"#9ca3af",
                                marginBottom:"20px" }}>
                    Confidence: {predResult.confidence}%
                  </div>
                  {/* Confidence Bar */}
                  <div style={{
                    background:"#1f2937",
                    borderRadius:"999px",
                    height:"8px",
                    overflow:"hidden",
                    margin:"0 20px"
                  }}>
                    <div style={{
                      width:`${predResult.confidence}%`,
                      height:"100%",
                      background: predResult.is_attack
                        ? "linear-gradient(90deg,#ef4444,#f97316)"
                        : "linear-gradient(90deg,#22c55e,#3b82f6)",
                      transition:"width 1s ease"
                    }}/>
                  </div>
                  {predResult.alert_id && (
                    <div style={{
                      marginTop:"16px", fontSize:"12px",
                      color:"#6b7280"
                    }}>
                      Alert #{predResult.alert_id} logged
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="card" style={{ textAlign:"center",
                                           padding:"40px 20px" }}>
              <Icon name="cpu" size={40}/>
              <p style={{ color:"#6b7280", marginTop:"12px" }}>
                Fill in features and click<br/>
                <strong style={{color:"#f9fafb"}}>Analyze Packet</strong>
              </p>
              <p style={{ color:"#4b5563", fontSize:"12px" }}>
                Or use the sample buttons to<br/>load pre-filled data
              </p>
            </div>
          )}

          {/* How it works */}
          <div className="card">
            <div className="card-header">
              <span><Icon name="cpu" size={14}/> How It Works</span>
            </div>
            <div style={{ fontSize:"13px", color:"#9ca3af",
                          lineHeight:"1.7" }}>
              <p>The model uses <strong style={{color:"#f9fafb"}}>
                Random Forest</strong> trained on NSL-KDD dataset
                with 41 network features.</p>
              <p>It classifies each packet as <strong
                style={{color:"#4ade80"}}>Normal</strong> or <strong
                style={{color:"#f87171"}}>Attack</strong> with
                a confidence score.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────
  //  TAB: SYSTEM
  // ─────────────────────────────────────────────────────────────
  const TabSystem = () => {
    const checks = [
      { label:"FastAPI Backend",   status:!error,  info:":8000" },
      { label:"ML Model Loaded",   status:true,    info:"Random Forest" },
      { label:"Database",          status:true,    info:"SQLite" },
      { label:"Auto-refresh",      status:true,    info:"Every 8s" },
      { label:"CORS Configured",   status:true,    info:"localhost:5173" },
      { label:"NSL-KDD Dataset",   status:true,    info:"KDDTrain+.txt" },
    ]
    const endpoints = [
      { method:"GET",    path:"/api/alerts",              desc:"Get all alerts" },
      { method:"GET",    path:"/api/alerts/stats",        desc:"Stats summary" },
      { method:"POST",   path:"/api/predict",             desc:"Predict packet" },
      { method:"PATCH",  path:"/api/alerts/{id}/resolve", desc:"Resolve alert" },
      { method:"DELETE", path:"/api/alerts/{id}",         desc:"Delete alert" },
      { method:"GET",    path:"/api/stats/traffic",       desc:"Traffic data" },
      { method:"GET",    path:"/api/stats/protocols",     desc:"Protocol data" },
    ]
    const methodColor = {
      GET:"#60a5fa", POST:"#4ade80",
      PATCH:"#fbbf24", DELETE:"#f87171"
    }
    return (
      <div className="tab-content">
        <div className="charts-row">
          {/* Health Checks */}
          <div className="card">
            <div className="card-header">
              <span><Icon name="server" size={16}/> System Health</span>
              <button className="btn-ghost" onClick={fetchAll}>
                <Icon name="refresh" size={14}/> Refresh
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column",
                          gap:"10px" }}>
              {checks.map((c, i) => (
                <div key={i} className="health-row">
                  <div className={`health-dot ${c.status?"ok":"err"}`}/>
                  <span style={{ flex:1, color:"#e5e7eb",
                                 fontSize:"14px" }}>{c.label}</span>
                  <span style={{ color:"#6b7280",
                                 fontSize:"12px" }}>{c.info}</span>
                  <Badge type={c.status?"normal":"active"}>
                    {c.status ? "OK" : "ERROR"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          {/* API Endpoints */}
          <div className="card">
            <div className="card-header">
              <span><Icon name="settings" size={16}/> API Endpoints</span>
              <a href="http://localhost:8000/docs"
                target="_blank" rel="noreferrer"
                className="btn-ghost" style={{ textDecoration:"none" }}>
                Swagger UI ↗
              </a>
            </div>
            <div style={{ display:"flex", flexDirection:"column",
                          gap:"6px" }}>
              {endpoints.map((e, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center",
                  gap:"10px", padding:"8px 10px",
                  background:"#111827", borderRadius:"6px",
                  fontSize:"13px"
                }}>
                  <span style={{
                    color: methodColor[e.method],
                    fontWeight:700, fontSize:"11px",
                    width:"52px", textAlign:"center",
                    background: methodColor[e.method]+"22",
                    padding:"2px 6px", borderRadius:"4px"
                  }}>{e.method}</span>
                  <span style={{ color:"#9ca3af",
                                 fontFamily:"monospace",
                                 flex:1 }}>{e.path}</span>
                  <span style={{ color:"#6b7280",
                                 fontSize:"12px" }}>{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Tech Stack */}
        <div className="card">
          <div className="card-header">
            <span><Icon name="cpu" size={16}/> Tech Stack</span>
          </div>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(4,1fr)", gap:"12px"
          }}>
            {[
              { name:"FastAPI",       role:"Backend API",       color:"#4ade80" },
              { name:"React + Vite",  role:"Frontend",          color:"#60a5fa" },
              { name:"Random Forest", role:"ML Model",          color:"#f472b6" },
              { name:"NSL-KDD",       role:"Dataset",           color:"#fbbf24" },
              { name:"SQLite",        role:"Database",          color:"#a78bfa" },
              { name:"SQLAlchemy",    role:"ORM",               color:"#34d399" },
              { name:"Scikit-learn",  role:"ML Library",        color:"#f97316" },
              { name:"Pandas/NumPy",  role:"Data Processing",   color:"#06b6d4" },
            ].map((t, i) => (
              <div key={i} style={{
                padding:"14px", background:"#111827",
                borderRadius:"8px",
                borderLeft:`3px solid ${t.color}`
              }}>
                <div style={{ color: t.color,
                               fontWeight:700,
                               fontSize:"14px" }}>{t.name}</div>
                <div style={{ color:"#6b7280",
                               fontSize:"12px",
                               marginTop:"2px" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  //  ALERT ROWS (shared component)
  // ─────────────────────────────────────────────────────────────
  function AlertRows({ alerts, onResolve, onDelete, showAll }) {
    if (!alerts?.length) return (
      <div className="empty-state">
        <Icon name="shield" size={36}/>
        <p>All clear — no alerts</p>
      </div>
    )
    return (
      <div style={{ overflowX:"auto" }}>
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>Time</th>
            <th>Source IP</th><th>Protocol</th>
            <th>Type</th><th>Confidence</th>
            <th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <td style={{ color:"#6b7280",
                             fontSize:"12px" }}>#{a.id}</td>
                <td style={{ fontSize:"12px",
                             whiteSpace:"nowrap",
                             color:"#9ca3af" }}>
                  {new Date(a.timestamp).toLocaleString()}
                </td>
                <td style={{ fontFamily:"monospace",
                             fontSize:"13px" }}>{a.source_ip}</td>
                <td><Badge type="low">{a.protocol}</Badge></td>
                <td><Badge type="attack">{a.attack_type}</Badge></td>
                <td>
                  <div style={{ display:"flex",
                                alignItems:"center", gap:"6px" }}>
                    <div style={{
                      width:"50px", height:"5px",
                      background:"#1f2937",
                      borderRadius:"3px", overflow:"hidden"
                    }}>
                      <div style={{
                        width:`${a.confidence}%`,
                        height:"100%",
                        background: a.confidence > 80
                          ? "#ef4444" : "#fbbf24"
                      }}/>
                    </div>
                    <span style={{ fontSize:"12px",
                                   color:"#9ca3af" }}>
                      {a.confidence}%
                    </span>
                  </div>
                </td>
                <td>
                  <Badge type={a.status.toLowerCase()}>
                    {a.status}
                  </Badge>
                </td>
                <td>
                  <div style={{ display:"flex", gap:"6px" }}>
                    {a.status === "Active" && (
                      <button className="action-btn green"
                        onClick={() => onResolve(a.id)}
                        title="Resolve">
                        <Icon name="check" size={13}/>
                      </button>
                    )}
                    <button className="action-btn red"
                      onClick={() => onDelete(a.id)}
                      title="Delete">
                      <Icon name="trash" size={13}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────
  const tabMap = {
    overview: <TabOverview/>,
    alerts:   <TabAlerts/>,
    traffic:  <TabTraffic/>,
    predict:  <TabPredict/>,
    system:   <TabSystem/>,
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Icon name="shield" size={24}/>
          <span>NIDS</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button key={t.id}
              className={`nav-item ${tab===t.id?"active":""}`}
              onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={18}/>
              <span>{t.label}</span>
              {t.id==="alerts" && (stats.active_alerts > 0) && (
                <span className="nav-badge">
                  {stats.active_alerts}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className={`pulse-dot ${error?"offline":"online"}`}/>
            <span>{error ? "Offline" : "Online"}</span>
          </div>
          <div style={{ fontSize:"11px", color:"#4b5563",
                        marginTop:"4px" }}>
            <Clock/>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <h1 className="page-title">
              {TABS.find(t => t.id===tab)?.label}
            </h1>
            <p className="page-sub">
              Network Intrusion Detection System
            </p>
          </div>
          <div style={{ display:"flex",
                        alignItems:"center", gap:"12px" }}>
            {error && (
              <div className="error-pill">
                ⚠ Backend offline
              </div>
            )}
            <button className="btn-ghost" onClick={fetchAll}>
              <Icon name="refresh" size={15}/> Refresh
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="content">
          {tabMap[tab]}
        </div>
      </main>
    </div>
  )
}
