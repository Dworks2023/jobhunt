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

import { candidates, enrollmentTrend, stats } from "../data";

const kpis = [
  {
    label: "Total Candidates",
    value: stats.total,
    icon: Users,
    delta: "+4 this month",
    tone: "text-primary",
  },
  {
    label: "Active",
    value: stats.active,
    icon: Activity,
    delta: "In program now",
    tone: "text-success",
  },
  {
    label: "Completed",
    value: stats.completed,
    icon: CheckCircle2,
    delta: "Placed or closed",
    tone: "text-info",
  },
  {
    label: "Expiring Soon",
    value: stats.expiring,
    icon: AlarmClock,
    delta: "Under 30 days left",
    tone: "text-warning",
  },
  {
    label: "Credits Remaining",
    value: stats.credits,
    icon: Coins,
    delta: `of ${stats.creditsTotal} issued`,
    tone: "text-primary",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const recent = [...candidates]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 6);

  const attention = candidates
    .filter(
      (candidate) =>
        candidate.status === "Expiring Soon" ||
        candidate.creditsRemaining < 25,
    )
    .slice(0, 4);

  return (
    <Layout
      title="Program Dashboard"
      subtitle="Friday, 21 August 2026 · live snapshot of the job hunt support program"
    >
      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </p>

                  <Icon className={`size-4 ${kpi.tone}`} />
                </div>

                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {kpi.value.toLocaleString()}
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
            <CardTitle>Enrollments over time</CardTitle>
          </CardHeader>

          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrend}>
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
          </CardContent>
        </Card>

        {/* NEEDS ATTENTION */}
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {attention.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/candidates/${candidate.id}`}
                className="block rounded-xl border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {candidate.name}
                  </p>

                  <StatusBadge status={candidate.status} />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {candidate.daysRemaining} days left ·{" "}
                  {candidate.creditsRemaining} credits
                </p>

                <Progress
                  value={
                    (candidate.creditsRemaining /
                      candidate.creditsTotal) *
                    100
                  }
                  className="mt-2 h-1.5"
                />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* RECENT ENROLLMENTS */}
      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent enrollments</CardTitle>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/candidates")}
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
                    Start date
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {recent.map((candidate) => (
                  <tr
                    key={candidate.id}
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
                      {candidate.domain}
                    </td>

                    <td className="px-6 py-3">
                      {candidate.plan}
                    </td>

                    <td className="px-6 py-3 text-muted-foreground">
                      {candidate.startDate}
                    </td>

                    <td className="px-6 py-3">
                      <StatusBadge status={candidate.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
