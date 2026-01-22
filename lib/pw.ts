// lib/pw.ts
import crypto from "crypto";

export function hashPw(pw: string) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function verifyPw(pw: string, hash: string) {
  return hashPw(pw) === hash;
}
