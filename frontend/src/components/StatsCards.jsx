export default function StatsCards({ stats }) {
  const cards = [
    {
      title: "Total Alerts",
      value: stats.total_alerts    || 0,
      color: "#e74c3c",
      icon:  "🚨"
    },
    {
      title: "Active Alerts",
      value: stats.active_alerts   || 0,
      color: "#f39c12",
      icon:  "⚠️"
    },
    {
      title: "Resolved",
      value: stats.resolved_alerts || 0,
      color: "#27ae60",
      icon:  "✅"
    },
    {
      title: "Total Traffic",
      value: stats.total_traffic   || 0,
      color: "#2980b9",
      icon:  "📡"
    },
    {
      title: "Normal Traffic",
      value: stats.normal_traffic  || 0,
      color: "#16a085",
      icon:  "🟢"
    },
    {
      title: "Attack Traffic",
      value: stats.attack_traffic  || 0,
      color: "#8e44ad",
      icon:  "💀"
    },
  ]

  return (
    <div style={{
      display:             "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap:                 "15px",
      marginBottom:        "25px"
    }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background:   c.color,
          color:        "white",
          padding:      "20px",
          borderRadius: "12px",
          textAlign:    "center",
          boxShadow:    "0 4px 15px rgba(0,0,0,0.2)",
          transition:   "transform 0.2s",
          cursor:       "default"
        }}
          onMouseEnter={e =>
            e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={e =>
            e.currentTarget.style.transform = "scale(1)"}
        >
          <div style={{ fontSize: "2rem" }}>{c.icon}</div>
          <h3 style={{ margin: "5px 0",
                       fontSize: "0.9rem" }}>{c.title}</h3>
          <h2 style={{ margin: 0,
                       fontSize: "2rem" }}>{c.value}</h2>
        </div>
      ))}
    </div>
  )
}
