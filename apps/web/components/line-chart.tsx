interface LineChartPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

interface LineChartProps {
  title: string;
  subtitle: string;
  unit?: string;
  points: LineChartPoint[];
}

export function LineChart({ title, subtitle, unit, points }: LineChartProps) {
  if (points.length === 0) {
    return (
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="empty-state">No hay datos suficientes para graficar.</div>
      </section>
    );
  }

  const width = 620;
  const height = 240;
  const padding = 28;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || 1;

  const coordinates = points.map((point, index) => {
    const x =
      padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - minValue) / span) * (height - padding * 2);
    return { x, y, ...point };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="chart-card">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {unit ? <span className="pill">{unit}</span> : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
        {[0, 1, 2, 3].map((step) => {
          const y = padding + step * ((height - padding * 2) / 3);
          return <line key={step} x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid" />;
        })}
        <polyline points={polyline} fill="none" className="chart-line" />
        {coordinates.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.highlight ? 5 : 4}
              className={point.highlight ? "chart-point chart-point-alert" : "chart-point"}
            />
            <title>{`${point.label}: ${point.value}${unit ? ` ${unit}` : ""}`}</title>
          </g>
        ))}
      </svg>
      <div className="chart-labels">
        {points.map((point) => (
          <span key={`${point.label}-${point.value}`}>{point.label}</span>
        ))}
      </div>
    </section>
  );
}
