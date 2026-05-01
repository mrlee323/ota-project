"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import type { ShowcaseContent } from "@/domain/admin/showcaseContent";
import {
  getShowcaseLifecycleStatus,
  isShowcaseExpired,
  isShowcaseActive,
  isShowcaseScheduled,
} from "@/domain/admin/showcaseContent";
import { showcaseService } from "@/infrastructure/admin/showcaseServiceClient";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { AutoConfigPanel } from "./AutoConfigPanel";

// ─── ShowcaseListView 컴포넌트 ──────────────────────────────────────────────

/** 쇼케이스 컨텐츠 목록 뷰 */
export function ShowcaseListView() {
  const queryClient = useQueryClient();

  const {
    data: showcaseList,
    isLoading,
    isError,
  } = useQuery<ShowcaseContent[]>({
    queryKey: ["showcase", "list"],
    queryFn: () => showcaseService.getShowcaseList(),
  });

  // serviceEnabled 토글 뮤테이션 (낙관적 업데이트)
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      showcaseService.toggleServiceEnabled(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["showcase", "list"] });
      const previous = queryClient.getQueryData<ShowcaseContent[]>(["showcase", "list"]);
      if (previous) {
        queryClient.setQueryData<ShowcaseContent[]>(
          ["showcase", "list"],
          previous.map((item) =>
            item.id === id ? { ...item, serviceEnabled: enabled } : item,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // 실패 시 이전 데이터로 롤백
      if (context?.previous) {
        queryClient.setQueryData(["showcase", "list"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase", "list"] });
    },
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            쇼케이스 목록을 불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Card>
        <CardContent>
          <p className="text-center text-red-500 py-8">
            목록을 불러오는 데 실패했습니다. 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">쇼케이스 관리</h1>
          <p className="text-sm text-gray-500">
            쇼케이스는 언제든 수정할 수 있고, 노출 시점은 기간 설정으로 제어합니다.
          </p>
        </div>
        <Link href="/admin/content/showcase/new">
          <Button variant="primary">쇼케이스 생성</Button>
        </Link>
      </div>

      {/* 자동 생성 설정 패널 */}
      <AutoConfigPanel />

      {/* 노출 상태 요약 */}
      {showcaseList && showcaseList.length > 0 && (() => {
        const now = new Date();
        const activeItems = showcaseList
          .filter((item) => isShowcaseActive(item, now))
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const upcomingItems = showcaseList
          .filter((item) => isShowcaseScheduled(item, now))
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        if (activeItems.length === 0 && upcomingItems.length === 0) return null;

        const summaryCard = (
          title: string,
          color: "green" | "yellow",
          items: ShowcaseContent[],
          emptyText: string,
        ) => {
          const accent = color === "green" ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50";
          return (
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className={`text-xs font-medium ${color === "green" ? "text-green-600" : "text-yellow-600"}`}>
                    {title} ({items.length})
                  </p>
                </div>
                {items.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {items.map((item) => (
                      <Link key={`${title}-${item.id}`} href={`/admin/content/showcase/${item.id}/edit`}>
                        <div className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors hover:opacity-90 ${accent}`}>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-900">{item.cityName}</span>
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="text-sm text-gray-600 truncate">{item.title}</span>
                          </div>
                          <span className="ml-3 shrink-0 text-xs text-gray-500">
                            {format(new Date(item.startDate), "MM.dd")} ~ {format(new Date(item.endDate), "MM.dd")}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{emptyText}</p>
                )}
              </CardContent>
            </Card>
          );
        };

        return (
          <div className="grid grid-cols-1 gap-4">
            {summaryCard("현재 오픈 중", "green", activeItems, "현재 오픈 중인 쇼케이스가 없습니다.")}
            {summaryCard("다음 오픈 예정", "yellow", upcomingItems, "다음 오픈 예정 쇼케이스가 없습니다.")}
          </div>
        );
      })()}

      {/* 컨텐츠 목록 테이블 */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">도시명</th>
                <th className="px-6 py-3 font-medium">타이틀</th>
                <th className="px-6 py-3 font-medium">상태</th>
                <th className="px-6 py-3 font-medium">서비스</th>
                <th className="px-6 py-3 font-medium">노출 기간</th>
                <th className="px-6 py-3 font-medium">생성일</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {showcaseList?.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    {item.id.split("-")[0]}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{item.cityName}</td>
                  <td className="px-6 py-4 text-gray-900">{item.title}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const status = getShowcaseLifecycleStatus(item);
                      const labelMap: Record<typeof status, string> = {
                        active: "오픈 중",
                        scheduled: "예약됨",
                        expired: "만료",
                        inactive: "비활성",
                      };
                      const classMap: Record<typeof status, string> = {
                        active: "bg-green-100 text-green-700",
                        scheduled: "bg-yellow-100 text-yellow-700",
                        expired: "bg-red-100 text-red-700",
                        inactive: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classMap[status]}`}>
                          {labelMap[status]}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.serviceEnabled}
                      onClick={() =>
                        toggleMutation.mutate({
                          id: item.id,
                          enabled: !item.serviceEnabled,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        item.serviceEnabled ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          item.serviceEnabled
                            ? "translate-x-4"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {format(new Date(item.startDate), "yyyy.MM.dd")} ~{" "}
                    {format(new Date(item.endDate), "yyyy.MM.dd")}
                    {isShowcaseExpired(item) && (
                      <span className="ml-2 text-xs text-red-500 font-medium">
                        기간 만료
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(item.createdAt), "yyyy.MM.dd")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/content/showcase/${item.id}/edit`}>
                      <Button variant="outline" size="sm">
                        편집
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
