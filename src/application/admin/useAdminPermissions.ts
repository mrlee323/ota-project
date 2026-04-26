import { useQuery } from "@tanstack/react-query";
import type { AdminFeature, FeatureAccess } from "@/domain/admin/permissions";

export function useFeatureAccess(feature: AdminFeature) {
  return useQuery<FeatureAccess>({
    queryKey: ["admin", "permissions", feature],
    queryFn: async () => {
      const res = await fetch(`/api/admin/permissions?feature=${feature}`);
      if (!res.ok) throw new Error("권한 조회 실패");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
