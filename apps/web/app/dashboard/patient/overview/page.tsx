"use client";

import { formatObservationCode } from "../../../../lib/clinical-insights";
import { usePatientWorkspace } from "../../../../lib/use-patient-workspace";
import { useAuth } from "../../../../components/auth-provider";
import { MetricRiskChart } from "../../../../components/metric-risk-chart";
import { MetricTrendChart } from "../../../../components/metric-trend-chart";
import { StatCard } from "../../../../components/stat-card";

export default function PatientOverviewPage() {
  const { token, user } = useAuth();

  if (!token || user?.role !== "patient") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = usePatientWorkspace(token, user.patientId);

  return (
    <section className="dashboard-grid">
      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}

      <div className="stats-grid">
        <StatCard
          label="Paciente"
          value={
            workspace.patient
              ? `${workspace.patient.name[0]?.given[0]} ${workspace.patient.name[0]?.family}`
              : "--"
          }
        />
        <StatCard label="Metricas" value={workspace.metricInsights.length} />
        <StatCard label="Observaciones" value={workspace.observations.length} />
        <StatCard
          label="Alertas"
          value={workspace.alerts.length}
          tone={workspace.alerts.length ? "alert" : "default"}
        />
      </div>

      <section className="wide-panel highlight-grid">
        <article className="glass-card highlight-card">
          <span className="profile-label">Cobertura</span>
          <strong>
            {workspace.metricInsights.length
              ? `${workspace.metricInsights.length} variables monitoreadas`
              : "Sin metricas"}
          </strong>
          <p>Tu dashboard solo resume informacion asociada a tu cuenta autenticada.</p>
        </article>
        <article
          className={`glass-card highlight-card ${
            workspace.criticalAlerts.length ? "highlight-card-critical" : "highlight-card-warning"
          }`}
        >
          <span className="profile-label">Prioridad clinica</span>
          <strong>
            {workspace.latestAlert
              ? `${formatObservationCode(workspace.latestAlert.code.text)} ${workspace.latestAlert.valueQuantity.value} ${workspace.latestAlert.valueQuantity.unit}`
              : "Sin alertas activas"}
          </strong>
          <p>
            {workspace.latestAlert
              ? `Ultima alerta registrada el ${new Date(workspace.latestAlert.effectiveDateTime).toLocaleString("es-CL")}.`
              : "Los registros actuales no muestran valores fuera de rango."}
          </p>
        </article>
        <article className="glass-card highlight-card">
          <span className="profile-label">Ultimo registro</span>
          <strong>
            {workspace.latestObservation
              ? `${formatObservationCode(workspace.latestObservation.code.text)} ${workspace.latestObservation.valueQuantity.value} ${workspace.latestObservation.valueQuantity.unit}`
              : "Sin registros"}
          </strong>
          <p>
            {workspace.latestObservation
              ? `Tomado el ${new Date(workspace.latestObservation.effectiveDateTime).toLocaleString("es-CL")}.`
              : "Todavia no existen observaciones asociadas a tu portal."}
          </p>
        </article>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Mi ficha clinica</h3>
            <p>Acceso acotado al recurso `Patient` vinculado a tu usuario.</p>
          </div>
          <span className="pill">Patient/{workspace.patient?.id ?? "--"}</span>
        </div>
        {workspace.patient ? (
          <div className="profile-block">
            <div>
              <span className="profile-label">Documento</span>
              <strong>{workspace.patient.identifier[0]?.value}</strong>
            </div>
            <div>
              <span className="profile-label">Nacimiento</span>
              <strong>{workspace.patient.birthDate}</strong>
            </div>
            <div>
              <span className="profile-label">Genero</span>
              <strong>{workspace.patient.gender}</strong>
            </div>
            <div className="profile-wide">
              <span className="profile-label">Resumen medico</span>
              <strong>{workspace.patient.medicalSummary || "Sin resumen registrado."}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-state">Cargando ficha clinica...</div>
        )}
      </section>

      <MetricRiskChart
        title="Mapa personal de metricas"
        subtitle="Selecciona una variable para profundizar en tu tendencia."
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
        title="Tendencia reciente personal"
        subtitle="Cada punto representa un registro propio dentro de tu historial."
        metricLabel={workspace.selectedMetric?.label ?? "Sin metrica"}
        unit={workspace.selectedMetric?.unit ?? "sin unidad"}
        points={workspace.metricTrend}
        selectedPointId={workspace.selectedTrendObservationId}
        onSelect={(pointId) => workspace.setSelectedTrendObservationId(pointId)}
      />
    </section>
  );
}
