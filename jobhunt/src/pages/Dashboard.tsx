
import {
  Activity,
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  Users,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

type UploadedReport = {
  _id?: string;
  type?: string;
  company?: string;
  role?: string;
  reportType?: string;
  fileUrl?: string;
  uploadedAt?: string;
  date?: string;
};

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

  // Interview analytics
 uploadedReports?: UploadedReport[];
};

const DOMAIN_CHART_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#A855F7",
];

/*
========================================
DISTRIBUTION CHART COLORS
========================================
*/

const STATUS_CHART_COLORS: Record<string, string> = {
  Active: "#10B981",
  Completed: "#3B82F6",
  "Expiring Soon": "#F59E0B",
  Paused: "#EF4444",
};

const PLAN_CHART_COLORS: Record<string, string> = {
  Basic: "#3B82F6",
  Standard: "#8B5CF6",
  Premium: "#10B981",
  "100": "#06B6D4",
  "250": "#3B82F6",
  "500": "#8B5CF6",
  "1000": "#F97316",
};

const DISTRIBUTION_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#A855F7",
  "#14B8A6",
  "#EF4444",
];

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

// TEMPORARY: inspect actual candidate data
console.log(
  "Dashboard candidate API response:",
  data,
);

if (Array.isArray(data)) {
  console.log(
    "First candidate data:",
    data[0],
  );

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
        Number(candidate.daysRemaining ?? 0) < 30,
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
        Number(candidate.creditsRemaining ?? 0),
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
          a.createdAt || a.startDate || 0,
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.startDate || 0,
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
          candidate.status === "Expiring Soon" ||
          Number(candidate.daysRemaining ?? 999) < 30;

        const hasLowCredits =
          Number(candidate.creditsRemaining ?? 999) < 25;

        return isExpiring || hasLowCredits;
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
    const monthlyData: Record<string, number> = {};

    // Show the last 6 months, including months
    // with zero enrollments.
    const now = new Date();

    const months: {
      key: string;
      month: string;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      const month = date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        },
      );

      months.push({ key, month });
      monthlyData[key] = 0;
    }

    // Count candidates by their enrollment start date.
    candidates.forEach((candidate) => {
      if (!candidate.startDate) {
        return;
      }

      const date = new Date(candidate.startDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      // Count only enrollments in the displayed period.
      if (key in monthlyData) {
        monthlyData[key] += 1;
      }
    });

    return months.map(({ key, month }) => ({
      month,
      enrollments: monthlyData[key],
    }));
  }, [candidates]);

  /*
  ========================================
  INTERVIEW CALLS BY DOMAIN

  Groups interview calls by candidate domain.

  Uses individual interview records when
  available. Otherwise uses interviewCalls.

  IMPORTANT:
  These fields must be returned by the
  backend for actual data to appear.
  ========================================
  */

  
