"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { formatRoleLabel, hasRoleAccess, type AppRole } from "@/lib/auth/roles";

type NavItem = {
  label: string;
  href?: string;
  upcoming?: boolean;
  allowedRoles?: AppRole[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type AppShellUser = {
  fullName: string;
  email: string;
  role: AppRole;
  organizationName: string;
};

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    title: "Product data",
    items: [
      { label: "Products", href: "/products", allowedRoles: ["admin", "engineer", "approver"] },
      { label: "Parts", href: "/parts", allowedRoles: ["admin", "engineer", "approver"] },
      { label: "BOMs", upcoming: true, allowedRoles: ["admin", "engineer", "approver"] },
      { label: "Documents", upcoming: true, allowedRoles: ["admin", "engineer", "approver", "supplier"] },
      { label: "CAD files", upcoming: true, allowedRoles: ["admin", "engineer", "supplier"] },
    ],
  },
  {
    title: "Execution",
    items: [
      { label: "Changes", upcoming: true, allowedRoles: ["admin", "engineer", "approver"] },
      { label: "Quality", upcoming: true, allowedRoles: ["admin", "engineer", "approver"] },
      { label: "Compliance", upcoming: true, allowedRoles: ["admin", "engineer", "approver"] },
      { label: "Suppliers", upcoming: true, allowedRoles: ["admin", "engineer", "supplier"] },
      { label: "Projects", upcoming: true, allowedRoles: ["admin", "engineer", "approver"] },
    ],
  },
  {
    title: "Administration",
    items: [{ label: "Admin", upcoming: true, allowedRoles: ["admin"] }],
  },
];

export function AppShell({
  children,
  headerAction,
  user,
}: Readonly<{
  children: ReactNode;
  headerAction?: ReactNode;
  user: AppShellUser;
}>) {
  const pathname = usePathname();
  const initials = user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-[#f2efe6] text-slate-950">
      <header className="border-b border-slate-900/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
              NextGen PLM
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Product lifecycle workspace
            </p>
          </div>

          <div className="hidden min-w-[240px] flex-1 md:flex md:justify-center">
            <div className="w-full max-w-sm rounded-full border border-slate-900/10 bg-[#f7f4ec] px-4 py-2 text-sm text-slate-500">
              Search products, parts, documents
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-slate-900/10 bg-[#f7f4ec] px-3 py-2 text-xs font-medium text-slate-600 sm:block">
              {user.organizationName}
            </div>
            {headerAction ? <div className="hidden sm:block">{headerAction}</div> : null}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.fullName}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {formatRoleLabel(user.role)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
              {initials || "NG"}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-[1.75rem] border border-slate-900/10 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-900/8 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Modules
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Shared navigation for the authenticated product workspace.
            </p>
            <div className="mt-4 rounded-[1.25rem] border border-slate-900/8 bg-[#faf8f2] p-4">
              <p className="text-sm font-medium text-slate-800">{user.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
                {user.organizationName}
              </p>
            </div>
          </div>

          <nav className="mt-5 space-y-5">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) =>
                hasRoleAccess(user.role, item.allowedRoles),
              );

              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {group.title}
                  </p>
                  <div className="mt-3 space-y-2">
                    {visibleItems.map((item) => {
                      const isActive = item.href ? pathname === item.href : false;

                      if (!item.href) {
                        return (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-2xl border border-slate-900/8 bg-[#faf8f2] px-4 py-3 text-sm text-slate-700"
                          >
                            <span>{item.label}</span>
                            {item.upcoming ? (
                              <span className="rounded-full bg-slate-900/6 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Soon
                              </span>
                            ) : null}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.label}
                          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isActive
                              ? "bg-slate-950 text-white"
                              : "border border-slate-900/8 bg-[#faf8f2] text-slate-700 hover:bg-white"
                          }`}
                          href={item.href}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isActive ? "bg-emerald-300" : "bg-slate-300"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
