"use client";

interface MetricRiskDatum {
  key: string;
  label: string;
  unit: string;
  total: number;
  warningCount: number;
  criticalCount: number;
  patientCount: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  latestPatientLabel: string | null;
  isSelected: boolean;
}

interface MetricRiskChartProps {
  title: string;
  subtitle: string;
  data: MetricRiskDatum[];
  onSelect: (metricKey: string) => void;
}

export function MetricRiskChart({
  title,
  subtitle,
  data,
  onSelect
}: MetricRiskChartProps) {
  if (data.length === 0) {
    return (
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="empty-state">No hay metricas suficientes para graficar.</div>
      </section>
    );
  }

  const maxAlerts = Math.max(
    ...data.map((metric) => metric.warningCount + metric.criticalCount),
    1
  );

  return (
    <section className="chart-card">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="chart-legend">
          <span className="legend-chip legend-chip-warning">Preventivas</span>
          <span className="legend-chip legend-chip-critical">Criticas</span>
        </div>
      </div>

      <div className="metric-risk-grid">
        {data.map((metric) => {
          const warningWidth = `${(metric.warningCount / maxAlerts) * 100}%`;
          const criticalWidth = `${(metric.criticalCount / maxAlerts) * 100}%`;

          return (
            <button
              key={metric.key}
              type="button"
              className={
                metric.isSelected
                  ? "metric-risk-card metric-risk-card-selected"
                  : "metric-risk-card"
              }
              onClick={() => onSelect(metric.key)}
            >
              <div className="metric-risk-header">
                <div>
                  <strong>{metric.label}</strong>
                  <span>{metric.latestPatientLabel ?? "Sin paciente reciente"}</span>
                </div>
                <span className="pill">{metric.unit}</span>
              </div>

              <div className="metric-risk-track">
                <span className="metric-risk-bar metric-risk-bar-warning" style={{ width: warningWidth }} />
                <span className="metric-risk-bar metric-risk-bar-critical" style={{ width: criticalWidth }} />
              </div>

              <div className="metric-risk-stats">
                <div>
                  <span>Preventivas</span>
                  <strong>{metric.warningCount}</strong>
                </div>
                <div>
                  <span>Criticas</span>
                  <strong>{metric.criticalCount}</strong>
                </div>
                <div>
                  <span>Pacientes</span>
                  <strong>{metric.patientCount}</strong>
                </div>
                <div>
                  <span>Promedio</span>
                  <strong>{metric.averageValue}</strong>
                </div>
              </div>

              <div className="metric-risk-meta">
                <span>{metric.total} registros</span>
                <span>
                  Rango {metric.minValue} - {metric.maxValue} {metric.unit}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
