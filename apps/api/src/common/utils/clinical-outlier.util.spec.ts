import { detectClinicalOutlier } from "./clinical-outlier.util";

describe("detectClinicalOutlier", () => {
  it("flags critical body temperatures", () => {
    expect(detectClinicalOutlier("temperature", 39.2)).toBe(true);
    expect(detectClinicalOutlier("body-temperature", 37)).toBe(false);
  });

  it("flags critical oxygen saturation values", () => {
    expect(detectClinicalOutlier("spo2", 89)).toBe(true);
    expect(detectClinicalOutlier("spo2", 98)).toBe(false);
  });

  it("flags critical heart rate values from the seeded Render dataset naming", () => {
    expect(detectClinicalOutlier("heart_rate", 123.45)).toBe(true);
    expect(detectClinicalOutlier("heart_rate", 84)).toBe(false);
  });
});
