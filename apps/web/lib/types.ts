export type UserRole = "doctor_admin" | "patient";

export interface AuthUser {
  id?: string;
  email?: string;
  fullName?: string;
  role: UserRole;
  patientId: number | null;
  authType?: "jwt" | "api_key";
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface FhirIdentifier {
  system?: string;
  value: string;
}

export interface FhirHumanName {
  given: string[];
  family: string;
}

export interface PatientResource {
  resourceType: "Patient";
  id: string;
  active: boolean;
  identifier: FhirIdentifier[];
  name: FhirHumanName[];
  gender: string;
  birthDate: string;
  medicalSummary?: string;
  meta: {
    lastUpdated: string;
  };
}

export interface ObservationResource {
  resourceType: "Observation";
  id: string;
  status: string;
  code: {
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  valueQuantity: {
    value: number;
    unit: string;
  };
  interpretation?: Array<{ text: string }>;
  note?: Array<{ text: string }>;
}

export interface FhirBundle<T> {
  resourceType: "Bundle";
  type: "searchset";
  total: number;
  limit: number;
  offset: number;
  entry: Array<{ resource: T }>;
}

export interface AdminDashboardData {
  totals: {
    patients: number;
    observations: number;
    outliers: number;
    activeUsers: number;
  };
  recentPatients: PatientResource[];
  outlierObservations: ObservationResource[];
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  patientId: number | null;
  createdAt: string;
}

export interface ApiKeySummary {
  id: string;
  label: string;
  role: UserRole;
  ownerUserId: string | null;
  ownerEmail: string | null;
  isActive: boolean;
  createdAt: string;
}