const interviewDomainData = useMemo(() => {
  const domainTotals: Record<string, number> = {};

  candidates.forEach((candidate) => {
    const domain = candidate.domain?.trim();

    if (!domain) {
      return;
    }

    // Read existing Candidate Details uploads.
    const uploadedReports = Array.isArray(
      candidate.uploadedReports,
    )
      ? candidate.uploadedReports
      : [];

    // Count only interview call uploads,
    // not regular reports.
    const interviewCalls = uploadedReports.filter(
      (report) =>
        report.type?.trim().toLowerCase() ===
        "interview call",
    );

    const interviewCount = interviewCalls.length;

    // Normalize domain casing to combine
    // candidates in the same domain.
    const existingDomain = Object.keys(
      domainTotals,
    ).find(
      (key) =>
        key.toLowerCase() === domain.toLowerCase(),
    );

    const finalDomain = existingDomain || domain;

    domainTotals[finalDomain] =
      (domainTotals[finalDomain] || 0) +
      interviewCount;
  });

  return Object.entries(domainTotals)
    .map(([domain, calls]) => ({
      domain,
      calls,
    }))
    .sort((a, b) => b.calls - a.calls);
}, [candidates]);

  /*
  ========================================
  CANDIDATE DISTRIBUTION CHARTS
  ========================================
  */

  const candidatesByStatus = useMemo(() => {
    const totals: Record<string, number> = {};

    candidates.forEach((candidate) => {
      const status = candidate.status?.trim() || "Active";

      totals[status] = (totals[status] || 0) + 1;
    });

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [candidates]);

  const candidatesByDomain = useMemo(() => {
    const totals: Record<string, number> = {};

    candidates.forEach((candidate) => {
      const rawDomain = candidate.domain?.trim();

      if (!rawDomain) {
        return;
      }

      const existingDomain = Object.keys(totals).find(
        (domain) =>
          domain.toLowerCase() === rawDomain.toLowerCase(),
      );

      const domain = existingDomain || rawDomain;

      totals[domain] = (totals[domain] || 0) + 1;
    });

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [candidates]);

  const candidatesByPlan = useMemo(() => {
    const totals: Record<string, number> = {};

    candidates.forEach((candidate) => {
      const plan = candidate.plan?.trim() || "Unassigned";

      totals[plan] = (totals[plan] || 0) + 1;
    });

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [candidates]);

  function getDistributionColor(
    name: string,
    index: number,
    type: "status" | "plan" | "domain",
  ) {
    if (type === "status") {
      return (
        STATUS_CHART_COLORS[name] ||
        DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]
      );
    }

    if (type === "plan") {
      return (
        PLAN_CHART_COLORS[name] ||
        DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]
      );
    }

    return DISTRIBUTION_COLORS[
      index % DISTRIBUTION_COLORS.length
    ];
  }

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

  /*
  ========================================
  DASHBOARD UI
  ========================================
  */

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

      {/* ENROLLMENT CHART + NEEDS ATTENTION */}

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
              
<ResponsiveContainer width="100%" height="100%">
  <AreaChart
    data={enrollmentTrend}
    margin={{
      top: 15,
      right: 15,
      left: 0,
      bottom: 5,
    }}
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
      interval={0}
    />

    <YAxis
      allowDecimals={false}
      domain={[0, "auto"]}
      stroke="var(--color-muted-foreground)"
      fontSize={12}
      tickLine={false}
      axisLine={false}
    />

    <Tooltip
      contentStyle={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        fontSize: 12,
      }}
      formatter={(value) => [
        `${value} enrollments`,
        "Total",
      ]}
    />

    <Area
      type="monotone"
      dataKey="enrollments"
      stroke="var(--color-primary)"
      strokeWidth={2.5}
      fill="url(#enrollmentGradient)"
      dot={{
        r: 4,
        fill: "var(--color-primary)",
        strokeWidth: 2,
      }}
      activeDot={{
        r: 6,
      }}
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
              attention.map((candidate) => (
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
                    {candidate.daysRemaining ?? 0}{" "}
                    days left ·{" "}
                    {candidate.creditsRemaining ?? 0}{" "}
                    credits
                  </p>

                  <Progress
                    value={
                      candidate.creditsTotal
                        ? (Number(
                            candidate.creditsRemaining ?? 0,
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
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No candidates need attention right now.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =======================================
          INTERVIEW CALLS BY DOMAIN
          NEW FULL-WIDTH GRAPH
          Placed below enrollment/attention
          and above Recent enrollments
      ======================================= */}

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>
              Interview Calls by Domain
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Total interview calls received by candidates
              in each domain
            </p>
          </div>
        </CardHeader>

        <CardContent className="h-[340px]">
          {interviewDomainData.some(
            (item) => item.calls > 0,
          ) ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={interviewDomainData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="domain"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={65}
                />

                <YAxis
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Interview Calls",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "var(--color-muted-foreground)",
                      fontSize: 12,
                    },
                  }}
                />

                <Tooltip
                  cursor={{
                    fill: "var(--color-muted)",
                    opacity: 0.2,
                  }}
                  contentStyle={{
                    background:
                      "var(--color-background)",
                    border:
                      "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `${value} interview calls`,
                    "Total",
                  ]}
                  labelFormatter={(label) =>
                    `Domain: ${label}`
                  }
                />

                <Bar
                  dataKey="calls"
                  name="Interview Calls"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={60}
                  label={{
                    position: "top",
                    fill: "var(--color-foreground)",
                    fontSize: 12,
                  }}
                >
                  {interviewDomainData.map(
                    (entry, index) => (
                      <Cell
                        key={entry.domain}
                        fill={
                          DOMAIN_CHART_COLORS[
                            index %
                              DOMAIN_CHART_COLORS.length
                          ]
                        }
                      />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                No interview call data available.
              </p>

              <p className="text-xs text-muted-foreground text-center">
                Interview records will appear here once
                they are available for your candidates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* =======================================
          CANDIDATE DISTRIBUTION
          STATUS + DOMAIN + PLAN
      ======================================= */}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* CANDIDATES BY STATUS */}
        <Card className="!border-0 !shadow-none !outline-none !ring-0" style={{ border: "0", boxShadow: "none", outline: "none" }}>
          <CardHeader>
            <CardTitle>
              Candidates by status
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[270px]">
            {candidatesByStatus.length > 0 ? (
              <div
                className="h-full w-full border-0 outline-none ring-0"
                style={{ border: "0", outline: "none", boxShadow: "none" }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                <PieChart>
                  <Pie
                    data={candidatesByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="43%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {candidatesByStatus.map(
                      (item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={getDistributionColor(
                            item.name,
                            index,
                            "status",
                          )}
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background:
                        "var(--color-background)",
                      border: "none",
                      boxShadow: "none",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      `${value} candidates`,
                      "Total",
                    ]}
                  />
                </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No status data available.
                </p>
              </div>
            )}

            <div className="-mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm">
              {candidatesByStatus.map(
                (item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          getDistributionColor(
                            item.name,
                            index,
                            "status",
                          ),
                      }}
                    />
                    <span className="text-muted-foreground">
                      {item.name}-
                    </span>
                    <span className="font-bold">
                      {item.value}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* CANDIDATES BY DOMAIN */}
        <Card className="!border-0 !shadow-none !outline-none !ring-0" style={{ border: "0", boxShadow: "none", outline: "none" }}>
          <CardHeader>
            <CardTitle>
              Candidates by domain
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[270px]">
            {candidatesByDomain.length > 0 ? (
              <div
                className="h-full w-full border-0 outline-none ring-0"
                style={{ border: "0", outline: "none", boxShadow: "none" }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                <BarChart
                  data={candidatesByDomain}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 5,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    vertical={false}
                    stroke="transparent"
                  />

                  <XAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fill: "var(--color-muted-foreground)" }}
                  />

                  <YAxis
                    type="number"
                    allowDecimals={false}
                    domain={[0, "auto"]}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />

                  <Tooltip
                    cursor={{
                      fill: "var(--color-muted)",
                      opacity: 0.2,
                    }}
                    contentStyle={{
                      background:
                        "var(--color-background)",
                      border: "none",
                      boxShadow: "none",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      `${value} candidates`,
                      "Total",
                    ]}
                  />

                  <Bar
                    dataKey="value"
                    name="Candidates"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={42}
                    label={{
                      position: "top",
                      fill: "var(--color-foreground)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {candidatesByDomain.map(
                      (item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={getDistributionColor(
                            item.name,
                            index,
                            "domain",
                          )}
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No domain data available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CANDIDATES BY PLAN */}
        <Card className="!border-0 !shadow-none !outline-none !ring-0" style={{ border: "0", boxShadow: "none", outline: "none" }}>
          <CardHeader>
            <CardTitle>
              Candidates by plan
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[270px]">
            {candidatesByPlan.length > 0 ? (
              <div
                className="h-full w-full border-0 outline-none ring-0"
                style={{ border: "0", outline: "none", boxShadow: "none" }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                <PieChart>
                  <Pie
                    data={candidatesByPlan}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="43%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {candidatesByPlan.map(
                      (item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={getDistributionColor(
                            item.name,
                            index,
                            "plan",
                          )}
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background:
                        "var(--color-background)",
                      border: "none",
                      boxShadow: "none",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      `${value} candidates`,
                      "Total",
                    ]}
                  />
                </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No plan data available.
                </p>
              </div>
            )}

            <div className="-mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm">
              {candidatesByPlan.map(
                (item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          getDistributionColor(
                            item.name,
                            index,
                            "plan",
                          ),
                      }}
                    />
                    <span className="text-muted-foreground">
                      {item.name}-
                    </span>
                    <span className="font-bold">
                      {item.value}
                    </span>
                  </div>
                ),
              )}
            </div>
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
                {recent.map((candidate) => (
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
                      {candidate.domain || "-"}
                    </td>

                    <td className="px-6 py-3">
                      {candidate.plan || "-"}
                    </td>

                    <td className="px-6 py-3 text-muted-foreground">
                      {candidate.startDate || "-"}
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
                ))}

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