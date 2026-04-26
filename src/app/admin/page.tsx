import { createClient } from "@/infrastructure/supabase/server";
import { getAllPermissions } from "@/infrastructure/admin/permissionsApi";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/ui/components/Card";

const FEATURE_LABELS: Record<string, string> = {
  showcase: "쇼케이스",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const permissions = await getAllPermissions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {permissions.map((p) => (
          <Card key={p.feature}>
            <CardContent>
              <p className="font-semibold text-gray-800">
                {FEATURE_LABELS[p.feature] ?? p.feature}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                읽기: {p.canRead ? "허용" : "제한"} · 쓰기:{" "}
                {p.canWrite ? "허용" : "제한"}
              </p>
              {p.canRead && (
                <a
                  href={`/admin/content/${p.feature}`}
                  className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
                >
                  관리 페이지로 →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
