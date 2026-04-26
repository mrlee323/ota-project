"use client";

import { LayoutDashboard, FileText, LogOut } from "lucide-react";
import { logoutAction } from "@/application/auth/actions";
import type { AdminFeature } from "@/domain/admin/permissions";

interface AdminSidebarProps {
  permissions: Array<{ feature: AdminFeature; canRead: boolean; canWrite: boolean }>;
  userEmail: string;
}

export function AdminSidebar({ permissions, userEmail }: AdminSidebarProps) {
  const hasShowcase = permissions.some((p) => p.feature === "showcase" && p.canRead);

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Admin
        </p>
        <p className="mt-1 truncate text-sm text-gray-600">{userEmail}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <a
          href="/admin"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <LayoutDashboard size={16} />
          대시보드
        </a>

        {hasShowcase && (
          <a
            href="/admin/content/showcase"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText size={16} />
            쇼케이스 관리
          </a>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
