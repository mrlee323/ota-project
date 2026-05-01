import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { getAllPermissions } from "@/infrastructure/admin/permissionsApi";
import { AdminSidebar } from "@/ui/patterns/admin/AdminSidebar";
import { ToastProvider } from "@/ui/components/Toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const permissions = await getAllPermissions();

  if (permissions.length === 0) redirect("/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar permissions={permissions} userEmail={user.email ?? ""} />
      <main className="flex-1 p-8">
        <ToastProvider>{children}</ToastProvider>
      </main>
    </div>
  );
}
