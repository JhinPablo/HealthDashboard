"use client";

import { classifyObservationSeverity, formatObservationCode } from "../../../../lib/clinical-insights";
import { usePatientWorkspace } from "../../../../lib/use-patient-workspace";
import { useAuth } from "../../../../components/auth-provider";

export default function PatientHistoryPage() {
  const { token, user } = useAuth();

  if (!token || user?.role !== "patient") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = usePatientWorkspace(token, user.patientId);
  const filteredObservations = workspace.selectedMetric
    ? workspace.observations.filter(
        (observation) =>
          observation.code.text.toLowerCase().replace(/[\s-]+/g, "_") ===
          workspace.selectedMetric?.key
      )
    : workspace.observations;

  return (
    <section className="dashboard-grid">
      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Historico clinico</h3>
            <p>Linea de tiempo completa de tus observaciones, separada del panel general.</p>
          </div>
          <span className="pill">{filteredObservations.length} registros</span>
        </div>

        <div className="chart-legend">
          <button
            type="button"
            className={!workspace.selectedMetric ? "sidebar-link sidebar-link-active" : "sidebar-link"}
            onClick={() => {
              workspace.setSelectedMetricKey(null);
              workspace.setSelectedTrendObservationId(null);
            }}
          >
            <strong>Todas</strong>
            <span>Ver todas las metricas</span>
          </button>
          {workspace.metricInsights.map((metric) => (
            <button
              key={metric.key}
              type="button"
              className={
                workspace.selectedMetric?.key === metric.key
                  ? "sidebar-link sidebar-link-active"
                  : "sidebar-link"
              }
              onClick={() => {
                workspace.setSelectedMetricKey(metric.key);
                workspace.setSelectedTrendObservationId(null);
              }}
            >
              <strong>{metric.label}</strong>
              <span>{metric.total} registros</span>
            </button>
          ))}
        </div>

        <div className="stack-list">
          {filteredObservations.length ? (
            filteredObservations.map((observation) => {
              const severity = classifyObservationSeverity(observation);

              return (
                <article
                  key={observation.id}
                  className={
                    severity === "critical"
                      ? "observation-item alert-item"
                      : severity === "warning"
                        ? "observation-item warning-item"
                        : "observation-item"
                  }
                >
                  <div>
                    <strong>{formatObservationCode(observation.code.text)}</strong>
                    <span>{new Date(observation.effectiveDateTime).toLocaleString("es-CL")}</span>
                  </div>
                  <div className="observation-side">
                    <strong>
                      {observation.valueQuantity.value} {observation.valueQuantity.unit}
                    </strong>
                    <span>{observation.note?.[0]?.text ?? observation.status}</span>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">No hay registros para la metrica seleccionada.</div>
          )}
        </div>
      </section>
    </section>
  );
}
