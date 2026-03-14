import { createClient } from "@/lib/supabase/server";
import { type AppRole, normalizeAppRole } from "@/lib/auth/roles";

export type AppUserProfile = {
  fullName: string;
  email: string;
  role: AppRole;
  organizationName: string;
};

type AuthenticatedAppAccess =
  | { status: "unauthenticated" }
  | { status: "unauthorized" }
  | { status: "authorized"; user: AppUserProfile };

function getInitialFullName(email: string, fallback?: string) {
  if (fallback && fallback.trim().length > 0) {
    return fallback;
  }

  const localPart = email.split("@")[0] ?? "User";
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getAuthenticatedAppContext(): Promise<AuthenticatedAppAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const metadataRole = normalizeAppRole(user.user_metadata.role);

  if (!metadataRole) {
    return { status: "unauthorized" };
  }

  const fallbackProfile: AppUserProfile = {
    fullName: getInitialFullName(
      user.email ?? "user@nextgenplm.local",
      typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : undefined,
    ),
    email: user.email ?? "user@nextgenplm.local",
    role: metadataRole,
    organizationName: "NextGen PLM Workspace",
  };

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("full_name, email, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "authorized", user: fallbackProfile };
  }

  const profileRole = normalizeAppRole(profile.role);

  if (!profileRole) {
    return { status: "unauthorized" };
  }

  let organizationName = fallbackProfile.organizationName;

  if (profile.organization_id) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (organization?.name) {
      organizationName = organization.name;
    }
  }

  return {
    status: "authorized",
    user: {
      fullName: profile.full_name || fallbackProfile.fullName,
      email: profile.email || fallbackProfile.email,
      role: profileRole,
      organizationName,
    },
  };
}
