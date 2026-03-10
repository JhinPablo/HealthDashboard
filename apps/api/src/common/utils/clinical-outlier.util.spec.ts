import { detectClinicalOutlier } from "./clinical-outlier.util";

describe("detectClinicalOutlier", () => {
  it("flags impossible body temperatures", () => {
    expect(detectClinicalOutlier("body-temperature", 46)).toBe(true);
    expect(detectClinicalOutlier("body-temperature", 37)).toBe(false);
  });

  it("flags impossible oxygen saturation values", () => {
    expect(detectClinicalOutlier("spo2", 55)).toBe(true);
    expect(detectClinicalOutlier("spo2", 98)).toBe(false);
  });
});
