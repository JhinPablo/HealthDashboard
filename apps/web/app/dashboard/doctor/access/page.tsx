"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../../../../components/auth-provider";
import { api } from "../../../../lib/api";
import { useDoctorWorkspace } from "../../../../lib/use-doctor-workspace";

const initialPatientUserForm = {
  patientId: "",
  email: "",
  fullName: "",
  password: "",
  apiKeyLabel: "",
  accessKey: "",
  permissionKey: ""
};

const initialApiKeyForm = {
  label: "",
  role: "doctor_admin" as "doctor_admin" | "patient",
  accessKey: "",
  permissionKey: "",
  ownerUserId: ""
};

export default function DoctorAccessPage() {
  const { token, user } = useAuth();
  const [patientUserForm, setPatientUserForm] = useState(initialPatientUserForm);
  const [apiKeyForm, setApiKeyForm] = useState(initialApiKeyForm);

  if (!token || user?.role !== "doctor_admin") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = useDoctorWorkspace(token);

  return (
    <section className="dashboard-grid">
      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}
      {workspace.feedback ? (
        <div className="glass-card success-banner">{workspace.feedback}</div>
      ) : null}

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Crear cuenta portal para paciente</h3>
            <p>Vincula un usuario web y, si lo necesitas, un par de API keys al paciente.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            workspace.submitAction(
              async () => {
                await api.createPatientUser(token, {
                  patientId: Number(patientUserForm.patientId),
                  email: patientUserForm.email,
                  fullName: patientUserForm.fullName,
                  password: patientUserForm.password,
                  apiKeyLabel: patientUserForm.apiKeyLabel || undefined,
                  accessKey: patientUserForm.accessKey || undefined,
                  permissionKey: patientUserForm.permissionKey || undefined
                });
                setPatientUserForm(initialPatientUserForm);
              },
              "Cuenta de paciente creada.",
              "No fue posible crear la cuenta del paciente."
            );
          }}
        >
          <input
            type="number"
            placeholder="Patient ID"
            value={patientUserForm.patientId}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, patientId: event.target.value }))
            }
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={patientUserForm.email}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, email: event.target.value }))
            }
            required
          />
          <input
            placeholder="Nombre completo"
            value={patientUserForm.fullName}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, fullName: event.target.value }))
            }
            required
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={patientUserForm.password}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
          <input
            placeholder="Label API key"
            value={patientUserForm.apiKeyLabel}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, apiKeyLabel: event.target.value }))
            }
          />
          <input
            placeholder="X-Access-Key"
            value={patientUserForm.accessKey}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, accessKey: event.target.value }))
            }
          />
          <input
            placeholder="X-Permission-Key"
            value={patientUserForm.permissionKey}
            onChange={(event) =>
              setPatientUserForm((current) => ({ ...current, permissionKey: event.target.value }))
            }
          />
          <button type="submit" className="primary-button" disabled={workspace.isPending}>
            {workspace.isPending ? "Guardando..." : "Crear cuenta"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Gestion de integraciones</h3>
            <p>API keys dobles para Swagger, Postman y consumo externo controlado.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            workspace.submitAction(
              async () => {
                await api.createApiKey(token, {
                  ...apiKeyForm,
                  ownerUserId: apiKeyForm.ownerUserId || undefined
                });
                setApiKeyForm(initialApiKeyForm);
              },
              "Par de API keys creado.",
              "No fue posible crear las API keys."
            );
          }}
        >
          <input
            placeholder="Label"
            value={apiKeyForm.label}
            onChange={(event) =>
              setApiKeyForm((current) => ({ ...current, label: event.target.value }))
            }
            required
          />
          <select
            value={apiKeyForm.role}
            onChange={(event) =>
              setApiKeyForm((current) => ({
                ...current,
                role: event.target.value as "doctor_admin" | "patient"
              }))
            }
          >
            <option value="doctor_admin">doctor_admin</option>
            <option value="patient">patient</option>
          </select>
          <input
            placeholder="X-Access-Key"
            value={apiKeyForm.accessKey}
            onChange={(event) =>
              setApiKeyForm((current) => ({ ...current, accessKey: event.target.value }))
            }
            required
          />
          <input
            placeholder="X-Permission-Key"
            value={apiKeyForm.permissionKey}
            onChange={(event) =>
              setApiKeyForm((current) => ({ ...current, permissionKey: event.target.value }))
            }
            required
          />
          <input
            placeholder="Owner user ID opcional"
            value={apiKeyForm.ownerUserId}
            onChange={(event) =>
              setApiKeyForm((current) => ({ ...current, ownerUserId: event.target.value }))
            }
          />
          <button type="submit" className="primary-button" disabled={workspace.isPending}>
            {workspace.isPending ? "Guardando..." : "Crear API key"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Usuarios y llaves vigentes</h3>
            <p>Inventario actual de accesos portal e integraciones activas.</p>
          </div>
        </div>
        <div className="split-tables">
          <div className="data-table compact-table">
            <div className="table-head">
              <span>Usuario</span>
              <span>Rol</span>
              <span>Activo</span>
            </div>
            {workspace.users.map((currentUser) => (
              <div className="table-row" key={currentUser.id}>
                <span>{currentUser.email}</span>
                <span>{currentUser.role}</span>
                <span>{currentUser.isActive ? "Si" : "No"}</span>
              </div>
            ))}
          </div>

          <div className="data-table compact-table">
            <div className="table-head">
              <span>Label</span>
              <span>Rol</span>
              <span>Owner</span>
            </div>
            {workspace.apiKeys.map((currentKey) => (
              <div className="table-row" key={currentKey.id}>
                <span>{currentKey.label}</span>
                <span>{currentKey.role}</span>
                <span>{currentKey.ownerEmail ?? "sin owner"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
