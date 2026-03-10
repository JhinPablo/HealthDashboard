export function detectClinicalOutlier(
  code: string | null | undefined,
  value: number | null | undefined
): boolean {
  if (!code || typeof value !== "number") {
    return false;
  }

  const normalizedCode = code.toLowerCase();

  if (normalizedCode.includes("temperature")) {
    return value <= 35 || value >= 39;
  }

  if (normalizedCode.includes("heart")) {
    return value <= 40 || value >= 120;
  }

  if (normalizedCode.includes("systolic")) {
    return value <= 80 || value >= 180;
  }

  if (normalizedCode.includes("diastolic")) {
    return value <= 50 || value >= 120;
  }

  if (normalizedCode.includes("spo2") || normalizedCode.includes("oxygen")) {
    return value <= 90 || value > 100;
  }

  return false;
}
