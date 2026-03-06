"use client";

import { useEffect, useState } from "react";
import {
  classifyObservationSeverity,
  formatObservationCode
} from "../lib/clinical-insights";
import { buildMetricInsights, buildMetricTrend } from "../lib/doctor-dashboard-insights";
import { api, ApiError } from "../lib/api";
import { ObservationResource, PatientResource } from "../lib/types";
import { MetricRiskChart } from "./metric-risk-chart";
import { MetricTrendChart } from "./metric-trend-chart";
import { StatCard } from "./stat-card";

interface PatientDashboardProps {
  token: string;
  patientId: number | null;
}

export function PatientDashboard({ token, patientId }: PatientDashboardProps) {
  const [patient, setPatient] = useState<PatientResource | null>(null);
  const [observations, setObservations] = useState<ObservationResource[]>([]);
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const [selectedTrendObservationId, setSelectedTrendObservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError("La cuenta no esta vinculada a un registro de paciente.");
      return;
    }

    const loadAllObservations = async () => {
      const pageSize = 100;
      let offset = 0;
      const resources: ObservationResource[] = [];

      while (true) {
        const response = await api.getObservations(token, patientId, pageSize, offset);
        resources.push(...response.entry.map((entry) => entry.resource));

        if (resources.length >= response.total || response.entry.length === 0) {
          break;
        }

        offset += response.entry.length;
      }

      return resources;
    };

    setError(null);

    Promise.all([api.getPatient(token, patientId), loadAllObservations()])
      .then(([patientResponse, observationResources]) => {
        setPatient(patientResponse);
        setObservations(observationResources);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "No fue posible cargar el portal del paciente."
        );
      });
  }, [patientId, token]);

  const patientResources = patient ? [patient] : [];
  const metricInsights = buildMetricInsights(observations, patientResources);
  const selectedMetric =
    metricInsights.find((metric) => metric.key === selectedMetricKey) ??
    metricInsights[0] ??
    null;
  const metricTrend =
    patient && selectedMetric
      ? buildMetricTrend(observations, [patient], selectedMetric.key, 16)
      : [];
  const selectedTrendPoint =
    metricTrend.find((point) => point.id === selectedTrendObservationId) ??
    metricTrend[metricTrend.length - 1] ??
    null;
  const alerts = observations.filter(
    (observation) => classifyObservationSeverity(observation) !== "normal"
  );
  const criticalAlerts = alerts.filter(
    (observation) => classifyObservationSeverity(observation) === "critical"
  );
  const latestObservation = observations[0] ?? null;
  const latestAlert = alerts[0] ?? null;

  useEffect(() => {
    if (!metricInsights.length) {
      if (selectedMetricKey !== null) {
        setSelectedMetricKey(null);
      }
      return;
    }

    if (!selectedMetricKey || !metricInsights.some((metric) => metric.key === selectedMetricKey)) {
      setSelectedMetricKey(metricInsights[0].key);
    }
  }, [metricInsights, selectedMetricKey]);

  useEffect(() => {
    if (!metricTrend.length) {
      if (selectedTrendObservationId !== null) {
        setSelectedTrendObservationId(null);
      }
      return;
    }

    if (
      !selectedTrendObservationId ||
      !metricTrend.some((point) => point.id === selectedTrendObservationId)
    ) {
      setSelectedTrendObservationId(metricTrend[metricTrend.length - 1].id);
    }
  }, [metricTrend, selectedTrendObservationId]);

  return (
    <section className="dashboard-grid">
      {error ? <div className="glass-card form-error-banner">{error}</div> : null}

      <div className="stats-grid">
        <StatCard
          label="Paciente"
          value={patient ? `${patient.name[0]?.given[0]} ${patient.name[0]?.family}` : "--"}
        />
        <StatCard label="Metricas" value={metricInsights.length} />
        <StatCard label="Observaciones" value={observations.length} />
        <StatCard
          label="Alertas"
          value={alerts.length}
          tone={alerts.length ? "alert" : "default"}
        />
      </div>

      <section className="wide-panel highlight-grid">
        <article className="glass-card highlight-card">
          <span className="profile-label">Cobertura de monitoreo</span>
          <strong>{metricInsights.length ? `${metricInsights.length} variables activas` : "Sin metricas"}</strong>
          <p>
            Tu portal solo expone el historial asociado a tu cuenta y resume las variables que se
            han monitoreado.
          </p>
        </article>
        <article
          className={`glass-card highlight-card ${
            criticalAlerts.length ? "highlight-card-critical" : "highlight-card-warning"
          }`}
        >
          <span className="profile-label">Prioridad clinica</span>
          <strong>
            {latestAlert
              ? `${formatObservationCode(latestAlert.code.text)} ${latestAlert.valueQuantity.value} ${latestAlert.valueQuantity.unit}`
              : "Sin alertas activas"}
          </strong>
          <p>
            {latestAlert
              ? `Ultima alerta registrada el ${new Date(latestAlert.effectiveDateTime).toLocaleString("es-CL")}.`
              : "Los registros disponibles no muestran valores fuera de rango."}
          </p>
        </article>
        <article className="glass-card highlight-card">
          <span className="profile-label">Ultimo registro</span>
          <strong>
            {latestObservation
              ? `${formatObservationCode(latestObservation.code.text)} ${latestObservation.valueQuantity.value} ${latestObservation.valueQuantity.unit}`
              : "Sin registros"}
          </strong>
          <p>
            {latestObservation
              ? `Tomado el ${new Date(latestObservation.effectiveDateTime).toLocaleString("es-CL")}.`
              : "Todavia no hay observaciones asociadas a tu historial."}
          </p>
        </article>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Mi ficha clinica</h3>
            <p>Acceso restringido unicamente al recurso interoperable asociado a tu usuario.</p>
          </div>
          <span className="pill">Scope: Patient/{patient?.id ?? "--"}</span>
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

      <MetricRiskChart
        title="Mapa personal de metricas"
        subtitle="Selecciona una variable para ver su tendencia y densidad de alertas dentro de tu historial."
        data={metricInsights.map((metric) => ({
          ...metric,
          isSelected: metric.key === selectedMetric?.key
        }))}
        onSelect={(metricKey) => {
          setSelectedMetricKey(metricKey);
          setSelectedTrendObservationId(null);
        }}
      />

      <MetricTrendChart
        title="Tendencia reciente personal"
        subtitle="Cada punto representa un registro propio. Selecciona uno para enfocar el detalle."
        metricLabel={selectedMetric?.label ?? "Sin metrica"}
        unit={selectedMetric?.unit ?? "sin unidad"}
        points={metricTrend}
        selectedPointId={selectedTrendObservationId}
        onSelect={(pointId) => setSelectedTrendObservationId(pointId)}
      />

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Alertas prioritarias</h3>
            <p>Valores fuera de rango o preventivos detectados exclusivamente en tus observaciones.</p>
          </div>
        </div>
        <div className="stack-list">
          {alerts.length ? (
            alerts.slice(0, 6).map((observation) => {
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
              No hay alertas activas dentro de tu historial clinico.
            </div>
          )}
        </div>
      </section>

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Historial de observaciones</h3>
            <p>Vista cronologica de tus registros. El detalle solo corresponde a tu cuenta.</p>
          </div>
        </div>

        {selectedTrendPoint ? (
          <div className="trend-selection-summary">
            <div>
              <span>Evento enfocado</span>
              <strong>{selectedMetric?.label ?? "Metrica seleccionada"}</strong>
            </div>
            <div>
              <span>Registro</span>
              <strong>
                {selectedTrendPoint.value} {selectedTrendPoint.unit}
              </strong>
            </div>
            <div>
              <span>Momento</span>
              <strong>{selectedTrendPoint.shortLabel}</strong>
            </div>
          </div>
        ) : null}

        <div className="stack-list">
          {observations.length ? (
            observations.map((observation) => {
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
            <div className="empty-state">Todavia no hay observaciones registradas.</div>
          )}
        </div>
      </section>
    </section>
  );
}
