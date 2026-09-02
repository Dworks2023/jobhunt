import {
  ArrowLeft,
  Calendar,
  Coins,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Plus,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

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

import { getCandidate } from "../data";

const tabs = [
  "overview",
  "progress",
  "reports",
  "feedback",
  "activity",
] as const;

type Tab = (typeof tabs)[number];

export default function CandidateDetails() {
  const { candidateId } = useParams();

  const candidate = getCandidate(candidateId || "");

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [progressOpen, setProgressOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (!candidate) {
    return (
      <Layout
        title="Candidate unavailable"
        subtitle="The requested candidate could not be found"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold">
              Candidate not found
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              This candidate does not exist in the current dataset.
            </p>

            <Button asChild className="mt-5">
              <Link to="/candidates">
                <ArrowLeft className="size-4" />
                Back to Candidates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const c = candidate;

  const totals = c.monthly.reduce(
    (total, month) => ({
      applications:
        total.applications + month.applications,

      interviews:
        total.interviews + month.interviews,

      offers:
        total.offers + month.offers,
    }),
    {
      applications: 0,
      interviews: 0,
      offers: 0,
    },
  );

  const creditsUsed =
    ((c.creditsTotal - c.creditsRemaining) /
      c.creditsTotal) *
    100;

  function saveProgress() {
    setProgressOpen(false);
    alert("Monthly progress saved successfully (demo)");
  }

  function addFeedback() {
    if (!feedback.trim()) {
      alert("Please enter feedback first.");
      return;
    }

    alert("Feedback added successfully (demo)");
    setFeedback("");
  }

  function logReport() {
    alert("Report logged successfully (demo)");
  }

  return (
    <Layout
      title={c.name}
      subtitle={`${c.id} · ${c.targetRole} · owned by ${c.owner}`}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/candidates">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>

          <Button
            onClick={() => setProgressOpen(true)}
          >
            <Plus className="size-4" />
            Update Monthly Progress
          </Button>
        </>
      }
    >
      {/* PROGRESS MODAL */}
      {progressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              Update monthly progress
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Log this month's activity for {c.name}.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <FormInput
                label="Applications"
                type="number"
                defaultValue="24"
              />

              <FormInput
                label="Interviews"
                type="number"
                defaultValue="4"
              />

              <FormInput
                label="Offers"
                type="number"
                defaultValue="0"
              />
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">
                Summary note
              </label>

              <textarea
                rows={3}
                placeholder="What moved this month?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setProgressOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={saveProgress}>
                Save progress
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* LEFT PROFILE */}
        <Card className="h-fit">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                {c.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </div>

              <div>
                <p className="text-lg font-semibold">
                  {c.name}
                </p>

                <div className="mt-1">
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </div>

            {/* CONTACT / PROGRAM INFO */}
            <div className="mt-6 space-y-3 text-sm">
              <InfoRow
                icon={<Mail />}
                value={c.email}
              />

              <InfoRow
                icon={<Phone />}
                value={c.phone}
              />

              <InfoRow
                icon={<MapPin />}
                value={c.location}
              />

              <InfoRow
                icon={<Target />}
                value={`${c.domain} · ${c.experience}`}
              />

              <InfoRow
                icon={<Calendar />}
                value={`${c.startDate} → ${c.endDate}`}
              />

              <InfoRow
                icon={<Coins />}
                value={`${c.creditsRemaining} of ${c.creditsTotal} credits`}
              />
            </div>

            {/* CREDITS */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Credits used</span>

                <span>
                  {Math.round(creditsUsed)}%
                </span>
              </div>

              <Progress value={creditsUsed} />

              <div className="flex justify-between pt-2 text-xs text-muted-foreground">
                <span>Days remaining</span>

                <span>{c.daysRemaining}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT CONTENT */}
        <div>
          {/* TABS */}
          <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>

            <TabButton
              active={activeTab === "progress"}
              onClick={() => setActiveTab("progress")}
            >
              Monthly Progress
            </TabButton>

            <TabButton
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
            >
              Reports & Interview Calls
            </TabButton>

            <TabButton
              active={activeTab === "feedback"}
              onClick={() => setActiveTab("feedback")}
            >
              Feedback & Improvements
            </TabButton>

            <TabButton
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </TabButton>
          </div>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Applications"
                  value={totals.applications}
                />

                <MetricCard
                  label="Interviews"
                  value={totals.interviews}
                />

                <MetricCard
                  label="Offers"
                  value={totals.offers}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Program summary
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {c.name} joined the{" "}
                    <span className="text-foreground">
                      {c.plan}
                    </span>{" "}
                    plan on {c.startDate}, targeting{" "}
                    <span className="text-foreground">
                      {c.targetRole}
                    </span>{" "}
                    roles in {c.domain}. Support is led by{" "}
                    {c.owner}.
                  </p>

                  <p>
                    {c.monthly.length} months of activity
                    recorded with {totals.interviews} interview
                    calls logged and {c.creditsRemaining} application
                    credits still available.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MONTHLY PROGRESS */}
          {activeTab === "progress" && (
            <div className="mt-5 space-y-4">
              {c.monthly.map((month) => (
                <Card key={month.month}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">
                        {month.month} 2026
                      </p>

                      <div className="flex gap-5 text-sm text-muted-foreground">
                        <span>
                          {month.applications} applications
                        </span>

                        <span>
                          {month.interviews} interviews
                        </span>

                        <span>
                          {month.offers} offers
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={month.progress}
                      className="mt-4"
                    />

                    <p className="mt-3 text-sm text-muted-foreground">
                      {month.note}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* REPORTS */}
          {activeTab === "reports" && (
            <Card className="mt-5">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>
                  Reports & interview calls
                </CardTitle>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={logReport}
                >
                  <Plus className="size-4" />
                  Log entry
                </Button>
              </CardHeader>

              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3 font-medium">
                          Date
                        </th>

                        <th className="px-6 py-3 font-medium">
                          Type
                        </th>

                        <th className="px-6 py-3 font-medium">
                          Detail
                        </th>

                        <th className="px-6 py-3 font-medium">
                          Outcome
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {c.reports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-border/70 last:border-0"
                        >
                          <td className="px-6 py-3 text-muted-foreground">
                            {report.date}
                          </td>

                          <td className="px-6 py-3">
                            <span className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs">
                              {report.type}
                            </span>
                          </td>

                          <td className="px-6 py-3">
                            {report.title}

                            {report.company && (
                              <p className="text-xs text-muted-foreground">
                                {report.company}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-3 text-muted-foreground">
                            {report.outcome}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FEEDBACK */}
          {activeTab === "feedback" && (
            <div className="mt-5 space-y-4">
              <Card>
                <CardContent className="flex flex-wrap items-end gap-3 p-5">
                  <div className="min-w-[220px] flex-1 space-y-2">
                    <label className="text-sm font-medium">
                      Add feedback / improvement
                    </label>

                    <textarea
                      value={feedback}
                      onChange={(event) =>
                        setFeedback(event.target.value)
                      }
                      rows={2}
                      placeholder="What should the candidate improve next?"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <Button onClick={addFeedback}>
                    <MessageSquarePlus className="size-4" />
                    Add
                  </Button>
                </CardContent>
              </Card>

              {c.feedback.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {item.area}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.author} · {item.date}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.note}
                    </p>

                    <p className="mt-3 text-sm">
                      <span className="text-muted-foreground">
                        Action:{" "}
                      </span>

                      {item.action}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === "activity" && (
            <Card className="mt-5">
              <CardContent className="p-6">
                <ol className="relative space-y-6 border-l border-border pl-6">
                  {c.activity.map((item) => (
                    <li key={item.id}>
                      <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />

                      <p className="text-sm">
                        {item.text}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.date}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* --------------------------------
   Small reusable components
-------------------------------- */

function InfoRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 size-4 shrink-0 text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>

      <span className="text-foreground/90">
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <p className="mt-2 text-3xl font-semibold">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FormInput({
  label,
  type,
  defaultValue,
}: {
  label: string;
  type: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        defaultValue={defaultValue}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}