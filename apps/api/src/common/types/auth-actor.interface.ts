import { Role } from "./role.enum";

export interface AuthActor {
  authType: "jwt" | "api_key";
  role: Role;
  userId?: string;
  patientId?: number | null;
  email?: string;
  label?: string;
}
