"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  classifyObservationSeverity,
  getPatientDisplayName
} from "./clinical-insights";
import {
  buildMetricInsights,
  buildMetricTrend,
  buildOperationalHighlights,
  buildPatientInsights
} from "./doctor-dashboard-insights";
import { api, ApiError } from "./api";
import {
  AdminDashboardData,
  ApiKeySummary,
  ObservationResource,
  PatientResource,
  UserSummary
} from "./types";

function matchesPatientSearch(
  patient: PatientResource,
  linkedUser: UserSummary | undefined,
  query: string
): boolean {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const searchableValues = [
    patient.id,
    getPatientDisplayName(patient),
    patient.identifier[0]?.value ?? "",
    patient.gender,
    patient.birthDate,
    linkedUser?.email ?? "",
    linkedUser?.fullName ?? ""
  ];

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function useDoctorWorkspace(token: string) {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [patients, setPatients] = useState<PatientResource[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [observations, setObservations] = useState<ObservationResource[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const [selectedTrendObservationId, setSelectedTrendObservationId] = useState<string | null>(
    null
  );
  const [patientSearch, setPatientSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadAllObservations = async () => {
    const pageSize = 100;
    let offset = 0;
    const resources: ObservationResource[] = [];

    while (true) {
      const response = await api.getObservations(token, undefined, pageSize, offset);
      resources.push(...response.entry.map((entry) => entry.resource));

      if (resources.length >= response.total || response.entry.length === 0) {
        break;
      }

      offset += response.entry.length;
    }

    return resources;
  };

  const loadData = async () => {
    const [
      dashboardResponse,
      patientsResponse,
      usersResponse,
      apiKeysResponse,
      observationResources
    ] = await Promise.all([
      api.getDoctorDashboard(token),
      api.getPatients(token, 100, 0),
      api.getUsers(token),
      api.getApiKeys(token),
      loadAllObservations()
    ]);

    const patientResources = patientsResponse.entry.map((entry) => entry.resource);
    const patientInsights = buildPatientInsights(patientResources, observationResources);
    const metricInsights = buildMetricInsights(observationResources, patientResources);

    setError(null);
    setDashboard(dashboardResponse);
    setPatients(patientResources);
    setUsers(usersResponse);
    setApiKeys(apiKeysResponse);
    setObservations(observationResources);
    setSelectedPatientId((current) => {
      if (current && patientResources.some((patient) => patient.id === current)) {
        return current;
      }

      return patientInsights[0]?.patient.id ?? null;
    });
    setSelectedMetricKey((current) => {
      if (current && metricInsights.some((metric) => metric.key === current)) {
        return current;
      }

      return metricInsights[0]?.key ?? null;
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

  const patientUsersByPatientId = useMemo(
    () =>
      new Map(
        users
          .filter((user) => user.patientId != null)
          .map((user) => [String(user.patientId), user] as const)
      ),
    [users]
  );
  const patientInsights = useMemo(
    () => buildPatientInsights(patients, observations),
    [patients, observations]
  );
  const filteredPatientInsights = useMemo(
    () =>
      patientInsights.filter((insight) =>
        matchesPatientSearch(
          insight.patient,
          patientUsersByPatientId.get(insight.patient.id),
          patientSearch
        )
      ),
    [patientInsights, patientUsersByPatientId, patientSearch]
  );
  const metricInsights = useMemo(
    () => buildMetricInsights(observations, patients),
    [observations, patients]
  );
  const operationalHighlights = useMemo(
    () =>
      buildOperationalHighlights(patientInsights, metricInsights, observations, patients),
    [patientInsights, metricInsights, observations, patients]
  );
  const selectedInsight =
    filteredPatientInsights.find((insight) => insight.patient.id === selectedPatientId) ??
    filteredPatientInsights[0] ??
    null;
  const selectedPatientAlerts =
    selectedInsight?.observations.filter(
      (observation) => classifyObservationSeverity(observation) !== "normal"
    ) ?? [];
  const selectedPatientUser = selectedInsight
    ? patientUsersByPatientId.get(selectedInsight.patient.id)
    : undefined;
  const selectedPatientRecentObservations = selectedInsight?.observations.slice(0, 8) ?? [];
  const highlightedPatients = filteredPatientInsights.slice(0, 8).map((insight) => ({
    id: insight.patient.id,
    label: getPatientDisplayName(insight.patient),
    observations: insight.observations.length,
    alarms: insight.alarmCount,
    criticalOutliers: insight.criticalOutlierCount,
    isSelected: insight.patient.id === selectedInsight?.patient.id
  }));
  const selectedMetric =
    metricInsights.find((metric) => metric.key === selectedMetricKey) ??
    metricInsights[0] ??
    null;
  const metricTrend = selectedMetric
    ? buildMetricTrend(observations, patients, selectedMetric.key, 16)
    : [];
  const selectedTrendPoint =
    metricTrend.find((point) => point.id === selectedTrendObservationId) ??
    metricTrend[metricTrend.length - 1] ??
    null;

  useEffect(() => {
    if (!filteredPatientInsights.length) {
      if (selectedPatientId !== null) {
        setSelectedPatientId(null);
      }
      return;
    }

    if (
      !selectedPatientId ||
      !filteredPatientInsights.some((insight) => insight.patient.id === selectedPatientId)
    ) {
      setSelectedPatientId(filteredPatientInsights[0].patient.id);
    }
  }, [filteredPatientInsights, selectedPatientId]);

  useEffect(() => {
    if (!metricInsights.length) {
      if (selectedMetricKey !== null) {
        setSelectedMetricKey(null);
      }
      return;
    }

    if (!selectedMetricKey || !metricInsights.some((metric) => metric.key === selectedMetricKey)) {
      setSelectedMetricKey(metricInsights[0].key);
    }
  }, [metricInsights, selectedMetricKey]);

  useEffect(() => {
    if (!metricTrend.length) {
      if (selectedTrendObservationId !== null) {
        setSelectedTrendObservationId(null);
      }
      return;
    }

    if (
      !selectedTrendObservationId ||
      !metricTrend.some((observation) => observation.id === selectedTrendObservationId)
    ) {
      setSelectedTrendObservationId(metricTrend[metricTrend.length - 1].id);
    }
  }, [metricTrend, selectedTrendObservationId]);

  return {
    dashboard,
    patients,
    users,
    apiKeys,
    observations,
    patientSearch,
    selectedPatientId,
    selectedMetricKey,
    selectedTrendObservationId,
    feedback,
    error,
    isPending,
    loadData,
    submitAction,
    setPatientSearch,
    setSelectedPatientId,
    setSelectedMetricKey,
    setSelectedTrendObservationId,
    patientUsersByPatientId,
    patientInsights,
    filteredPatientInsights,
    metricInsights,
    operationalHighlights,
    selectedInsight,
    selectedPatientAlerts,
    selectedPatientUser,
    selectedPatientRecentObservations,
    highlightedPatients,
    selectedMetric,
    metricTrend,
    selectedTrendPoint
  };
}
