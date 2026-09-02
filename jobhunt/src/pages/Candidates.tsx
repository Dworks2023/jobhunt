import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import {
  Button,
  Card,
  CardContent,
  StatusBadge,
} from "../components/UI";

import { candidates, domains, plans } from "../data";

const statuses = [
  "Active",
  "Completed",
  "Expiring Soon",
  "Paused",
] as const;

type Status = (typeof statuses)[number];

export default function Candidates() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("all");
  const [domain, setDomain] = useState("all");
  const [status, setStatus] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Stores status changes made from the dropdown.
  // This is frontend-only for now.
  const [candidateStatuses, setCandidateStatuses] = useState<
    Record<string, Status>
  >(
    Object.fromEntries(
      candidates.map((candidate) => [
        candidate.id,
        candidate.status,
      ]),
    ),
  );

  const rows = useMemo(() => {
    return candidates.filter((candidate) => {
      const search = query.trim().toLowerCase();

      const currentStatus =
        candidateStatuses[candidate.id] ?? candidate.status;

      const matchesSearch =
        !search ||
        [
          candidate.name,
          candidate.email,
          candidate.id,
          candidate.targetRole,
        ].some((value) =>
          value.toLowerCase().includes(search),
        );

      const matchesPlan =
        plan === "all" || candidate.plan === plan;

      const matchesDomain =
        domain === "all" || candidate.domain === domain;

      const matchesStatus =
        status === "all" || currentStatus === status;

      return (
        matchesSearch &&
        matchesPlan &&
        matchesDomain &&
        matchesStatus
      );
    });
  }, [query, plan, domain, status, candidateStatuses]);

  function resetFilters() {
    setQuery("");
    setPlan("all");
    setDomain("all");
    setStatus("all");
  }

  function exportCandidates() {
    alert("Export queued successfully (demo)");
  }

  function changeStatus(
    candidateId: string,
    newStatus: Status,
  ) {
    setCandidateStatuses((current) => ({
      ...current,
      [candidateId]: newStatus,
    }));
  }

  function getStatusClass(currentStatus: Status) {
    switch (currentStatus) {
      case "Active":
        return "border-green-200 bg-green-50 text-green-700";

      case "Completed":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "Expiring Soon":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";

      case "Paused":
        return "border-gray-200 bg-gray-50 text-gray-700";

      default:
        return "border-input bg-background text-foreground";
    }
  }

  return (
    <Layout
      title="Candidates"
      subtitle={`${rows.length} of ${candidates.length} candidates shown`}
      actions={
        <>
          <Button
            variant="outline"
            onClick={exportCandidates}
          >
            <Download className="size-4" />
            Export
          </Button>

          <Button asChild>
            <Link to="/add-candidate">
              <UserPlus className="size-4" />
              Add Candidate
            </Link>
          </Button>
        </>
      }
    >
      {/* FILTERS */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search by name, email, ID or target role"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* PLAN */}
            <select
              value={plan}
              onChange={(event) =>
                setPlan(event.target.value)
              }
              className="h-9 w-[150px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All plans</option>

              {plans.map((item) => (
                <option
                  key={item.id}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>

            {/* DOMAIN */}
            <select
              value={domain}
              onChange={(event) =>
                setDomain(event.target.value)
              }
              className="h-9 w-[190px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All domains</option>

              {domains.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            {/* STATUS FILTER */}
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="h-9 w-[160px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All statuses</option>

              {statuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            {/* RESET */}
            <Button
              variant="ghost"
              onClick={resetFilters}
            >
              <Filter className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CANDIDATES TABLE */}
      <Card className="mt-5">
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">
                    ID
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Candidate
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Domain
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Plan
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Exp.
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Start
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Days left
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Credits
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((candidate) => {
                  const currentStatus =
                    candidateStatuses[candidate.id] ??
                    candidate.status;

                  return (
                    <tr
                      key={candidate.id}
                      className="border-b border-border/70 last:border-0 hover:bg-accent/40"
                    >
                      {/* ID */}
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {candidate.id}
                      </td>

                      {/* CANDIDATE */}
                      <td className="px-5 py-3">
                        <Link
                          to={`/candidates/${candidate.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {candidate.name}
                        </Link>

                        <p className="text-xs text-muted-foreground">
                          {candidate.email}
                        </p>
                      </td>

                      {/* DOMAIN */}
                      <td className="px-5 py-3 text-muted-foreground">
                        {candidate.domain}
                      </td>

                      {/* PLAN */}
                      <td className="px-5 py-3">
                        {candidate.plan}
                      </td>

                      {/* EXPERIENCE */}
                      <td className="px-5 py-3 text-muted-foreground">
                        {candidate.experience}
                      </td>

                      {/* START DATE */}
                      <td className="px-5 py-3 text-muted-foreground">
                        {candidate.startDate}
                      </td>

                      {/* DAYS LEFT */}
                      <td className="px-5 py-3">
                        <span
                          className={
                            candidate.daysRemaining === 0
                              ? "text-muted-foreground"
                              : candidate.daysRemaining < 30
                                ? "font-medium text-warning"
                                : ""
                          }
                        >
                          {candidate.daysRemaining}
                        </span>
                      </td>

                      {/* CREDITS */}
                      <td className="px-5 py-3">
                        {candidate.creditsRemaining}

                        <span className="text-muted-foreground">
                          {" "}
                          / {candidate.creditsTotal}
                        </span>
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td className="px-5 py-3">
                        <select
                          value={currentStatus}
                          onChange={(event) =>
                            changeStatus(
                              candidate.id,
                              event.target.value as Status,
                            )
                          }
                          className={`h-8 min-w-[135px] cursor-pointer rounded-full border px-3 pr-7 text-xs font-medium outline-none transition-colors focus:ring-1 focus:ring-ring ${getStatusClass(
                            currentStatus,
                          )}`}
                          aria-label={`Change status for ${candidate.name}`}
                        >
                          {statuses.map((item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-3">
                        <div className="relative flex justify-end gap-1">
                          {/* VIEW */}
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link
                              to={`/candidates/${candidate.id}`}
                              aria-label={`View ${candidate.name}`}
                            >
                              <Eye className="size-4" />
                            </Link>
                          </Button>

                          {/* MORE */}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="More actions"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === candidate.id
                                  ? null
                                  : candidate.id,
                              )
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>

                          {/* ACTION MENU */}
                          {openMenu === candidate.id && (
                            <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-border bg-background p-1 shadow-lg">
                              <ActionItem
                                onClick={() => {
                                  alert(
                                    `Progress update opened for ${candidate.name}`,
                                  );
                                  setOpenMenu(null);
                                }}
                              >
                                Update monthly progress
                              </ActionItem>

                              <ActionItem
                                onClick={() => {
                                  alert(
                                    "Interview call logged (demo)",
                                  );
                                  setOpenMenu(null);
                                }}
                              >
                                Log interview call
                              </ActionItem>

                              <ActionItem
                                onClick={() => {
                                  alert(
                                    "Credits added (demo)",
                                  );
                                  setOpenMenu(null);
                                }}
                              >
                                Add credits
                              </ActionItem>

                              <ActionItem
                                onClick={() => {
                                  changeStatus(
                                    candidate.id,
                                    "Paused",
                                  );

                                  setOpenMenu(null);
                                }}
                              >
                                Pause program
                              </ActionItem>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* EMPTY STATE */}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-14 text-center text-muted-foreground"
                    >
                      No candidates match these filters.
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

function ActionItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
    >
      {children}
    </button>
  );
}