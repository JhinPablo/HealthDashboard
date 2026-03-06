"use client";

import { useAuth } from "../../../../components/auth-provider";
import { usePatientWorkspace } from "../../../../lib/use-patient-workspace";

export default function PatientReportsPage() {
  const { token, user } = useAuth();

  if (!token || user?.role !== "patient") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = usePatientWorkspace(token, user.patientId);
  const reportText = workspace.buildReportText();

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reporte-paciente-${workspace.patient?.id ?? "sin-id"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="dashboard-grid">
      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Resumen para reporte</h3>
            <p>Prepara un consolidado simple de tu estado general y tus metricas observadas.</p>
          </div>
        </div>
        <div className="profile-block">
          <div>
            <span className="profile-label">Observaciones</span>
            <strong>{workspace.observations.length}</strong>
          </div>
          <div>
            <span className="profile-label">Alertas</span>
            <strong>{workspace.alerts.length}</strong>
          </div>
          <div>
            <span className="profile-label">Outliers criticos</span>
            <strong>{workspace.criticalAlerts.length}</strong>
          </div>
        </div>

        <div className="detail-actions">
          <button type="button" className="primary-button" onClick={downloadReport}>
            Descargar reporte
          </button>
          <button type="button" className="secondary-button" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Analisis general</h3>
            <p>Vista compacta de tus metricas para alimentar el reporte.</p>
          </div>
        </div>
        <div className="stack-list">
          {workspace.metricSummary.map((item) => (
            <article key={item.label} className="observation-item">
              <div>
                <strong>{item.label}</strong>
                <span>Promedio {item.average}</span>
              </div>
              <div className="observation-side">
                <strong>{item.max}</strong>
                <span>{item.alerts} eventos anormales</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Vista previa del reporte</h3>
            <p>Texto listo para exportar o compartir con control local desde tu portal.</p>
          </div>
        </div>
        <pre className="report-preview">{reportText}</pre>
      </section>
    </section>
  );
}
