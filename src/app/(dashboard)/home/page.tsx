"use client";

import { Skeleton } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getApplicationOverviewApi, verifiedScoreApi } from "@/services/api/student";

type Overview = {
  ddl?: string;
  totalValue?: number;
  passValue?: number;
  underReviewValue?: number;
  rejectedValue?: number;
  totalScore?: number;
};

export default function HomePage() {
  const [overview, setOverview] = useState<Overview>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getApplicationOverviewApi();
        setOverview({
          ddl: res?.data?.ddl,
          totalValue: res?.data?.totalValue ?? 0,
          passValue: res?.data?.passValue ?? 0,
          underReviewValue: res?.data?.underReviewValue ?? 0,
          rejectedValue: res?.data?.rejectedValue ?? 0,
          totalScore: res?.data?.totalScore ?? 0,
        });
      } catch {
        setError("首页数据加载失败");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const deadlineText = useMemo(() => {
    if (!overview.ddl) return "暂未获取截止日期";
    const [year, month, day] = overview.ddl.split("-");
    return `填报截止日期为 ${year} 年 ${month} 月 ${day} 日`;
  }, [overview.ddl]);

  const cards = [
    { label: "当前总分", value: overview.totalScore ?? 0, color: "text-cyan-600" },
    { label: "填报总数", value: overview.totalValue ?? 0, color: "text-sky-600" },
    { label: "已审核", value: overview.passValue ?? 0, color: "text-emerald-600" },
    { label: "审核中", value: overview.underReviewValue ?? 0, color: "text-amber-600" },
    { label: "已驳回", value: overview.rejectedValue ?? 0, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        {loading ? (
          <Skeleton active title paragraph={{ rows: 2 }} />
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            欢迎使用武汉理工大学信息工程学院学生综合测评管理系统。{deadlineText}
          </p>
        )}
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-white p-5 shadow-sm">
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              </div>
            ))
          : cards.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className={`mt-3 text-3xl font-semibold ${item.color}`}>{item.value}</div>
              </div>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 text-base font-semibold">个人综测概览</div>
          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <div className="grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
              ECharts 迁移位
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {loading ? (
              <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : (
              <>
                <div className="text-base font-semibold">当前总分</div>
                <div className="mt-4 text-4xl font-bold text-cyan-600">{overview.totalScore ?? 0}</div>
              </>
            )}
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {loading ? (
              <Skeleton active title={false} paragraph={{ rows: 4 }} />
            ) : (
              <>
                <div className="text-base font-semibold">审核状态概览</div>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div>填报总数：{overview.totalValue ?? 0}</div>
                  <div>已审核：{overview.passValue ?? 0}</div>
                  <div>审核中：{overview.underReviewValue ?? 0}</div>
                  <div>已驳回：{overview.rejectedValue ?? 0}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
