"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../components/auth-provider";
import { formatObservationCode, getPatientDisplayName } from "../../../../lib/clinical-insights";
import { api } from "../../../../lib/api";
import { useDoctorWorkspace } from "../../../../lib/use-doctor-workspace";

const initialObservationForm = {
  patientId: "",
  code: "body-temperature",
  value: "",
  unit: "C",
  effectiveDateTime: "",
  status: "final",
  note: ""
};

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function DoctorObservationsPage() {
  const { token, user } = useAuth();
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const [observationForm, setObservationForm] = useState(initialObservationForm);

  if (!token || user?.role !== "doctor_admin") {
    return <section className="glass-card panel-card loading-panel">Validando acceso...</section>;
  }

  const workspace = useDoctorWorkspace(token);
  const filteredObservations = useMemo(
    () =>
      workspace.observations.filter((observation) => {
        if (patientFilter === "all") {
          return true;
        }

        return observation.subject.reference === `Patient/${patientFilter}`;
      }),
    [patientFilter, workspace.observations]
  );
  const selectedObservation =
    filteredObservations.find((observation) => observation.id === selectedObservationId) ??
    filteredObservations[0] ??
    null;
  const selectedObservationSyncKey = selectedObservation
    ? `${selectedObservation.id}:${selectedObservation.effectiveDateTime}`
    : "none";

  useEffect(() => {
    if (!selectedObservation) {
      setObservationForm(initialObservationForm);
      return;
    }

    setObservationForm({
      patientId: selectedObservation.subject.reference.split("/")[1] ?? "",
      code: selectedObservation.code.text,
      value: String(selectedObservation.valueQuantity.value),
      unit: selectedObservation.valueQuantity.unit,
      effectiveDateTime: toDateTimeLocal(selectedObservation.effectiveDateTime),
      status: selectedObservation.status,
      note: selectedObservation.note?.[0]?.text ?? ""
    });
  }, [selectedObservationSyncKey]);

  useEffect(() => {
    if (!filteredObservations.length) {
      if (selectedObservationId !== null) {
        setSelectedObservationId(null);
      }
      return;
    }

    if (
      !selectedObservationId ||
      !filteredObservations.some((observation) => observation.id === selectedObservationId)
    ) {
      setSelectedObservationId(filteredObservations[0].id);
    }
  }, [filteredObservations, selectedObservationId]);

  return (
    <section className="dashboard-grid">
      {workspace.error ? <div className="glass-card form-error-banner">{workspace.error}</div> : null}
      {workspace.feedback ? (
        <div className="glass-card success-banner">{workspace.feedback}</div>
      ) : null}

      <section className="glass-card panel-card wide-panel">
        <div className="section-heading">
          <div>
            <h3>CRUD de observaciones</h3>
            <p>Registro, ajuste y eliminacion de signos vitales sobre recursos `Observation`.</p>
          </div>
          <span className="pill">{filteredObservations.length} observaciones visibles</span>
        </div>

        <div className="management-toolbar">
          <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}>
            <option value="all">Todos los pacientes</option>
            {workspace.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {getPatientDisplayName(patient)}
              </option>
            ))}
          </select>
          <span className="muted-text">
            Filtra por paciente para trabajar el historico sin saturar el dashboard general.
          </span>
        </div>

        <div className="patient-management-grid">
          <div className="patient-roster">
            {filteredObservations.slice(0, 40).map((observation) => (
              <button
                key={observation.id}
                type="button"
                className={
                  observation.id === selectedObservation?.id
                    ? "patient-card patient-card-selected"
                    : "patient-card"
                }
                onClick={() => setSelectedObservationId(observation.id)}
              >
                <div className="patient-card-header">
                  <strong>{formatObservationCode(observation.code.text)}</strong>
                  <span className="pill">{observation.subject.reference}</span>
                </div>
                <div className="patient-card-grid">
                  <div>
                    <span className="profile-label">Valor</span>
                    <strong>
                      {observation.valueQuantity.value} {observation.valueQuantity.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="profile-label">Estado</span>
                    <strong>{observation.status}</strong>
                  </div>
                  <div className="profile-wide">
                    <span className="profile-label">Fecha</span>
                    <strong>{new Date(observation.effectiveDateTime).toLocaleString("es-CL")}</strong>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="detail-card">
            <div className="section-heading">
              <div>
                <h3>{selectedObservation ? "Editar observacion" : "Registrar observacion"}</h3>
                <p>El formulario sirve tanto para crear como para mantener el registro activo.</p>
              </div>
            </div>

            <form
              className="form-grid"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();

                const payload = {
                  patientId: Number(observationForm.patientId),
                  code: observationForm.code,
                  value: Number(observationForm.value),
                  unit: observationForm.unit,
                  effectiveDateTime: new Date(observationForm.effectiveDateTime).toISOString(),
                  status: observationForm.status,
                  note: observationForm.note
                };

                if (selectedObservation) {
                  workspace.submitAction(
                    async () => {
                      await api.updateObservation(token, Number(selectedObservation.id), payload);
                    },
                    "Observacion actualizada correctamente.",
                    "No fue posible actualizar la observacion."
                  );
                  return;
                }

                workspace.submitAction(
                  async () => {
                    await api.createObservation(token, payload);
                    setObservationForm(initialObservationForm);
                  },
                  "Observacion creada correctamente.",
                  "No fue posible crear la observacion."
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
                value={observationForm.effectiveDateTime}
                onChange={(event) =>
                  setObservationForm((current) => ({
                    ...current,
                    effectiveDateTime: event.target.value
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
                rows={3}
                placeholder="Nota clinica"
                value={observationForm.note}
                onChange={(event) =>
                  setObservationForm((current) => ({ ...current, note: event.target.value }))
                }
              />

              <div className="detail-actions">
                <button type="submit" className="primary-button" disabled={workspace.isPending}>
                  {workspace.isPending
                    ? "Procesando..."
                    : selectedObservation
                      ? "Guardar observacion"
                      : "Crear observacion"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSelectedObservationId(null);
                    setObservationForm(initialObservationForm);
                  }}
                >
                  Nueva observacion
                </button>
                {selectedObservation ? (
                  <button
                    type="button"
                    className="danger-button"
                    disabled={workspace.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Se eliminara la observacion ${selectedObservation.id}.`
                      );

                      if (!confirmed) {
                        return;
                      }

                      workspace.submitAction(
                        async () => {
                          await api.deleteObservation(token, Number(selectedObservation.id));
                          setSelectedObservationId(null);
                        },
                        "Observacion eliminada correctamente.",
                        "No fue posible eliminar la observacion."
                      );
                    }}
                  >
                    Eliminar observacion
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
}
