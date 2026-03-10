"use client";

interface PatientAlertDatum {
  id: string;
  label: string;
  observations: number;
  alarms: number;
  criticalOutliers: number;
  isSelected: boolean;
}

interface PatientAlertChartProps {
  title: string;
  subtitle: string;
  data: PatientAlertDatum[];
  onSelect: (patientId: string) => void;
}

export function PatientAlertChart({
  title,
  subtitle,
  data,
  onSelect
}: PatientAlertChartProps) {
  if (data.length === 0) {
    return (
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="empty-state">No hay pacientes suficientes para graficar.</div>
      </section>
    );
  }

  const maxMetric = Math.max(
    ...data.map((item) => Math.max(item.alarms, item.criticalOutliers, 1))
  );

  return (
    <section className="chart-card">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="chart-legend">
          <span className="legend-chip legend-chip-warning">Alarmas</span>
          <span className="legend-chip legend-chip-critical">Outliers</span>
        </div>
      </div>

      <div className="patient-bar-chart" role="list" aria-label={title}>
        {data.map((item) => {
          const alarmHeight = `${Math.max((item.alarms / maxMetric) * 100, item.alarms ? 12 : 0)}%`;
          const criticalHeight = `${Math.max(
            (item.criticalOutliers / maxMetric) * 100,
            item.criticalOutliers ? 12 : 0
          )}%`;

          return (
            <button
              key={item.id}
              type="button"
              className={
                item.isSelected
                  ? "patient-bar-button patient-bar-button-selected"
                  : "patient-bar-button"
              }
              onClick={() => onSelect(item.id)}
            >
              <div className="patient-bar-track">
                <span
                  className="patient-bar patient-bar-warning"
                  style={{ height: alarmHeight }}
                />
                <span
                  className="patient-bar patient-bar-critical"
                  style={{ height: criticalHeight }}
                />
              </div>
              <div className="patient-bar-counts">
                <strong>{item.alarms}</strong>
                <span>{item.criticalOutliers} crit.</span>
              </div>
              <strong className="patient-bar-label">{item.label}</strong>
              <span className="patient-bar-meta">{item.observations} observaciones</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
