"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  classifyObservationSeverity,
  formatObservationCode,
  getObservationPatientId,
  getPatientDisplayName
} from "../lib/clinical-insights";
import { api, ApiError } from "../lib/api";
import {
  AdminDashboardData,
  ApiKeySummary,
  ObservationResource,
  PatientResource,
  UserSummary
} from "../lib/types";
import { PatientAlertChart } from "./patient-alert-chart";
import { StatCard } from "./stat-card";

interface DoctorDashboardProps {
  token: string;
}

interface PatientInsight {
  patient: PatientResource;
  observations: ObservationResource[];
  alarmCount: number;
  criticalOutlierCount: number;
  latestObservation: ObservationResource | null;
}

type ApiKeyFormState = {
  label: string;
  role: "doctor_admin" | "patient";
  accessKey: string;
  permissionKey: string;
  ownerUserId: string;
};

const initialPatientForm = {
  givenName: "",
  familyName: "",
  identifierValue: "",
  gender: "female",
  birthDate: "",
  medicalSummary: ""
};

const initialObservationForm = {
  patientId: "",
  code: "body-temperature",
  value: "",
  unit: "C",
  effectiveDateTime: "",
  status: "final",
  note: ""
};

const initialPatientUserForm = {
  patientId: "",
  email: "",
  fullName: "",
  password: "",
  apiKeyLabel: "",
  accessKey: "",
  permissionKey: ""
};

const initialApiKeyForm: ApiKeyFormState = {
  label: "",
  role: "doctor_admin",
  accessKey: "",
  permissionKey: "",
  ownerUserId: ""
};

