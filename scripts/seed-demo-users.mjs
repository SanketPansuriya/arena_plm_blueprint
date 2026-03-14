import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, "utf8");

  for (const line of fileContents.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_USER_PASSWORD || "ChangeMe123!";
const organizationId = "11111111-1111-1111-1111-111111111111";

const demoUsers = [
  {
    email: "admin@nextgenplm.local",
    full_name: "Alex Morgan",
    role: "admin",
    organization_name: "Acme Medical Devices",
    organization_id: organizationId,
    job_title: "PLM Administrator",
    timezone: "America/Chicago",
  },
  {
    email: "engineer@nextgenplm.local",
    full_name: "Priya Shah",
    role: "engineer",
    organization_name: "Acme Medical Devices",
    organization_id: organizationId,
    job_title: "Product Engineer",
    timezone: "America/Los_Angeles",
  },
  {
    email: "approver@nextgenplm.local",
    full_name: "Daniel Reed",
    role: "approver",
    organization_name: "Acme Medical Devices",
    organization_id: organizationId,
    job_title: "Quality Manager",
    timezone: "America/New_York",
  },
];

const missingVariables = [
  !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
  !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
].filter(Boolean);

if (missingVariables.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingVariables.join(", ")}. Demo user seeding cannot continue.`,
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureDemoOrganization() {
  const { error } = await supabase.from("organizations").upsert(
    {
      id: organizationId,
      name: "Acme Medical Devices",
      slug: "acme-medical-devices",
      industry: "Medical devices",
      primary_site_name: "Austin Manufacturing",
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(
      `Demo organization sync failed: ${error.message}`,
    );
  }
}

async function ensureAuthUser(user) {
  const { data: listedUsers, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  const existingUser = listedUsers.users.find(
    (listedUser) => listedUser.email === user.email,
  );

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      role: user.role,
      organization_name: user.organization_name,
      organization_id: user.organization_id,
      job_title: user.job_title,
      timezone: user.timezone,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function upsertProfile(userId, user) {
  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      organization_id: organizationId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      job_title: user.job_title,
      is_active: true,
      timezone: user.timezone,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(
      `public.users sync failed for ${user.email}: ${error.message}`,
    );
  }
}

async function main() {
  await ensureDemoOrganization();

  for (const user of demoUsers) {
    const authUser = await ensureAuthUser(user);
    await upsertProfile(authUser.id, user);
    console.log(`Seeded demo user: ${user.email}`);
  }
}

main().catch((error) => {
  console.error("Demo user seed failed.");
  console.error(error);
  process.exit(1);
});
