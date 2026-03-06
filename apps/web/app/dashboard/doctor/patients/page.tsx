"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../../../components/auth-provider";
import { getPatientDisplayName } from "../../../../lib/clinical-insights";
import { api } from "../../../../lib/api";
import { useDoctorWorkspace } from "../../../../lib/use-doctor-workspace";
import { PatientResource } from "../../../../lib/types";

const initialPatientForm = {
  givenName: "",
  familyName: "",
  identifierValue: "",
  gender: "female",
  birthDate: "",
  medicalSummary: ""
};

function toEditablePatientForm(patient: PatientResource) {
  return {
    givenName: patient.name[0]?.given[0] ?? "",
    familyName: patient.name[0]?.family ?? "",
    identifierValue: patient.identifier[0]?.value ?? "",
    gender: patient.gender,
    birthDate: patient.birthDate.slice(0, 10),
    medicalSummary: patient.medicalSummary ?? ""
  };
}

export default function DoctorPatientsPage() {
  const { token, user } = useAuth();
  const [patientForm, setPatientForm] = useState(initialPatientForm);
  const [editPatientForm, setEditPatientForm] = useState(initialPatientForm);

  if (!token || user?.role !== "doctor_admin") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = useDoctorWorkspace(token);
  const selectedPatientSyncKey = workspace.selectedInsight
    ? `${workspace.selectedInsight.patient.id}:${workspace.selectedInsight.patient.meta.lastUpdated}`
    : "none";

  useEffect(() => {
    if (!workspace.selectedInsight) {
      setEditPatientForm(initialPatientForm);
      return;
    }

    setEditPatientForm(toEditablePatientForm(workspace.selectedInsight.patient));
  }, [selectedPatientSyncKey]);

  return (
    <section className="dashboard-grid">
      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}
      {workspace.feedback ? (
        <div className="glass-card success-banner">{workspace.feedback}</div>
      ) : null}

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>Gestion de pacientes</h3>
            <p>Listado operativo, busqueda rapida y mantenimiento del recurso `Patient`.</p>
          </div>
          <div className="chart-legend">
            <span className="pill">{workspace.filteredPatientInsights.length} visibles</span>
            <span className="pill">{workspace.patients.length} totales</span>
          </div>
        </div>

        <div className="management-toolbar">
          <input
            placeholder="Buscar por nombre, documento, genero o correo portal"
            value={workspace.patientSearch}
            onChange={(event) => workspace.setPatientSearch(event.target.value)}
          />
          <span className="muted-text">
            El medico administra el recurso completo; el paciente no puede ver esta vista.
          </span>
        </div>

        <div className="patient-management-grid">
          <div className="patient-roster">
            {workspace.filteredPatientInsights.length ? (
              workspace.filteredPatientInsights.map((insight) => {
                const linkedUser = workspace.patientUsersByPatientId.get(insight.patient.id);

                return (
                  <button
                    key={insight.patient.id}
                    type="button"
                    className={
                      insight.patient.id === workspace.selectedInsight?.patient.id
                        ? "patient-card patient-card-selected"
                        : "patient-card"
                    }
                    onClick={() => workspace.setSelectedPatientId(insight.patient.id)}
                  >
                    <div className="patient-card-header">
                      <strong>{getPatientDisplayName(insight.patient)}</strong>
                      <span
                        className={
                          insight.criticalOutlierCount > 0
                            ? "status-chip status-chip-critical"
                            : insight.alarmCount > 0
                              ? "status-chip status-chip-warning"
                              : "status-chip status-chip-default"
                        }
                      >
                        {insight.criticalOutlierCount > 0
                          ? "Critico"
                          : insight.alarmCount > 0
                            ? "En seguimiento"
                            : "Estable"}
                      </span>
                    </div>
                    <div className="patient-card-grid">
                      <div>
                        <span className="profile-label">Documento</span>
                        <strong>{insight.patient.identifier[0]?.value ?? "Sin documento"}</strong>
                      </div>
                      <div>
                        <span className="profile-label">Portal</span>
                        <strong>{linkedUser?.email ?? "Sin cuenta"}</strong>
                      </div>
                      <div>
                        <span className="profile-label">Genero</span>
                        <strong>{insight.patient.gender}</strong>
                      </div>
                      <div>
                        <span className="profile-label">Nacimiento</span>
                        <strong>{insight.patient.birthDate}</strong>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="empty-state compact-empty">
                Ningun paciente coincide con la busqueda actual.
              </div>
            )}
          </div>

          <div className="detail-card">
            <div className="section-heading">
              <div>
                <h3>Editar paciente seleccionado</h3>
                <p>Actualiza datos demograficos y resumen medico con persistencia cifrada.</p>
              </div>
            </div>

            {workspace.selectedInsight ? (
              <form
                className="form-grid"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  workspace.submitAction(
                    async () => {
                      await api.updatePatient(
                        token,
                        Number(workspace.selectedInsight?.patient.id),
                        editPatientForm
                      );
                    },
                    "Paciente actualizado correctamente.",
                    "No fue posible actualizar el paciente."
                  );
                }}
              >
                <input
                  placeholder="Nombre"
                  value={editPatientForm.givenName}
                  onChange={(event) =>
                    setEditPatientForm((current) => ({ ...current, givenName: event.target.value }))
                  }
                  required
                />
                <input
                  placeholder="Apellido"
                  value={editPatientForm.familyName}
                  onChange={(event) =>
                    setEditPatientForm((current) => ({ ...current, familyName: event.target.value }))
                  }
                  required
                />
                <input
                  placeholder="Documento"
                  value={editPatientForm.identifierValue}
                  onChange={(event) =>
                    setEditPatientForm((current) => ({
                      ...current,
                      identifierValue: event.target.value
                    }))
                  }
                  required
                />
                <select
                  value={editPatientForm.gender}
                  onChange={(event) =>
                    setEditPatientForm((current) => ({ ...current, gender: event.target.value }))
                  }
                >
                  <option value="female">female</option>
                  <option value="male">male</option>
                  <option value="other">other</option>
                  <option value="unknown">unknown</option>
                </select>
                <input
                  type="date"
                  value={editPatientForm.birthDate}
                  onChange={(event) =>
                    setEditPatientForm((current) => ({ ...current, birthDate: event.target.value }))
                  }
                  required
                />
                <textarea
                  rows={4}
                  placeholder="Resumen medico"
                  value={editPatientForm.medicalSummary}
                  onChange={(event) =>
                    setEditPatientForm((current) => ({
                      ...current,
                      medicalSummary: event.target.value
                    }))
                  }
                  required
                />

                <div className="detail-actions">
                  <button type="submit" className="primary-button" disabled={workspace.isPending}>
                    {workspace.isPending ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={workspace.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Se eliminara el paciente ${getPatientDisplayName(workspace.selectedInsight!.patient)}. Si existe una cuenta portal vinculada, quedara desactivada.`
                      );

                      if (!confirmed) {
                        return;
                      }

                      workspace.submitAction(
                        async () => {
                          await api.deletePatient(token, Number(workspace.selectedInsight?.patient.id));
                        },
                        "Paciente eliminado correctamente.",
                        "No fue posible eliminar el paciente."
                      );
                    }}
                  >
                    {workspace.isPending ? "Procesando..." : "Eliminar paciente"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="empty-state compact-empty">
                Selecciona un paciente para editar o eliminar el recurso.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Registrar nuevo paciente</h3>
            <p>Crea nuevos recursos `Patient` para ampliar la cohorte monitoreada.</p>
          </div>
        </div>
        <form
          className="form-grid"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            workspace.submitAction(
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
              setPatientForm((current) => ({ ...current, identifierValue: event.target.value }))
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
            rows={4}
            placeholder="Resumen medico"
            value={patientForm.medicalSummary}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, medicalSummary: event.target.value }))
            }
            required
          />
          <button type="submit" className="primary-button" disabled={workspace.isPending}>
            {workspace.isPending ? "Guardando..." : "Crear paciente"}
          </button>
        </form>
      </section>

      <section className="glass-card panel-card">
        <div className="section-heading">
          <div>
            <h3>Contexto del paciente activo</h3>
            <p>Resumen rapido del paciente seleccionado para apoyar la edicion.</p>
          </div>
        </div>
        {workspace.selectedInsight ? (
          <div className="profile-block">
            <div>
              <span className="profile-label">Paciente</span>
              <strong>{getPatientDisplayName(workspace.selectedInsight.patient)}</strong>
            </div>
            <div>
              <span className="profile-label">Observaciones</span>
              <strong>{workspace.selectedInsight.observations.length}</strong>
            </div>
            <div>
              <span className="profile-label">Alertas</span>
              <strong>{workspace.selectedInsight.alarmCount}</strong>
            </div>
            <div className="profile-wide">
              <span className="profile-label">Resumen medico</span>
              <strong>{workspace.selectedInsight.patient.medicalSummary || "Sin resumen registrado."}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-state compact-empty">Selecciona un paciente para ver su contexto.</div>
        )}
      </section>
    </section>
  );
}
