"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { ApiError } from "../lib/api";
import { useAuth } from "./auth-provider";

export function LoginView() {
  const router = useRouter();
  const { login, user, ready } = useAuth();
  const [email, setEmail] = useState("doctor.admin@saluddigital.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (ready && user) {
      router.replace("/dashboard");
    }
  }, [ready, router, user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await login(email, password);
        router.replace("/dashboard");
      } catch (submissionError) {
        setError(
          submissionError instanceof ApiError
            ? submissionError.message
            : "No fue posible iniciar sesion."
        );
      }
    });
  };

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="hero-copy">
          <span className="eyebrow">Entregable 1 interoperable</span>
          <h1>Salud digital con acceso clinico seguro y dashboards por rol.</h1>
          <p>
            Backend FHIR-lite, seguridad hibrida JWT + API keys, cifrado de datos
            sensibles y visualizacion diferenciada para medico administrador y paciente.
          </p>
          <div className="hero-grid">
            <article>
              <strong>FHIR-lite</strong>
              <span>Patient y Observation listos para Swagger y Postman.</span>
            </article>
            <article>
              <strong>RBAC real</strong>
              <span>El medico administra; el paciente solo consume su propio historial.</span>
            </article>
            <article>
              <strong>Render-ready</strong>
              <span>Variables de entorno y blueprint preparados para despliegue.</span>
            </article>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="glass-card login-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <h2>Ingreso seguro</h2>
              <p>Usa una cuenta validada por el backend para abrir el dashboard correcto.</p>
            </div>
            <span className="pill">JWT</span>
          </div>

          <label>
            <span>Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="doctor.admin@saluddigital.local"
              required
            />
          </label>

          <label>
            <span>Contrasena</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Validando..." : "Entrar al sistema"}
          </button>

          <p className="muted-text">
            La cuenta inicial de `doctor_admin` se genera desde variables de entorno.
          </p>
        </form>
      </section>
    </main>
  );
}
