import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
  CartesianGrid
} from "recharts"
import { useEffect, useState } from "react"
import API from "../api/axios"

export default function TrafficChart() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get("/stats/traffic")
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{
      background:   "white",
      borderRadius: "12px",
      padding:      "20px",
      marginBottom: "25px",
      boxShadow:    "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginTop: 0, color: "#2c3e50" }}>
        📊 Traffic Overview — Last 8 Days
      </h2>
      {loading ? (
        <p style={{ textAlign: "center",
                    color: "#aaa" }}>Loading chart...</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}
                    margin={{ top: 5, right: 20,
                              left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3"
                           stroke="#f0f0f0" />
            <XAxis dataKey="date"
                   tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px" }} />
            <Legend />
            <Bar dataKey="Normal" fill="#27ae60"
                 radius={[4, 4, 0, 0]} />
            <Bar dataKey="Attack" fill="#e74c3c"
                 radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
