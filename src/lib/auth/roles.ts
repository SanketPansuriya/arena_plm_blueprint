export const appRoles = ["admin", "engineer", "approver", "supplier"] as const;

export type AppRole = (typeof appRoles)[number];

export function normalizeAppRole(value: unknown): AppRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  return appRoles.includes(normalizedValue as AppRole)
    ? (normalizedValue as AppRole)
    : null;
}

export function formatRoleLabel(role: AppRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function hasRoleAccess(
  role: AppRole,
  allowedRoles?: readonly AppRole[],
) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles.includes(role);
}
