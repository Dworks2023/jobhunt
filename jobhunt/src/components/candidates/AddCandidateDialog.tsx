import {
  Activity,
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  Coins,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
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

import {
  candidates,
  domains,
  enrollmentTrend,
  plans,
  stats,
  team,
} from "../data";

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

  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState("Growth");
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const [selectedOwner, setSelectedOwner] = useState(team[0]?.name || "");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    targetRole: "",
    experience: "0-2 yrs",
    startDate: new Date().toISOString().split("T")[0],
  });

  const selectedPlanData = plans.find(
    (plan) => plan.name === selectedPlan,
  );

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

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleAddCandidate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    console.log("New Candidate:", {
      ...formData,
      domain: selectedDomain,
      plan: selectedPlan,
      owner: selectedOwner,
      creditsTotal: selectedPlanData?.credits || 0,
      creditsRemaining: selectedPlanData?.credits || 0,
      status: "Active",
    });

    alert("Candidate added successfully! Backend integration is next.");

    setShowAddCandidate(false);

    setFormData({
      name: "",
      email: "",
      phone: "",
      location: "",
      targetRole: "",
      experience: "0-2 yrs",
      startDate: new Date().toISOString().split("T")[0],
    });
  }

  function handleImport(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    console.log("Selected file:", file);

    alert(
      `Selected file: ${file.name}\n\nExcel backend import will be connected next.`,
    );

    setShowImport(false);
  }

  return (
    <>
      <Layout
        title="Program Dashboard"
        subtitle="Friday, 21 August 2026 · live snapshot of the job hunt support program"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowImport(true)}
            >
              <Upload className="size-4" />
              Import Excel
            </Button>

            <Button
              onClick={() => setShowAddCandidate(true)}
            >
              <UserPlus className="size-4" />
              Add Candidate
            </Button>
          </>
        }
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

                    <Icon
                      className={`size-4 ${kpi.tone}`}
                    />
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
              <CardTitle>
                Enrollments over time
              </CardTitle>
            </CardHeader>

            <CardContent className="h-[280px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
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

                    <StatusBadge
                      status={candidate.status}
                    />
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
                        <StatusBadge
                          status={candidate.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Layout>

      {/* ========================================= */}
      {/* ADD CANDIDATE MODAL */}
      {/* ========================================= */}

      {showAddCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Add Candidate
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enroll a new candidate into the Job Hunt program.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddCandidate(false)
                }
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleAddCandidate}
                className="space-y-5"
              >
                {/* PERSONAL DETAILS */}

                <div>
                  <h3 className="mb-3 font-medium">
                    Candidate Details
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />

                    <FormInput
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />

                    <FormInput
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />

                    <FormInput
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />

                    <FormInput
                      label="Target Role"
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={handleInputChange}
                    />

                    <FormInput
                      label="Start Date"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* PROGRAM DETAILS */}

                <div>
                  <h3 className="mb-3 font-medium">
                    Program Details
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Domain"
                      value={selectedDomain}
                      onChange={setSelectedDomain}
                      options={domains}
                    />

                    <SelectField
                      label="Experience"
                      value={formData.experience}
                      onChange={(value) =>
                        setFormData((previous) => ({
                          ...previous,
                          experience: value,
                        }))
                      }
                      options={[
                        "0-2 yrs",
                        "3-5 yrs",
                        "6-8 yrs",
                        "9+ yrs",
                      ]}
                    />

                    <SelectField
                      label="Plan"
                      value={selectedPlan}
                      onChange={setSelectedPlan}
                      options={plans.map(
                        (plan) => plan.name,
                      )}
                    />

                    <SelectField
                      label="Assigned Specialist"
                      value={selectedOwner}
                      onChange={setSelectedOwner}
                      options={team.map(
                        (member) => member.name,
                      )}
                    />
                  </div>
                </div>

                {/* PLAN SUMMARY */}

                <div className="rounded-xl border bg-muted/30 p-4">
                  <h3 className="font-medium">
                    Plan Summary
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Plan
                      </p>

                      <p className="font-medium">
                        {selectedPlan}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Duration
                      </p>

                      <p className="font-medium">
                        {selectedPlanData?.durationMonths} months
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Credits
                      </p>

                      <p className="font-medium">
                        {selectedPlanData?.credits}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Fee
                      </p>

                      <p className="font-medium">
                        ${selectedPlanData?.price}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setShowAddCandidate(false)
                    }
                  >
                    Cancel
                  </Button>

                  <Button type="submit">
                    <UserPlus className="size-4" />
                    Add Candidate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================= */}
      {/* IMPORT EXCEL MODAL */}
      {/* ========================================= */}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Import Candidates
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Upload an Excel or CSV file.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowImport(false)
                }
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Upload className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 font-medium">
                  Upload Candidate File
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv
                </p>

                <label className="mt-5 inline-flex cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    Choose File
                  </span>

                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleImport}
                  />
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setShowImport(false)
                  }
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/* ========================================= */
/* REUSABLE FORM COMPONENTS */
/* ========================================= */

function FormInput({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}