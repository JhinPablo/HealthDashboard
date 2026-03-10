export function detectClinicalOutlier(code: string, value: number): boolean {
  const normalizedCode = code.toLowerCase();

  if (normalizedCode.includes("temperature")) {
    return value < 30 || value > 45;
  }

  if (normalizedCode.includes("heart")) {
    return value < 30 || value > 220;
  }

  if (normalizedCode.includes("systolic")) {
    return value < 60 || value > 250;
  }

  if (normalizedCode.includes("diastolic")) {
    return value < 30 || value > 160;
  }

  if (normalizedCode.includes("spo2") || normalizedCode.includes("oxygen")) {
    return value < 60 || value > 100;
  }

  return false;
}
