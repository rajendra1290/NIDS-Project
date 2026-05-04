import { useState, useEffect } from "react"
import API from "../api/axios"
import StatsCards   from "./StatsCards"
import TrafficChart from "./TrafficChart"
import AlertTable   from "./AlertTable"
import Navbar       from "./Navbar"

export default function Dashboard() {
  const [stats,   setStats]   = useState({})
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchData = async () => {
    try {
      const [s, a] = await Promise.all([
        API.get("/alerts/stats"),
        API.get("/alerts")
      ])
      setStats(s.data)
      setAlerts(a.data)
      setError(null)
    } catch (err) {
      setError("⚠️ Cannot connect to backend. " +
               "Make sure FastAPI is running on port 8000.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div style={{
      display:        "flex",
      justifyContent: "center",
      alignItems:     "center",
      height:         "100vh",
      fontSize:       "1.5rem",
      color:          "#2c3e50"
    }}>
      🔄 Loading NIDS Dashboard...
    </div>
  )

  return (
    <div style={{
      background: "#f0f2f5",
      minHeight:  "100vh"
    }}>
      <Navbar />
      <div style={{ padding: "25px" }}>
        {error && (
          <div style={{
            background:   "#fff3cd",
            border:       "1px solid #ffc107",
            borderRadius: "8px",
            padding:      "12px 20px",
            marginBottom: "20px",
            color:        "#856404"
          }}>
            {error}
          </div>
        )}
        <StatsCards stats={stats} />
        <TrafficChart />
        <AlertTable
          alerts={alerts}
          refresh={fetchData}
        />
      </div>
    </div>
  )
}
