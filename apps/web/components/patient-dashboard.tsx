"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { ObservationResource, PatientResource } from "../lib/types";
import { LineChart } from "./line-chart";
import { StatCard } from "./stat-card";

interface PatientDashboardProps {
  token: string;
  patientId: number | null;
}

export function PatientDashboard({ token, patientId }: PatientDashboardProps) {
  const [patient, setPatient] = useState<PatientResource | null>(null);
  const [observations, setObservations] = useState<ObservationResource[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("La cuenta no esta vinculada a un registro de paciente.");
      return;
    }

    Promise.all([api.getPatient(token, patientId), api.getObservations(token, patientId)])
      .then(([patientResponse, observationsResponse]) => {
        setPatient(patientResponse);
        setObservations(observationsResponse.entry.map((entry) => entry.resource));
      })
      .catch((loadError) => {
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "No fue posible cargar el portal del paciente."
        );
      });
  }, [patientId, token]);

  const chartPoints = observations
    .slice(0, 10)
    .reverse()
    .map((observation, index) => ({
      label: `${index + 1}`,
      value: observation.valueQuantity.value,
      highlight: Boolean(observation.interpretation?.length)
    }));

  const latestObservation = observations[0];
  const alertCount = observations.filter((observation) => observation.interpretation?.length).length;

  return (
    <section className="dashboard-grid">
      {error ? <div className="glass-card form-error-banner">{error}</div> : null}

      <div className="stats-grid">
        <StatCard
          label="Paciente"
          value={patient ? `${patient.name[0]?.given[0]} ${patient.name[0]?.family}` : "--"}
        />
        <StatCard label="Observaciones" value={observations.length} />
        <StatCard
          label="Ultimo valor"
          value={
            latestObservation
              ? `${latestObservation.valueQuantity.value} ${latestObservation.valueQuantity.unit}`
              : "--"
          }
        />
        <StatCard label="Alertas" value={alertCount} tone={alertCount ? "alert" : "default"} />
      </div>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Mi ficha clinica</h3>
            <p>Acceso restringido al registro interoperable asociado a tu cuenta.</p>
          </div>
        </div>
        {patient ? (
          <div className="profile-block">
            <div>
              <span className="profile-label">Documento</span>
              <strong>{patient.identifier[0]?.value}</strong>
            </div>
            <div>
              <span className="profile-label">Nacimiento</span>
              <strong>{patient.birthDate}</strong>
            </div>
            <div>
              <span className="profile-label">Genero</span>
              <strong>{patient.gender}</strong>
            </div>
            <div className="profile-wide">
              <span className="profile-label">Resumen medico</span>
              <strong>{patient.medicalSummary || "Sin resumen registrado."}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-state">Cargando ficha clinica...</div>
        )}
      </section>

      <LineChart
        title="Tendencia personal"
        subtitle="Ultimos registros asociados exclusivamente a tu historial."
        unit={latestObservation?.valueQuantity.unit}
        points={chartPoints}
      />

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Historial de observaciones</h3>
            <p>Los registros marcados en rojo requieren revision clinica.</p>
          </div>
        </div>
        <div className="stack-list">
          {observations.length ? (
            observations.map((observation) => (
              <article
                key={observation.id}
                className={
                  observation.interpretation?.length ? "observation-item alert-item" : "observation-item"
                }
              >
                <div>
                  <strong>{observation.code.text}</strong>
                  <span>{new Date(observation.effectiveDateTime).toLocaleString("es-CL")}</span>
                </div>
                <div>
                  <strong>
                    {observation.valueQuantity.value} {observation.valueQuantity.unit}
                  </strong>
                  <span>{observation.note?.[0]?.text ?? observation.status}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">Todavia no hay observaciones registradas.</div>
          )}
        </div>
      </section>
    </section>
  );
}
