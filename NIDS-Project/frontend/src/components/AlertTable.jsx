import { useState } from "react"
import API from "../api/axios"

export default function AlertTable({ alerts, refresh }) {
  const [loading, setLoading] = useState(null)

  const resolve = async (id) => {
    setLoading(id)
    await API.patch(`/alerts/${id}/resolve`)
    refresh()
    setLoading(null)
  }

  const remove = async (id) => {
    setLoading(id)
    await API.delete(`/alerts/${id}`)
    refresh()
    setLoading(null)
  }

  const clearAll = async () => {
    if (!window.confirm("Clear all alerts?")) return
    await API.delete("/alerts")
    refresh()
  }

  return (
    <div style={{
      background:   "white",
      borderRadius: "12px",
      padding:      "20px",
      boxShadow:    "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        marginBottom:   "15px"
      }}>
        <h2 style={{ margin: 0, color: "#2c3e50" }}>
          🚨 Recent Alerts
        </h2>
        <button onClick={clearAll} style={{
          background:   "#e74c3c",
          color:        "white",
          border:       "none",
          padding:      "8px 16px",
          borderRadius: "6px",
          cursor:       "pointer",
          fontWeight:   "bold"
        }}>
          🗑️ Clear All
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={{
          textAlign:    "center",
          padding:      "40px",
          color:        "#27ae60",
          fontSize:     "1.1rem"
        }}>
          ✅ No alerts detected — Network is safe!
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width:          "100%",
            borderCollapse: "collapse",
            fontSize:       "13px"
          }}>
            <thead style={{
              background: "#2c3e50",
              color:      "white"
            }}>
              <tr>
                {["ID", "Time", "Source IP", "Dest IP",
                  "Protocol", "Attack Type",
                  "Confidence", "Status",
                  "Actions"].map(h => (
                  <th key={h} style={{
                    padding:   "12px 10px",
                    textAlign: "left",
                    whiteSpace: "nowrap"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={a.id} style={{
                  background:   i % 2 === 0
                    ? "#f8f9fa" : "white",
                  borderBottom: "1px solid #dee2e6"
                }}>
                  <td style={{ padding: "10px",
                               fontWeight: "bold" }}>
                    #{a.id}
                  </td>
                  <td style={{ padding: "10px",
                               whiteSpace: "nowrap" }}>
                    {new Date(a.timestamp)
                      .toLocaleString()}
                  </td>
                  <td style={{ padding: "10px",
                               fontFamily: "monospace" }}>
                    {a.source_ip}
                  </td>
                  <td style={{ padding: "10px",
                               fontFamily: "monospace" }}>
                    {a.dest_ip}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {a.protocol}
                  </td>
                  <td style={{
                    padding:    "10px",
                    color:      "#e74c3c",
                    fontWeight: "bold"
                  }}>
                    🚨 {a.attack_type}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      background:   a.confidence > 80
                        ? "#e74c3c" : "#f39c12",
                      color:        "white",
                      padding:      "3px 8px",
                      borderRadius: "10px",
                      fontSize:     "12px"
                    }}>
                      {a.confidence}%
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      color:      a.status === "Active"
                        ? "#e74c3c" : "#27ae60",
                      fontWeight: "bold"
                    }}>
                      {a.status === "Active"
                        ? "🔴 Active" : "🟢 Resolved"}
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex",
                                  gap: "5px" }}>
                      {a.status === "Active" && (
                        <button
                          onClick={() => resolve(a.id)}
                          disabled={loading === a.id}
                          style={{
                            background:   "#27ae60",
                            color:        "white",
                            border:       "none",
                            padding:      "4px 8px",
                            borderRadius: "4px",
                            cursor:       "pointer",
                            fontSize:     "11px"
                          }}>
                          ✅ Resolve
                        </button>
                      )}
                      <button
                        onClick={() => remove(a.id)}
                        disabled={loading === a.id}
                        style={{
                          background:   "#e74c3c",
                          color:        "white",
                          border:       "none",
                          padding:      "4px 8px",
                          borderRadius: "4px",
                          cursor:       "pointer",
                          fontSize:     "11px"
                        }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
