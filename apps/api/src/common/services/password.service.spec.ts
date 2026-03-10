import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes and verifies valid passwords", () => {
    const hash = service.hashPassword("PortalPaciente123!");

    expect(hash).not.toEqual("PortalPaciente123!");
    expect(service.verifyPassword("PortalPaciente123!", hash)).toBe(true);
  });

  it("rejects invalid passwords", () => {
    const hash = service.hashPassword("DoctorAdmin456!");

    expect(service.verifyPassword("WrongPassword!", hash)).toBe(false);
  });
});
