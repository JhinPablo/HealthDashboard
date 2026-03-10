import { ObservationResource, PatientResource } from "./types";

export type ObservationSeverity = "normal" | "warning" | "critical";

function normalizeObservationCode(code: string): string {
  return code.toLowerCase().replace(/[_\s]+/g, "-");
}

export function classifyObservationSeverity(
  observation: ObservationResource
): ObservationSeverity {
  const code = normalizeObservationCode(observation.code.text);
  const value = observation.valueQuantity.value;

  if (code.includes("temperature")) {
    if (value <= 35 || value >= 39) {
      return "critical";
    }

    if (value < 36 || value >= 37.5) {
      return "warning";
    }
  }

  if (code.includes("heart")) {
    if (value <= 40 || value >= 120) {
      return "critical";
    }

    if (value <= 50 || value >= 100) {
      return "warning";
    }
  }

  if (code.includes("systolic")) {
    if (value <= 80 || value >= 180) {
      return "critical";
    }

    if (value <= 90 || value >= 140) {
      return "warning";
    }
  }

  if (code.includes("diastolic")) {
    if (value <= 50 || value >= 120) {
      return "critical";
    }

    if (value <= 60 || value >= 90) {
      return "warning";
    }
  }

  if (code.includes("spo2") || code.includes("oxygen")) {
    if (value <= 90) {
      return "critical";
    }

    if (value < 94) {
      return "warning";
    }
  }

  return "normal";
}

export function getObservationPatientId(
  observation: ObservationResource
): number | null {
  const rawId = observation.subject.reference.split("/")[1];
  const patientId = Number(rawId);

  return Number.isNaN(patientId) ? null : patientId;
}

export function getPatientDisplayName(patient: PatientResource): string {
  const given = patient.name[0]?.given[0] ?? "";
  const family = patient.name[0]?.family ?? "";
  return `${given} ${family}`.trim() || `Paciente ${patient.id}`;
}

export function formatObservationCode(code: string): string {
  return code
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
