"use client";

import { useEffect, useMemo, useState } from "react";
import {
  classifyObservationSeverity,
  formatObservationCode
} from "./clinical-insights";
import { buildMetricInsights, buildMetricTrend } from "./doctor-dashboard-insights";
import { api, ApiError } from "./api";
import { ObservationResource, PatientResource } from "./types";

export function usePatientWorkspace(token: string, patientId: number | null) {
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
  const metricInsights = useMemo(
    () => buildMetricInsights(observations, patientResources),
    [observations, patientResources]
  );
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
  const metricSummary = metricInsights.map((metric) => ({
    label: metric.label,
    average: `${metric.averageValue} ${metric.unit}`,
    max: `${metric.maxValue} ${metric.unit}`,
    alerts: metric.warningCount + metric.criticalCount
  }));

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

  const buildReportText = () => {
    const patientLabel = patient
      ? `${patient.name[0]?.given[0] ?? ""} ${patient.name[0]?.family ?? ""}`.trim()
      : "Paciente sin identificar";
    const lines = [
      "REPORTE CLINICO DEL PACIENTE",
      `Fecha de generacion: ${new Date().toLocaleString("es-CL")}`,
      "",
      `Paciente: ${patientLabel}`,
      `Documento: ${patient?.identifier[0]?.value ?? "Sin documento"}`,
      `Nacimiento: ${patient?.birthDate ?? "Sin dato"}`,
      `Genero: ${patient?.gender ?? "Sin dato"}`,
      "",
      "RESUMEN GENERAL",
      `Observaciones totales: ${observations.length}`,
      `Alertas preventivas o criticas: ${alerts.length}`,
      `Outliers criticos: ${criticalAlerts.length}`,
      latestObservation
        ? `Ultimo registro: ${formatObservationCode(latestObservation.code.text)} ${latestObservation.valueQuantity.value} ${latestObservation.valueQuantity.unit} (${new Date(latestObservation.effectiveDateTime).toLocaleString("es-CL")})`
        : "Ultimo registro: sin observaciones",
      "",
      "METRICAS",
      ...metricInsights.map(
        (metric) =>
          `- ${metric.label}: promedio ${metric.averageValue} ${metric.unit}, maximo ${metric.maxValue} ${metric.unit}, eventos anormales ${metric.warningCount + metric.criticalCount}`
      ),
      "",
      "ULTIMAS ALERTAS",
      ...(alerts.length
        ? alerts.slice(0, 8).map(
            (observation) =>
              `- ${formatObservationCode(observation.code.text)} ${observation.valueQuantity.value} ${observation.valueQuantity.unit} | ${new Date(observation.effectiveDateTime).toLocaleString("es-CL")}`
          )
        : ["- Sin alertas activas"]),
      "",
      "Resumen medico",
      patient?.medicalSummary || "Sin resumen registrado."
    ];

    return lines.join("\n");
  };

  return {
    patient,
    observations,
    metricInsights,
    selectedMetric,
    selectedMetricKey,
    setSelectedMetricKey,
    metricTrend,
    selectedTrendPoint,
    selectedTrendObservationId,
    setSelectedTrendObservationId,
    alerts,
    criticalAlerts,
    latestObservation,
    latestAlert,
    metricSummary,
    buildReportText,
    error
  };
}