function buildPatientInsights(
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
        (left, right) =>
          new Date(right.effectiveDateTime).getTime() -
          new Date(left.effectiveDateTime).getTime()
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

export function DoctorDashboard({ token }: DoctorDashboardProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [patients, setPatients] = useState<PatientResource[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [observations, setObservations] = useState<ObservationResource[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState(initialPatientForm);
  const [observationForm, setObservationForm] = useState(initialObservationForm);
  const [patientUserForm, setPatientUserForm] = useState(initialPatientUserForm);
  const [apiKeyForm, setApiKeyForm] = useState(initialApiKeyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    const [dashboardResponse, patientsResponse, usersResponse, apiKeysResponse, observationsResponse] =
      await Promise.all([
        api.getDoctorDashboard(token),
        api.getPatients(token),
        api.getUsers(token),
        api.getApiKeys(token),
        api.getObservations(token)
      ]);

    const patientResources = patientsResponse.entry.map((entry) => entry.resource);
    const observationResources = observationsResponse.entry.map((entry) => entry.resource);

    setDashboard(dashboardResponse);
    setPatients(patientResources);
    setUsers(usersResponse);
    setApiKeys(apiKeysResponse);
    setObservations(observationResources);
    setSelectedPatientId((current) => {
      if (current && patientResources.some((patient) => patient.id === current)) {
        return current;
      }

      return buildPatientInsights(patientResources, observationResources)[0]?.patient.id ?? null;
    });
  };

  useEffect(() => {
    loadData().catch((loadError) => {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "No fue posible cargar el dashboard medico."
      );
    });
  }, [token]);

  const submitAction = (
    action: () => Promise<void>,
    successMessage: string,
    failureMessage: string
  ) => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await action();
        setFeedback(successMessage);
        await loadData();
      } catch (submissionError) {
        setError(
          submissionError instanceof ApiError ? submissionError.message : failureMessage
        );
      }
    });
  };

  const patientInsights = buildPatientInsights(patients, observations);
  const selectedInsight =
    patientInsights.find((insight) => insight.patient.id === selectedPatientId) ??
    patientInsights[0] ??
    null;
  const selectedPatientAlerts =
    selectedInsight?.observations.filter(
      (observation) => classifyObservationSeverity(observation) !== "normal"
    ) ?? [];
  const highlightedPatients = patientInsights.slice(0, 8).map((insight) => ({
    id: insight.patient.id,
    label: getPatientDisplayName(insight.patient),
    observations: insight.observations.length,
    alarms: insight.alarmCount,
    criticalOutliers: insight.criticalOutlierCount,
    isSelected: insight.patient.id === selectedInsight?.patient.id
  }));

  return (
    <section className="dashboard-grid">
      <div className="stats-grid">
        <StatCard label="Pacientes" value={dashboard?.totals.patients ?? 0} />
        <StatCard label="Observaciones" value={dashboard?.totals.observations ?? 0} />
        <StatCard
          label="Outliers"
          value={dashboard?.totals.outliers ?? 0}
          tone={(dashboard?.totals.outliers ?? 0) > 0 ? "alert" : "default"}
        />
        <StatCard label="Usuarios activos" value={dashboard?.totals.activeUsers ?? 0} />
      </div>

      {error ? <div className="glass-card form-error-banner">{error}</div> : null}
      {feedback ? <div className="glass-card success-banner">{feedback}</div> : null}

      <PatientAlertChart
        title="Alarmas y outliers por paciente"
        subtitle="Haz click en una barra para inspeccionar el historial operativo del paciente."
        data={highlightedPatients}
        onSelect={setSelectedPatientId}
      />

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Paciente seleccionado</h3>
            <p>
              Detalle contextual del paciente activo, con foco en alarmas clinicas y
              registros recientes.
            </p>
          </div>
          {selectedInsight ? <span className="pill">{selectedInsight.patient.id}</span> : null}
        </div>

        {selectedInsight ? (
          <>
            <div className="profile-block">
              <div>
                <span className="profile-label">Paciente</span>
                <strong>{getPatientDisplayName(selectedInsight.patient)}</strong>
              </div>
              <div>
                <span className="profile-label">Observaciones</span>
                <strong>{selectedInsight.observations.length}</strong>
              </div>
              <div>
                <span className="profile-label">Alarmas</span>
                <strong>{selectedInsight.alarmCount}</strong>
              </div>
              <div>
                <span className="profile-label">Outliers criticos</span>
                <strong>{selectedInsight.criticalOutlierCount}</strong>
              </div>
              <div>
                <span className="profile-label">Documento</span>
                <strong>{selectedInsight.patient.identifier[0]?.value ?? "Sin documento"}</strong>
              </div>
              <div>
                <span className="profile-label">Ultimo registro</span>
                <strong>
                  {selectedInsight.latestObservation
                    ? new Date(selectedInsight.latestObservation.effectiveDateTime).toLocaleString(
                        "es-CL"
                      )
                    : "Sin observaciones"}
                </strong>
              </div>
            </div>

            <div className="detail-subsection">
              <span className="profile-label">Ultimas alertas del paciente</span>
              <div className="stack-list">
                {selectedPatientAlerts.length ? (
                  selectedPatientAlerts.slice(0, 5).map((observation) => {
                    const severity = classifyObservationSeverity(observation);

                    return (
                      <article
                        key={observation.id}
                        className={
                          severity === "critical"
                            ? "observation-item alert-item"
                            : "observation-item warning-item"
                        }
                      >
                        <div>
                          <strong>{formatObservationCode(observation.code.text)}</strong>
                          <span>
                            {new Date(observation.effectiveDateTime).toLocaleString("es-CL")}
                          </span>
                        </div>
                        <div className="observation-side">
                          <strong>
                            {observation.valueQuantity.value} {observation.valueQuantity.unit}
                          </strong>
                          <span>
                            {severity === "critical" ? "Outlier critico" : "Alarma preventiva"}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state compact-empty">
                    Este paciente no presenta alarmas activas en los datos cargados.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">Selecciona un paciente para inspeccionar el detalle.</div>
        )}
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Alertas clinicas</h3>
            <p>Valores fuera de rango detectados automaticamente.</p>
          </div>
        </div>
        <div className="stack-list">
          {dashboard?.outlierObservations.length ? (
            dashboard.outlierObservations.map((observation) => (
              <article
                key={observation.id}
                className="alert-item clickable-card"
                onClick={() => setSelectedPatientId(observation.subject.reference.split("/")[1] ?? null)}
              >
                <strong>{formatObservationCode(observation.code.text)}</strong>
                <span>{observation.subject.reference}</span>
                <span>
                  {observation.valueQuantity.value} {observation.valueQuantity.unit}
                </span>
              </article>
            ))
          ) : (
            <div className="empty-state">No hay outliers recientes.</div>
          )}
        </div>
      </section>

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Panel general de pacientes</h3>
            <p>Vista resumida del historico y acceso rapido al registro interoperable.</p>
          </div>
        </div>
        <div className="data-table">
          <div className="table-head">
            <span>Paciente</span>
            <span>Documento</span>
            <span>Genero</span>
            <span>Nacimiento</span>
          </div>
          {patients.map((patient) => (
            <div className="table-row" key={patient.id}>
              <span>{`${patient.name[0]?.given[0] ?? ""} ${patient.name[0]?.family ?? ""}`}</span>
              <span>{patient.identifier[0]?.value}</span>
              <span>{patient.gender}</span>
              <span>{patient.birthDate}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Registrar paciente</h3>
            <p>Crea el recurso `Patient` cifrando documento y resumen medico.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitAction(
              async () => {
                await api.createPatient(token, patientForm);
                setPatientForm(initialPatientForm);
              },
              "Paciente registrado correctamente.",
              "No fue posible crear el paciente."
            );
          }}
        >
          <input
            placeholder="Nombre"
            value={patientForm.givenName}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, givenName: event.target.value }))
            }
            required
          />
          <input
            placeholder="Apellido"
            value={patientForm.familyName}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, familyName: event.target.value }))
            }
            required
          />
          <input
            placeholder="Documento"
            value={patientForm.identifierValue}
            onChange={(event) =>
              setPatientForm((current) => ({
                ...current,
                identifierValue: event.target.value
              }))
            }
            required
          />
          <select
            value={patientForm.gender}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, gender: event.target.value }))
            }
          >
            <option value="female">female</option>
            <option value="male">male</option>
            <option value="other">other</option>
            <option value="unknown">unknown</option>
          </select>
          <input
            type="date"
            value={patientForm.birthDate}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, birthDate: event.target.value }))
            }
            required
          />
          <textarea
            placeholder="Resumen medico"
            value={patientForm.medicalSummary}
            onChange={(event) =>
              setPatientForm((current) => ({
                ...current,
                medicalSummary: event.target.value
              }))
            }
            rows={4}
            required
          />
          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Guardando..." : "Crear paciente"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Registrar observacion</h3>
            <p>Ingresa signos vitales con deteccion de outliers.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitAction(
              async () => {
                await api.createObservation(token, {
                  patientId: Number(observationForm.patientId),
                  code: observationForm.code,
                  value: Number(observationForm.value),
                  unit: observationForm.unit,
                  effectiveDateTime: observationForm.effectiveDateTime,
                  status: observationForm.status,
                  note: observationForm.note
                });
                setObservationForm(initialObservationForm);
              },
              "Observacion clinica registrada.",
              "No fue posible registrar la observacion."
            );
          }}
        >
          <input
            type="number"
            placeholder="Patient ID"
            value={observationForm.patientId}
            onChange={(event) =>
              setObservationForm((current) => ({ ...current, patientId: event.target.value }))
            }
            required
          />
          <input
            placeholder="Codigo"
            value={observationForm.code}
            onChange={(event) =>
              setObservationForm((current) => ({ ...current, code: event.target.value }))
            }
            required
          />
          <input
            type="number"
            step="0.1"
            placeholder="Valor"
            value={observationForm.value}
            onChange={(event) =>
              setObservationForm((current) => ({ ...current, value: event.target.value }))
            }
            required
          />
          <input
            placeholder="Unidad"
            value={observationForm.unit}
            onChange={(event) =>
              setObservationForm((current) => ({ ...current, unit: event.target.value }))
            }
            required
          />
          <input
            type="datetime-local"
            onChange={(event) =>
              setObservationForm((current) => ({
                ...current,
                effectiveDateTime: new Date(event.target.value).toISOString()
              }))
            }
            required
          />
          <input
            placeholder="Estado"
            value={observationForm.status}
            onChange={(event) =>
              setObservationForm((current) => ({ ...current, status: event.target.value }))
            }
            required
          />
          <textarea
            placeholder="Nota clinica"
            value={observationForm.note}
            onChange={(event) =>
              setObservationForm((current) => ({ ...current, note: event.target.value }))
            }
            rows={3}
          />
          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Guardando..." : "Crear observacion"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Crear cuenta de paciente</h3>
            <p>Vincula login portal y API keys opcionales a un `patient_id` existente.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitAction(
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
              setPatientUserForm((current) => ({
                ...current,
                apiKeyLabel: event.target.value
              }))
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
              setPatientUserForm((current) => ({
                ...current,
                permissionKey: event.target.value
              }))
            }
          />
          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Guardando..." : "Crear cuenta"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Gestion de integraciones</h3>
            <p>Administra API keys para Swagger, Postman y consumo externo.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitAction(
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
              setApiKeyForm((current) => ({
                ...current,
                permissionKey: event.target.value
              }))
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
          <button type="submit" className="primary-button" disabled={isPending}>
            {isPending ? "Guardando..." : "Crear API key"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Usuarios y llaves</h3>
            <p>Estado actual de accesos operativos y credenciales de integracion.</p>
          </div>
        </div>
        <div className="split-tables">
          <div className="data-table compact-table">
            <div className="table-head">
              <span>Usuario</span>
              <span>Rol</span>
              <span>Activo</span>
            </div>
            {users.map((user) => (
              <div className="table-row" key={user.id}>
                <span>{user.email}</span>
                <span>{user.role}</span>
                <span>{user.isActive ? "Si" : "No"}</span>
              </div>
            ))}
          </div>

          <div className="data-table compact-table">
            <div className="table-head">
              <span>Label</span>
              <span>Rol</span>
              <span>Owner</span>
            </div>
            {apiKeys.map((apiKey) => (
              <div className="table-row" key={apiKey.id}>
                <span>{apiKey.label}</span>
                <span>{apiKey.role}</span>
                <span>{apiKey.ownerEmail ?? "sin owner"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
