import { ConfigService } from "@nestjs/config";
import { CryptoService } from "./crypto.service";

describe("CryptoService", () => {
  const encryptionKey = "UkaxvyRV9PDospgZ1mWM8ne1ZQ1s69aTWpLl9ntxSLc=";
  const configService = {
    get: (key: string) => (key === "ENCRYPTION_KEY" ? encryptionKey : undefined)
  } as ConfigService;
  const service = new CryptoService(configService);

  it("encrypts and decrypts the current AES-GCM format", () => {
    const encrypted = service.encrypt("CC123456");

    expect(encrypted).not.toEqual("CC123456");
    expect(service.decrypt(encrypted)).toBe("CC123456");
  });

  it("decrypts legacy Fernet payloads stored in the Render seed data", () => {
    const legacyToken =
      "gAAAAABpptm1XrzNj3wMcAx8D_AYKTdRoQuV0PvHq-DVSk-YHNH2NLfdVI7I4tf3FbslU5SmesALEFZKfLVPNp8kSYmhypm2Bw==";

    expect(service.decrypt(legacyToken)).toBe("CC123456");
  });

  it("returns plaintext unchanged for non-encrypted legacy values", () => {
    expect(service.decrypt("plain-medical-summary")).toBe("plain-medical-summary");
  });
});
