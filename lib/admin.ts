// lib/admin.ts
export function isAdminKey(key?: string | null) {
  const input = (key ?? "").trim();
  const env = (process.env.ADMIN_KEY ?? "").trim();
  if (!input || !env) return false;
  return input === env;
}
