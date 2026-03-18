import {
  classifyObservationSeverity,
  formatObservationCode,
  getObservationPatientId,
  getPatientDisplayName,
  ObservationSeverity
} from "./clinical-insights";
import { ObservationResource, PatientResource } from "./types";

export interface PatientInsight {
  patient: PatientResource;
  observations: ObservationResource[];
  alarmCount: number;
  criticalOutlierCount: number;
  latestObservation: ObservationResource | null;
}

export interface MetricInsight {
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
  latestObservation: ObservationResource | null;
  latestPatientLabel: string | null;
}

export interface MetricTrendPoint {
  id: string;
  patientId: string;
  patientLabel: string;
  timestamp: string;
  shortLabel: string;
  value: number;
  unit: string;
  severity: ObservationSeverity;
}

export interface OperationalHighlight {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "default" | "warning" | "critical";
}

function normalizeMetricKey(code: string): string {
  return code.toLowerCase().replace(/[\s-]+/g, "_");
}

function getPatientMap(patients: PatientResource[]): Map<string, PatientResource> {
  return new Map(patients.map((patient) => [patient.id, patient]));
}

function getObservationTime(observation: ObservationResource): number {
  return new Date(observation.effectiveDateTime).getTime();
}

function formatShortTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit"
  })} ${date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

export function buildPatientInsights(
  patients: PatientResource[],
  observations: ObservationResource[]
): PatientInsight[] {
  const groupedObservations = new Map<number, ObservationResource[]>();

  observations.forEach((observation) => {
    const patientId = getObservationPatientId(observation);
    if (!patientId) {
      return;
    }

    const current = groupedObservations.get(patientId) ?? [];
    current.push(observation);
    groupedObservations.set(patientId, current);
  });

  return [...patients]
    .map((patient) => {
      const patientId = Number(patient.id);
      const patientObservations = [...(groupedObservations.get(patientId) ?? [])].sort(
        (left, right) => getObservationTime(right) - getObservationTime(left)
      );

      const alarmCount = patientObservations.filter(
        (observation) => classifyObservationSeverity(observation) !== "normal"
      ).length;
      const criticalOutlierCount = patientObservations.filter(
        (observation) => classifyObservationSeverity(observation) === "critical"
      ).length;

      return {
        patient,
        observations: patientObservations,
        alarmCount,
        criticalOutlierCount,
        latestObservation: patientObservations[0] ?? null
      };
    })
    .sort(
      (left, right) =>
        right.criticalOutlierCount - left.criticalOutlierCount ||
        right.alarmCount - left.alarmCount ||
        right.observations.length - left.observations.length ||
        getPatientDisplayName(left.patient).localeCompare(getPatientDisplayName(right.patient))
    );
}

export function buildMetricInsights(
  observations: ObservationResource[],
  patients: PatientResource[]
): MetricInsight[] {
  const patientMap = getPatientMap(patients);
  const groupedMetrics = new Map<
    string,
    {
      key: string;
      label: string;
      unit: string;
      total: number;
      warningCount: number;
      criticalCount: number;
      totalValue: number;
      minValue: number;
      maxValue: number;
      patientIds: Set<string>;
      latestObservation: ObservationResource | null;
    }
  >();

  observations.forEach((observation) => {
    const key = normalizeMetricKey(observation.code.text);
    const current = groupedMetrics.get(key) ?? {
      key,
      label: formatObservationCode(observation.code.text),
      unit: observation.valueQuantity.unit,
      total: 0,
      warningCount: 0,
      criticalCount: 0,
      totalValue: 0,
      minValue: observation.valueQuantity.value,
      maxValue: observation.valueQuantity.value,
      patientIds: new Set<string>(),
      latestObservation: null
    };

    const severity = classifyObservationSeverity(observation);
    const patientId = observation.subject.reference.split("/")[1];

    current.total += 1;
    current.totalValue += observation.valueQuantity.value;
    current.unit = observation.valueQuantity.unit || current.unit;
    current.minValue = Math.min(current.minValue, observation.valueQuantity.value);
    current.maxValue = Math.max(current.maxValue, observation.valueQuantity.value);

    if (patientId) {
      current.patientIds.add(patientId);
    }

    if (severity === "warning") {
      current.warningCount += 1;
    }

    if (severity === "critical") {
      current.criticalCount += 1;
    }

    if (
      !current.latestObservation ||
      getObservationTime(observation) > getObservationTime(current.latestObservation)
    ) {
      current.latestObservation = observation;
    }

    groupedMetrics.set(key, current);
  });

  return [...groupedMetrics.values()]
    .map((metric) => {
      const latestPatientId = metric.latestObservation?.subject.reference.split("/")[1] ?? null;
      const latestPatient = latestPatientId ? patientMap.get(latestPatientId) : null;

      return {
        key: metric.key,
        label: metric.label,
        unit: metric.unit,
        total: metric.total,
        warningCount: metric.warningCount,
        criticalCount: metric.criticalCount,
        patientCount: metric.patientIds.size,
        averageValue: Number((metric.totalValue / Math.max(metric.total, 1)).toFixed(1)),
        minValue: metric.minValue,
        maxValue: metric.maxValue,
        latestObservation: metric.latestObservation,
        latestPatientLabel: latestPatient ? getPatientDisplayName(latestPatient) : null
      };
    })
    .sort(
      (left, right) =>
        right.criticalCount - left.criticalCount ||
        right.warningCount - left.warningCount ||
        right.total - left.total ||
        left.label.localeCompare(right.label)
    );
}

export function buildMetricTrend(
  observations: ObservationResource[],
  patients: PatientResource[],
  metricKey: string,
  limit = 14
): MetricTrendPoint[] {
  const patientMap = getPatientMap(patients);

  return observations
    .filter((observation) => normalizeMetricKey(observation.code.text) === metricKey)
    .sort((left, right) => getObservationTime(right) - getObservationTime(left))
    .slice(0, limit)
    .reverse()
    .map((observation) => {
      const patientId = observation.subject.reference.split("/")[1] ?? "0";
      const patient = patientMap.get(patientId);

      return {
        id: observation.id,
        patientId,
        patientLabel: patient ? getPatientDisplayName(patient) : `Paciente ${patientId}`,
        timestamp: observation.effectiveDateTime,
        shortLabel: formatShortTimestamp(observation.effectiveDateTime),
        value: observation.valueQuantity.value,
        unit: observation.valueQuantity.unit,
        severity: classifyObservationSeverity(observation)
      };
    });
}

export function buildOperationalHighlights(
  patientInsights: PatientInsight[],
  metricInsights: MetricInsight[],
  observations: ObservationResource[],
  patients: PatientResource[]
): OperationalHighlight[] {
  const patientMap = getPatientMap(patients);
  const highestRiskPatient = patientInsights[0] ?? null;
  const mostPressuredMetric = metricInsights[0] ?? null;
  const latestCriticalMetric =
    observations
      .filter((observation) => classifyObservationSeverity(observation) === "critical")
      .sort((left, right) => getObservationTime(right) - getObservationTime(left))
      .map((observation) => {
        const patientId = observation.subject.reference.split("/")[1] ?? "";
        const patient = patientMap.get(patientId);

        return {
          observation,
          patientLabel: patient ? getPatientDisplayName(patient) : observation.subject.reference
        };
      })[0] ??
    null;

  return [
    highestRiskPatient
      ? {
          id: "patient-focus",
          title: "Paciente con mayor carga de alertas",
          value: getPatientDisplayName(highestRiskPatient.patient),
          detail: `${highestRiskPatient.alarmCount} alertas, ${highestRiskPatient.criticalOutlierCount} criticas y ${highestRiskPatient.observations.length} observaciones.`,
          tone:
            highestRiskPatient.criticalOutlierCount > 0
              ? "critical"
              : highestRiskPatient.alarmCount > 0
                ? "warning"
                : "default"
        }
      : {
          id: "patient-focus",
          title: "Paciente con mayor carga de alertas",
          value: "Sin datos",
          detail: "Todavia no hay observaciones para priorizar riesgo clinico.",
          tone: "default"
        },
    mostPressuredMetric
      ? {
          id: "metric-focus",
          title: "Metrica con mayor presion operativa",
          value: mostPressuredMetric.label,
          detail: `${mostPressuredMetric.criticalCount} criticos, ${mostPressuredMetric.warningCount} preventivos y promedio ${mostPressuredMetric.averageValue} ${mostPressuredMetric.unit}.`,
          tone:
            mostPressuredMetric.criticalCount > 0
              ? "critical"
              : mostPressuredMetric.warningCount > 0
                ? "warning"
                : "default"
        }
      : {
          id: "metric-focus",
          title: "Metrica con mayor presion operativa",
          value: "Sin datos",
          detail: "No hay metricas suficientes para construir patrones clinicos.",
          tone: "default"
        },
    latestCriticalMetric
      ? {
          id: "latest-critical",
          title: "Evento critico mas reciente",
          value: `${formatObservationCode(latestCriticalMetric.observation.code.text)} ${latestCriticalMetric.observation.valueQuantity.value} ${latestCriticalMetric.observation.valueQuantity.unit}`,
          detail: `${latestCriticalMetric.patientLabel} · ${formatShortTimestamp(latestCriticalMetric.observation.effectiveDateTime)}.`,
          tone: "critical"
        }
      : {
          id: "latest-critical",
          title: "Evento critico mas reciente",
          value: "Sin eventos criticos",
          detail: "Los registros recientes no muestran valores clinicos fuera de rango critico.",
          tone: "default"
        }
  ];
}
