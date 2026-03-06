"use client";

import {
  classifyObservationSeverity,
  formatObservationCode,
  getPatientDisplayName
} from "../../../../lib/clinical-insights";
import { useDoctorWorkspace } from "../../../../lib/use-doctor-workspace";
import { useAuth } from "../../../../components/auth-provider";
import { MetricRiskChart } from "../../../../components/metric-risk-chart";
import { MetricTrendChart } from "../../../../components/metric-trend-chart";
import { PatientAlertChart } from "../../../../components/patient-alert-chart";
import { StatCard } from "../../../../components/stat-card";

export default function DoctorOverviewPage() {
  const { token, user } = useAuth();

  if (!token || user?.role !== "doctor_admin") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = useDoctorWorkspace(token);

  return (
    <section className="dashboard-grid">
      <div className="stats-grid">
        <StatCard
          label="Pacientes"
          value={workspace.dashboard?.totals.patients ?? workspace.patients.length}
        />
        <StatCard
          label="Observaciones"
          value={workspace.dashboard?.totals.observations ?? workspace.observations.length}
        />
        <StatCard
          label="Outliers"
          value={workspace.dashboard?.totals.outliers ?? 0}
          tone={(workspace.dashboard?.totals.outliers ?? 0) > 0 ? "alert" : "default"}
        />
        <StatCard
          label="Usuarios activos"
          value={workspace.dashboard?.totals.activeUsers ?? 0}
        />
      </div>

      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}
      {workspace.feedback ? (
        <div className="glass-card success-banner">{workspace.feedback}</div>
      ) : null}

      <section className="wide-panel highlight-grid">
        {workspace.operationalHighlights.map((highlight) => (
          <article
            key={highlight.id}
            className={`glass-card highlight-card highlight-card-${highlight.tone}`}
          >
            <span className="profile-label">{highlight.title}</span>
            <strong>{highlight.value}</strong>
            <p>{highlight.detail}</p>
          </article>
        ))}
      </section>

      <PatientAlertChart
        title="Alarmas y outliers por paciente"
        subtitle="Selecciona un paciente para revisar su detalle clinico."
        data={workspace.highlightedPatients}
        onSelect={workspace.setSelectedPatientId}
      />

      <MetricRiskChart
        title="Mapa de riesgo por metrica"
        subtitle="Variables con mayor carga preventiva y critica dentro del conjunto actual."
        data={workspace.metricInsights.map((metric) => ({
          ...metric,
          isSelected: metric.key === workspace.selectedMetric?.key
        }))}
        onSelect={(metricKey) => {
          workspace.setSelectedMetricKey(metricKey);
          workspace.setSelectedTrendObservationId(null);
        }}
      />

      <MetricTrendChart
        title="Tendencia reciente por metrica"
        subtitle="Cada punto te permite llevar el foco al paciente y evento correspondiente."
        metricLabel={workspace.selectedMetric?.label ?? "Sin metrica"}
        unit={workspace.selectedMetric?.unit ?? "sin unidad"}
        points={workspace.metricTrend}
        selectedPointId={workspace.selectedTrendObservationId}
        onSelect={(pointId, patientId) => {
          workspace.setSelectedTrendObservationId(pointId);
          workspace.setSelectedPatientId(patientId);
        }}
      />

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Paciente enfocado</h3>
            <p>Resumen rapido del paciente activo, con sus eventos y alertas mas relevantes.</p>
          </div>
          {workspace.selectedInsight ? <span className="pill">Patient/{workspace.selectedInsight.patient.id}</span> : null}
        </div>

        {workspace.selectedInsight ? (
          <>
            <div className="profile-block">
              <div>
                <span className="profile-label">Paciente</span>
                <strong>{getPatientDisplayName(workspace.selectedInsight.patient)}</strong>
              </div>
              <div>
                <span className="profile-label">Portal</span>
                <strong>{workspace.selectedPatientUser?.email ?? "Sin cuenta portal"}</strong>
              </div>
              <div>
                <span className="profile-label">Alertas</span>
                <strong>{workspace.selectedInsight.alarmCount}</strong>
              </div>
              <div>
                <span className="profile-label">Outliers</span>
                <strong>{workspace.selectedInsight.criticalOutlierCount}</strong>
              </div>
              <div>
                <span className="profile-label">Documento</span>
                <strong>{workspace.selectedInsight.patient.identifier[0]?.value ?? "Sin documento"}</strong>
              </div>
              <div>
                <span className="profile-label">Ultimo registro</span>
                <strong>
                  {workspace.selectedInsight.latestObservation
                    ? new Date(workspace.selectedInsight.latestObservation.effectiveDateTime).toLocaleString("es-CL")
                    : "Sin observaciones"}
                </strong>
              </div>
            </div>

            <div className="detail-subsection">
              <span className="profile-label">Ultimas alertas</span>
              <div className="stack-list">
                {workspace.selectedPatientAlerts.length ? (
                  workspace.selectedPatientAlerts.slice(0, 5).map((observation) => {
                    const severity = classifyObservationSeverity(observation);

                    return (
                      <article
                        key={observation.id}
                        className={
                          severity === "critical"
                            ? "observation-item alert-item"
                            : "observation-item warning-item"
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
                          <span>
                            {severity === "critical" ? "Outlier critico" : "Alarma preventiva"}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state compact-empty">
                    Este paciente no presenta alertas activas.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">Selecciona un paciente para inspeccionar su estado.</div>
        )}
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Alertas clinicas recientes</h3>
            <p>Eventos criticos detectados automaticamente en la muestra actual.</p>
          </div>
        </div>
        <div className="stack-list">
          {workspace.dashboard?.outlierObservations.length ? (
            workspace.dashboard.outlierObservations.map((observation) => (
              <article
                key={observation.id}
                className="alert-item clickable-card"
                onClick={() =>
                  workspace.setSelectedPatientId(
                    observation.subject.reference.split("/")[1] ?? null
                  )
                }
              >
                <div>
                  <strong>{formatObservationCode(observation.code.text)}</strong>
                  <span>{observation.subject.reference}</span>
                </div>
                <div className="observation-side">
                  <strong>
                    {observation.valueQuantity.value} {observation.valueQuantity.unit}
                  </strong>
                  <span>{new Date(observation.effectiveDateTime).toLocaleString("es-CL")}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No hay outliers recientes.</div>
          )}
        </div>
      </section>
    </section>
  );
}
