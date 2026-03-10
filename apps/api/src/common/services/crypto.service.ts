import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "crypto";

@Injectable()
export class CryptoService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(value: string): string {
    if (!value) {
      return value;
    }

    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv, tag, encrypted].map((buffer) => buffer.toString("base64")).join(".");
  }

  decrypt(value: string): string {
    if (!value) {
      return value;
    }

    const currentFormatParts = value.split(".");
    if (currentFormatParts.length === 3) {
      return this.decryptCurrentFormat(
        currentFormatParts[0],
        currentFormatParts[1],
        currentFormatParts[2]
      );
    }

    if (this.looksLikeLegacyFernetToken(value)) {
      return this.decryptLegacyFernet(value);
    }

    // Allow old plaintext rows to remain readable instead of failing the UI.
    return value;
  }

  private decryptCurrentFormat(
    ivPart: string,
    tagPart: string,
    encryptedPart: string
  ): string {
    const key = this.getKey();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivPart, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64")),
      decipher.final()
    ]).toString("utf8");
  }

  private decryptLegacyFernet(token: string): string {
    const rawToken = this.base64UrlDecode(token);
    if (rawToken.length < 1 + 8 + 16 + 32) {
      throw new InternalServerErrorException("Encrypted payload has invalid format.");
    }

    const version = rawToken[0];
    if (version !== 0x80) {
      throw new InternalServerErrorException("Encrypted payload has invalid format.");
    }

    const rawKey = this.getKey();
    const signingKey = rawKey.subarray(0, 16);
    const encryptionKey = rawKey.subarray(16, 32);
    const hmacStart = rawToken.length - 32;
    const payload = rawToken.subarray(0, hmacStart);
    const signature = rawToken.subarray(hmacStart);
    const expectedSignature = createHmac("sha256", signingKey).update(payload).digest();

    if (!timingSafeEqual(signature, expectedSignature)) {
      throw new InternalServerErrorException("Encrypted payload signature is invalid.");
    }

    const iv = rawToken.subarray(9, 25);
    const ciphertext = rawToken.subarray(25, hmacStart);
    const decipher = createDecipheriv("aes-128-cbc", encryptionKey, iv);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }

  private looksLikeLegacyFernetToken(value: string): boolean {
    return /^gAAAAA[-_A-Za-z0-9=]+$/.test(value);
  }

  private base64UrlDecode(value: string): Buffer {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);

    return Buffer.from(`${normalized}${"=".repeat(paddingLength)}`, "base64");
  }

  private getKey(): Buffer {
    const rawKey = this.configService.get<string>("ENCRYPTION_KEY");
    if (!rawKey) {
      throw new InternalServerErrorException("ENCRYPTION_KEY is not configured.");
    }

    try {
      const maybeBase64 = Buffer.from(rawKey, "base64");
      if (maybeBase64.length === 32) {
        return maybeBase64;
      }
    } catch {
      // Fallback to deterministic hash below.
    }

    return createHash("sha256").update(rawKey).digest();
  }
}
