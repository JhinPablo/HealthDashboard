interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "default" | "alert";
}

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <article className={`stat-card ${tone === "alert" ? "stat-card-alert" : ""}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}
