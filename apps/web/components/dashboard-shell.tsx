"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../lib/api";
import { useAuth } from "./auth-provider";

interface NavItem {
  href: string;
  label: string;
  description: string;
}

const doctorNav: NavItem[] = [
  {
    href: "/dashboard/doctor/overview",
    label: "Resumen",
    description: "Monitoreo clinico y alertas"
  },
  {
    href: "/dashboard/doctor/patients",
    label: "Pacientes",
    description: "CRUD y seguimiento"
  },
  {
    href: "/dashboard/doctor/observations",
    label: "Observaciones",
    description: "Registro y mantenimiento"
  },
  {
    href: "/dashboard/doctor/access",
    label: "Accesos",
    description: "Usuarios y API keys"
  }
];

const patientNav: NavItem[] = [
  {
    href: "/dashboard/patient/overview",
    label: "Resumen",
    description: "Estado general y tendencias"
  },
  {
    href: "/dashboard/patient/history",
    label: "Historico",
    description: "Linea de tiempo clinica"
  },
  {
    href: "/dashboard/patient/reports",
    label: "Reportes",
    description: "Resumen y exportacion"
  }
];

export function DashboardShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, token, user, refreshUser, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const sessionActionsRef = useRef({ refreshUser, logout });

  useEffect(() => {
    sessionActionsRef.current = { refreshUser, logout };
  }, [logout, refreshUser]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    sessionActionsRef.current.refreshUser().catch((refreshError) => {
      setError(
        refreshError instanceof ApiError
          ? refreshError.message
          : "No fue posible validar la sesion."
      );
      sessionActionsRef.current.logout();
      router.replace("/login");
    });
  }, [ready, router, token]);

  useEffect(() => {
    if (!ready || !token || !user) {
      return;
    }

    const defaultPath =
      user.role === "doctor_admin"
        ? "/dashboard/doctor/overview"
        : "/dashboard/patient/overview";

    if (pathname === "/dashboard") {
      router.replace(defaultPath);
      return;
    }

    if (user.role === "doctor_admin" && pathname.startsWith("/dashboard/patient")) {
      router.replace(defaultPath);
      return;
    }

    if (user.role === "patient" && pathname.startsWith("/dashboard/doctor")) {
      router.replace(defaultPath);
    }
  }, [pathname, ready, router, token, user]);

  const navigation = useMemo(
    () => (user?.role === "doctor_admin" ? doctorNav : patientNav),
    [user?.role]
  );

  const currentSection = navigation.find((item) => pathname.startsWith(item.href));

  if (!ready || !token || !user) {
    return <main className="dashboard-shell loading-panel">Cargando sesion...</main>;
  }

  return (
    <main className="dashboard-shell workspace-shell">
      <aside className="workspace-sidebar glass-card">
        <div className="sidebar-brand">
          <span className="eyebrow">HealthDashboard</span>
          <h1>{user.role === "doctor_admin" ? "Workspace medico" : "Workspace del paciente"}</h1>
          <p>{user.role === "doctor_admin" ? "Operacion clinica y acceso interoperable." : "Tu portal clinico seguro y acotado a tu registro."}</p>
        </div>

        <nav className="sidebar-nav" aria-label="Navegacion principal">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="profile-label">Sesion</span>
            <strong>{user.email}</strong>
            <span className="pill">{user.role}</span>
          </div>
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
      </aside>

      <section className="workspace-main">
        <header className="dashboard-header glass-card workspace-header">
          <div>
            <span className="eyebrow">Modulo activo</span>
            <h2>{currentSection?.label ?? "Dashboard"}</h2>
            <p>{currentSection?.description ?? "Espacio de trabajo por rol"}</p>
          </div>
          <div className="header-actions">
            <span className="pill">{user.role === "doctor_admin" ? "Doctor Admin" : "Paciente"}</span>
          </div>
        </header>

        {error ? <div className="glass-card form-error-banner">{error}</div> : null}

        {children}
      </section>
    </main>
  );
}
