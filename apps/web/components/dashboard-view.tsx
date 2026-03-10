"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { DoctorDashboard } from "./doctor-dashboard";
import { PatientDashboard } from "./patient-dashboard";
import { useAuth } from "./auth-provider";

export function DashboardView() {
  const router = useRouter();
  const { ready, token, user, refreshUser, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    refreshUser().catch((refreshError) => {
      setError(
        refreshError instanceof ApiError
          ? refreshError.message
          : "No fue posible validar la sesion."
      );
      logout();
      router.replace("/login");
    });
  }, [logout, ready, refreshUser, router, token]);

  if (!ready || !token || !user) {
    return <main className="dashboard-shell loading-panel">Cargando sesion...</main>;
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header glass-card">
        <div>
          <span className="eyebrow">Sesion activa</span>
          <h1>{user.role === "doctor_admin" ? "Panel medico administrador" : "Portal del paciente"}</h1>
          <p>{user.email}</p>
        </div>
        <div className="header-actions">
          <span className="pill">{user.role}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </header>

      {error ? <div className="glass-card form-error-banner">{error}</div> : null}

      {user.role === "doctor_admin" ? (
        <DoctorDashboard token={token} />
      ) : (
        <PatientDashboard token={token} patientId={user.patientId} />
      )}
    </main>
  );
}
