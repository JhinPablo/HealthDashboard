import { Injectable } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

@Injectable()
export class PasswordService {
  hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derived}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64);
    const original = Buffer.from(hash, "hex");

    if (derived.length !== original.length) {
      return false;
    }

    return timingSafeEqual(derived, original);
  }
}
