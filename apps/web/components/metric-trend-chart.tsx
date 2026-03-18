"use client";

import { ObservationSeverity } from "../lib/clinical-insights";

interface MetricTrendPoint {
  id: string;
  patientId: string;
  patientLabel: string;
  timestamp: string;
  shortLabel: string;
  value: number;
  unit: string;
  severity: ObservationSeverity;
}

interface MetricTrendChartProps {
  title: string;
  subtitle: string;
  metricLabel: string;
  unit: string;
  points: MetricTrendPoint[];
  selectedPointId: string | null;
  onSelect: (pointId: string, patientId: string) => void;
}

function getPointClassName(
  severity: ObservationSeverity,
  isSelected: boolean
): string {
  if (severity === "critical") {
    return isSelected ? "trend-point trend-point-critical trend-point-selected" : "trend-point trend-point-critical";
  }

  if (severity === "warning") {
    return isSelected ? "trend-point trend-point-warning trend-point-selected" : "trend-point trend-point-warning";
  }

  return isSelected ? "trend-point trend-point-normal trend-point-selected" : "trend-point trend-point-normal";
}

export function MetricTrendChart({
  title,
  subtitle,
  metricLabel,
  unit,
  points,
  selectedPointId,
  onSelect
}: MetricTrendChartProps) {
  if (points.length === 0) {
    return (
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="empty-state">No hay observaciones para la metrica seleccionada.</div>
      </section>
    );
  }

  const width = 720;
  const height = 260;
  const padding = 34;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || 1;
  const step = Math.max(Math.ceil(points.length / 4), 1);
  const selectedPoint =
    points.find((point) => point.id === selectedPointId) ?? points[points.length - 1];

  const coordinates = points.map((point, index) => {
    const x =
      padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - minValue) / span) * (height - padding * 2);

    return {
      ...point,
      x,
      y
    };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="chart-card">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="chart-legend">
          <span className="pill">{metricLabel}</span>
          <span className="pill">{unit}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label={title}
      >
        {[0, 1, 2, 3].map((gridIndex) => {
          const y = padding + gridIndex * ((height - padding * 2) / 3);
          return (
            <line
              key={gridIndex}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              className="chart-grid"
            />
          );
        })}

        <polyline points={polyline} fill="none" className="chart-line" />

        {coordinates.map((point, index) => (
          <g
            key={point.id}
            className="trend-point-group"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(point.id, point.patientId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(point.id, point.patientId);
              }
            }}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={point.id === selectedPoint.id ? 7 : 5}
              className={getPointClassName(point.severity, point.id === selectedPoint.id)}
            />
            {(index === 0 || index === points.length - 1 || index % step === 0) ? (
              <text x={point.x} y={height - 10} textAnchor="middle" className="trend-axis-label">
                {point.shortLabel}
              </text>
            ) : null}
            <title>
              {`${point.patientLabel}: ${point.value} ${point.unit} · ${point.shortLabel}`}
            </title>
          </g>
        ))}
      </svg>

      <div className="trend-selection-summary">
        <div>
          <span>Evento enfocado</span>
          <strong>{selectedPoint.patientLabel}</strong>
        </div>
        <div>
          <span>Registro</span>
          <strong>
            {selectedPoint.value} {selectedPoint.unit}
          </strong>
        </div>
        <div>
          <span>Momento</span>
          <strong>{selectedPoint.shortLabel}</strong>
        </div>
      </div>
    </section>
  );
}
