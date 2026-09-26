import {
  Activity,
  BarChart3,
  CheckCircle2,
  Coins,
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

import Layout from "../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/UI";

import {
  byDomain,
  byPlan,
  byStatus,
  creditUsage,
  enrollmentTrend,
  stats,
} from "../data";

export default function Analytics() {
  return (
    <Layout
      title="Analytics"
      subtitle="Program performance, candidate distribution and credit usage"
    >
      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total Candidates"
          value={stats.total}
          icon={<Users />}
        />

        <Metric
          label="Active Candidates"
          value={stats.active}
          icon={<Activity />}
        />

        <Metric
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 />}
        />

        <Metric
          label="Credits Remaining"
          value={stats.credits}
          icon={<Coins />}
        />
      </div>

      {/* TOP CHARTS */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* ENROLLMENT TREND */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment trend</CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={enrollmentTrend}>
                <defs>
                  <linearGradient
                    id="analyticsEnrollment"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "var(--popover)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="enrollments"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#analyticsEnrollment)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CREDIT USAGE */}
        <Card>
          <CardHeader>
            <CardTitle>Credit usage</CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={creditUsage}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "var(--popover)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="issued"
                  name="Issued"
                  fill="var(--muted-foreground)"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="used"
                  name="Used"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* DISTRIBUTION */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* PLAN */}
        <DistributionCard
          title="Candidates by plan"
          data={byPlan}
        />

        {/* DOMAIN */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates by domain</CardTitle>
          </CardHeader>

          <CardContent className="h-[330px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={byDomain}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 10,
                }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                />

                <XAxis
                  type="number"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "var(--popover)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="var(--primary)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* STATUS */}
        <DistributionCard
          title="Candidates by status"
          data={byStatus}
        />
      </div>
    </Layout>
  );
}

/* -----------------------------
   Metric card
----------------------------- */

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {label}
          </p>

          <span className="size-4 text-primary [&_svg]:size-4">
            {icon}
          </span>
        </div>

        <p className="mt-3 text-3xl font-semibold tracking-tight">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

/* -----------------------------
   Distribution card
----------------------------- */

function DistributionCard({
  title,
  data,
}: {
  title: string;
  data: {
    name: string;
    value: number;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="h-[330px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={105}
              innerRadius={55}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell
                  key={`${item.name}-${index}`}
                  fill={
                    index % 2 === 0
                      ? "var(--primary)"
                      : "var(--muted-foreground)"
                  }
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background:
                  "var(--popover)",
                border:
                  "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="-mt-5 grid grid-cols-2 gap-2 text-xs">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate text-muted-foreground">
                {item.name}
              </span>

              <span className="font-medium">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}