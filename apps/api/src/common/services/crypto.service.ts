import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

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

    const [ivPart, tagPart, encryptedPart] = value.split(".");
    if (!ivPart || !tagPart || !encryptedPart) {
      throw new InternalServerErrorException("Encrypted payload has invalid format.");
    }

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
