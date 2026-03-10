import { resolve } from "path";

export function getEnvFilePaths(): string[] {
  return [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env")
  ];
}
