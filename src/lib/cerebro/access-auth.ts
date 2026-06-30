import "server-only";

import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

export type CerebroRole = "admin" | "editor" | "viewer";

const iterations = 120000;
const keyLength = 32;
const digest = "sha256";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function sessionSecret() {
  return (
    text(process.env.CEREBRO_SESSION_SECRET) ||
    text(process.env.CEREBRO_ACCESS_PASSWORD) ||
    "troque-este-segredo-do-cerebro"
  );
}

export function isCerebroAuthEnabled() {
  return text(process.env.CEREBRO_AUTH_ENABLED).toLowerCase() !== "false";
}

export function alwaysRequireLogin() {
  return text(process.env.CEREBRO_ALWAYS_REQUIRE_LOGIN).toLowerCase() === "true";
}

export function envAdminEmails() {
  const emails = [
    ...text(process.env.CEREBRO_ALLOWED_EMAILS).split(","),
    text(process.env.CEREBRO_ADMIN_EMAIL),
  ];

  return emails.map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const parts = String(stored || "").split("$");

  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const parsedIterations = Number(parts[1]);
  const salt = parts[2];
  const expectedHash = parts[3];

  const actual = Buffer.from(
    pbkdf2Sync(password, salt, parsedIterations, keyLength, digest).toString("hex"),
    "hex",
  );

  const expected = Buffer.from(expectedHash, "hex");

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

function sign(raw: string) {
  return createHmac("sha256", sessionSecret()).update(raw).digest("base64url");
}

export function signCerebroSession(payload: {
  email: string;
  name?: string;
  role: CerebroRole;
}) {
  const body = {
    email: payload.email.toLowerCase(),
    name: payload.name || "",
    role: payload.role,
    exp: Date.now() + 1000 * 60 * 60 * 8,
  };

  const raw = Buffer.from(JSON.stringify(body)).toString("base64url");

  return `${raw}.${sign(raw)}`;
}

function parseCookie(header: string, name: string) {
  return header
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function readCerebroSession(request: Request) {
  const token = parseCookie(request.headers.get("cookie") || "", "cerebro_session");

  if (!token) return null;

  const [raw, signature] = token.split(".");

  if (!raw || !signature || sign(raw) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      email: string;
      name?: string;
      role: CerebroRole;
      exp: number;
    };

    if (!payload.exp || payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export function cerebroCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `cerebro_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 8}${secure}`;
}

export function clearCerebroCookie() {
  return "cerebro_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}
