import {
  Activity,
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  Coins,
  Users,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Layout from "../components/Layout";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  StatusBadge,
} from "../components/UI";

import { getCandidates } from "../api/candidate";

type Candidate = {
  _id?: string;
  id: string;

  name: string;
  email?: string;

  domain?: string;
  plan?: string;

  startDate?: string;
  status?: string;

  creditsTotal?: number;
  creditsRemaining?: number;

  daysRemaining?: number;

  createdAt?: string | Date;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ========================================
  LOAD CANDIDATES FROM BACKEND
  ========================================
  */

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCandidates();

        if (Array.isArray(data)) {
          setCandidates(data);
        } else {
          console.error(
            "Unexpected candidates response:",
            data,
          );

          setCandidates([]);
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error,
        );

        setError(
          "Failed to load dashboard data. Please check that the backend server is running.",
        );

        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /*
  ========================================
  DASHBOARD STATISTICS
  ========================================
  */

  const dashboardStats = useMemo(() => {
    const total = candidates.length;

    const active = candidates.filter(
      (candidate) =>
        candidate.status === "Active",
    ).length;

    const completed = candidates.filter(
      (candidate) =>
        candidate.status === "Completed",
    ).length;

    const expiring = candidates.filter(
      (candidate) =>
        candidate.status === "Expiring Soon" ||
        Number(candidate.daysRemaining ?? 0) <
          30,
    ).length;

    const creditsTotal = candidates.reduce(
      (totalCredits, candidate) =>
        totalCredits +
        Number(candidate.creditsTotal ?? 0),
      0,
    );

    const creditsRemaining = candidates.reduce(
      (totalCredits, candidate) =>
        totalCredits +
        Number(
          candidate.creditsRemaining ?? 0,
        ),
      0,
    );

    return {
      total,
      active,
      completed,
      expiring,
      creditsTotal,
      creditsRemaining,
    };
  }, [candidates]);

  /*
  ========================================
  KPI CARDS
  ========================================
  */

  const kpis = [
    {
      label: "Total Candidates",
      value: dashboardStats.total,
      icon: Users,
      delta: "Registered candidates",
      tone: "text-primary",
    },
    {
      label: "Active",
      value: dashboardStats.active,
      icon: Activity,
      delta: "In program now",
      tone: "text-success",
    },
    {
      label: "Completed",
      value: dashboardStats.completed,
      icon: CheckCircle2,
      delta: "Placed or closed",
      tone: "text-info",
    },
    {
      label: "Expiring Soon",
      value: dashboardStats.expiring,
      icon: AlarmClock,
      delta: "Under 30 days left",
      tone: "text-warning",
    },
    
  ];

  /*
  ========================================
  RECENT ENROLLMENTS

  Sort by createdAt first.
  Falls back to startDate.
  ========================================
  */

  const recent = useMemo(() => {
    return [...candidates]
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt ||
            a.startDate ||
            0,
        ).getTime();

        const dateB = new Date(
          b.createdAt ||
            b.startDate ||
            0,
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [candidates]);

  /*
  ========================================
  NEEDS ATTENTION
  ========================================
  */

  const attention = useMemo(() => {
    return candidates
      .filter((candidate) => {
        const isExpiring =
          candidate.status ===
            "Expiring Soon" ||
          Number(
            candidate.daysRemaining ?? 999,
          ) < 30;

        const hasLowCredits =
          Number(
            candidate.creditsRemaining ?? 999,
          ) < 25;

        return (
          isExpiring ||
          hasLowCredits
        );
      })
      .slice(0, 4);
  }, [candidates]);

  /*
  ========================================
  REAL ENROLLMENT CHART

  Groups candidates by month using startDate.
  ========================================
  */

  const enrollmentTrend = useMemo(() => {
    const monthlyData: Record<
      string,
      number
    > = {};

    candidates.forEach((candidate) => {
      if (!candidate.startDate) {
        return;
      }

      const date = new Date(
        candidate.startDate,
      );

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const month = date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        },
      );

      monthlyData[month] =
        (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .map(([month, enrollments]) => ({
        month,
        enrollments,
      }))
      .sort((a, b) => {
        const dateA = new Date(
          `1 ${a.month}`,
        ).getTime();

        const dateB = new Date(
          `1 ${b.month}`,
        ).getTime();

        return dateA - dateB;
      });
  }, [candidates]);

  /*
  ========================================
  LOADING STATE
  ========================================
  */

  if (loading) {
    return (
      <Layout
        title="Program Dashboard"
        subtitle="Loading dashboard data..."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading dashboard...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Program Dashboard"
      subtitle="Live snapshot of the job hunt support program"
    >
      {/* ERROR MESSAGE */}

      {error && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </p>

                  <Icon
                    className={`size-4 ${kpi.tone}`}
                  />
                </div>

                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {Number(
                    kpi.value,
                  ).toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {kpi.delta}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CHART + ATTENTION */}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* ENROLLMENT CHART */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Enrollments over time
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[280px]">
            {enrollmentTrend.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={enrollmentTrend}
                >
                  <defs>
                    <linearGradient
                      id="enrollmentGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.35}
                      />

                      <stop
                        offset="100%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                  />

                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "var(--color-background)",
                      border:
                        "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="enrollments"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#enrollmentGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No enrollment data available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NEEDS ATTENTION */}

        <Card>
          <CardHeader>
            <CardTitle>
              Needs attention
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {attention.length > 0 ? (
              attention.map(
                (candidate) => (
                  <Link
                    key={
                      candidate._id ||
                      candidate.id
                    }
                    to={`/candidates/${candidate.id}`}
                    className="block rounded-xl border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {candidate.name}
                      </p>

                      <StatusBadge
                        status={
                          candidate.status ||
                          "Active"
                        }
                      />
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidate.daysRemaining ??
                        0}{" "}
                      days left ·{" "}
                      {candidate.creditsRemaining ??
                        0}{" "}
                      credits
                    </p>

                    <Progress
                      value={
                        candidate.creditsTotal
                          ? (Number(
                              candidate.creditsRemaining ??
                                0,
                            ) /
                              Number(
                                candidate.creditsTotal,
                              )) *
                            100
                          : 0
                      }
                      className="mt-2 h-1.5"
                    />
                  </Link>
                ),
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                No candidates need attention right
                now.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT ENROLLMENTS */}

      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            Recent enrollments
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate("/candidates")
            }
          >
            View all

            <ArrowRight className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">
                    Candidate
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Domain
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Plan
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Start Date
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {recent.map(
                  (candidate) => (
                    <tr
                      key={
                        candidate._id ||
                        candidate.id
                      }
                      className="border-b last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-6 py-3">
                        <Link
                          to={`/candidates/${candidate.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {candidate.name}
                        </Link>

                        <p className="text-xs text-muted-foreground">
                          {candidate.id}
                        </p>
                      </td>

                      <td className="px-6 py-3 text-muted-foreground">
                        {candidate.domain ||
                          "-"}
                      </td>

                      <td className="px-6 py-3">
                        {candidate.plan ||
                          "-"}
                      </td>

                      <td className="px-6 py-3 text-muted-foreground">
                        {candidate.startDate ||
                          "-"}
                      </td>

                      <td className="px-6 py-3">
                        <StatusBadge
                          status={
                            candidate.status ||
                            "Active"
                          }
                        />
                      </td>
                    </tr>
                  ),
                )}

                {recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-muted-foreground"
                    >
                      No candidates available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}