import {
  AdminDashboardData,
  ApiKeySummary,
  AuthUser,
  FhirBundle,
  LoginResponse,
  ObservationResource,
  PatientResource,
  UserSummary
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      if (typeof errorBody.message === "string") {
        message = errorBody.message;
      } else if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(", ");
      }
    } catch {
      // Keep generic message.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  me: (token: string) => apiFetch<AuthUser>("/auth/me", {}, token),

  getDoctorDashboard: (token: string) =>
    apiFetch<AdminDashboardData>("/admin/dashboard", {}, token),

  getUsers: (token: string) => apiFetch<UserSummary[]>("/admin/users", {}, token),

  getApiKeys: (token: string) => apiFetch<ApiKeySummary[]>("/admin/api-keys", {}, token),

  getPatients: (token: string, limit = 50, offset = 0) =>
    apiFetch<FhirBundle<PatientResource>>(
      `/fhir/Patient?limit=${limit}&offset=${offset}`,
      {},
      token
    ),

  getPatient: (token: string, patientId: number) =>
    apiFetch<PatientResource>(`/fhir/Patient/${patientId}`, {}, token),

  getObservations: (token: string, patientId?: number) =>
    apiFetch<FhirBundle<ObservationResource>>(
      `/fhir/Observation?limit=50&offset=0${patientId ? `&patientId=${patientId}` : ""}`,
      {},
      token
    ),

  createPatient: (
    token: string,
    payload: {
      givenName: string;
      familyName: string;
      identifierValue: string;
      gender: string;
      birthDate: string;
      medicalSummary: string;
    }
  ) =>
    apiFetch<PatientResource>(
      "/fhir/Patient",
      {
        method: "POST",
        body: JSON.stringify({
          resourceType: "Patient",
          identifier: [{ system: "national-id", value: payload.identifierValue }],
          name: [{ given: [payload.givenName], family: payload.familyName }],
          gender: payload.gender,
          birthDate: payload.birthDate,
          medicalSummary: payload.medicalSummary
        })
      },
      token
    ),

  createObservation: (
    token: string,
    payload: {
      patientId: number;
      code: string;
      value: number;
      unit: string;
      effectiveDateTime: string;
      status: string;
      note?: string;
    }
  ) =>
    apiFetch<ObservationResource>(
      "/fhir/Observation",
      {
        method: "POST",
        body: JSON.stringify({
          resourceType: "Observation",
          status: payload.status,
          code: { text: payload.code },
          subject: { reference: `Patient/${payload.patientId}` },
          effectiveDateTime: payload.effectiveDateTime,
          valueQuantity: {
            value: payload.value,
            unit: payload.unit
          },
          note: payload.note
        })
      },
      token
    ),

  createPatientUser: (
    token: string,
    payload: {
      patientId: number;
      email: string;
      fullName: string;
      password: string;
      apiKeyLabel?: string;
      accessKey?: string;
      permissionKey?: string;
    }
  ) =>
    apiFetch("/admin/users/patient", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token),

  createApiKey: (
    token: string,
    payload: {
      label: string;
      role: "doctor_admin" | "patient";
      accessKey: string;
      permissionKey: string;
      ownerUserId?: string;
    }
  ) =>
    apiFetch("/admin/api-keys", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token),

  deactivateApiKey: (token: string, apiKeyId: string) =>
    apiFetch(`/admin/api-keys/${apiKeyId}/deactivate`, { method: "PATCH" }, token)
};
