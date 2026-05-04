import { useState, useEffect } from "react"

export default function Navbar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <nav style={{
      background:     "#1a1a2e",
      color:          "white",
      padding:        "15px 30px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      boxShadow:      "0 2px 10px rgba(0,0,0,0.3)",
      position:       "sticky",
      top:            0,
      zIndex:         100
    }}>
      <div style={{ display: "flex",
                    alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.8rem" }}>🔐</span>
        <div>
          <h2 style={{ margin: 0, color: "#e74c3c",
                       fontSize: "1.2rem" }}>
            NIDS Dashboard
          </h2>
          <small style={{ color: "#aaa" }}>
            Network Intrusion Detection System
          </small>
        </div>
      </div>
      <div style={{ display: "flex",
                    gap: "25px", alignItems: "center" }}>
        <span style={{ color: "#27ae60",
                       fontWeight: "bold" }}>
          🟢 System Active
        </span>
        <span style={{ color: "#aaa", fontSize: "14px" }}>
          🕐 {time.toLocaleString()}
        </span>
      </div>
    </nav>
  )
}
