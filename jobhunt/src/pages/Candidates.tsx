import {
  Edit,
  Eye,
  Filter,
  Search,
  Trash2,
  Upload,
  UserPlus,
  X,
  MoreVertical,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";

import {
  ImportCandidatesDialog,
} from "../components/candidates/ImportCandidatesDialog";

import {
  Button,
  Card,
  CardContent,
} from "../components/UI";

import {
  createCandidate,
  deleteCandidate,
  getCandidates,

  updateCandidate,
} from "../api/candidate";

import {
  domains,
  plans,
} from "../data";

import type {
  Candidate,
  Status,
} from "../data";


/* ============================================= */
/* TYPES */
/* ============================================= */

const statuses = [
  "Active",
  "Completed",
  "Expiring Soon",
  "Paused",
] as const;

type Status =
  (typeof statuses)[number];


type Candidate = {
  _id?: string | {
    toString(): string;
  };

  id: string;

  name: string;
  email: string;

  phone?: string;
  location?: string;

  domain?: string;
  targetRole?: string;
  experience?: string;

  plan?: string;

  programDays?: number;

  assignedSpecialist?: string;

  startDate?: string;

  status?: string;

  notes?: string;

  creditsTotal?: number;
  creditsRemaining?: number;

  daysRemaining?: number;
};


type CandidateForm = {
  name: string;
  email: string;
  phone: string;
  location: string;
  domain: string;
  targetRole: string;
  experience: string;
  plan: string;
  programDays: string;
  assignedSpecialist: string;
  startDate: string;
  status: Status;
  notes: string;
};


/* ============================================= */
/* DEFAULT FORM */
/* ============================================= */

function createEmptyForm(): CandidateForm {
  return {
    name: "",
    email: "",
    phone: "",
    location: "",

    domain:
      domains[0] ?? "",

    targetRole: "",

    experience:
      "0-2 yrs",

    plan:
      plans[0]?.name ??
      "Basic",

     programDays: "45", 

    assignedSpecialist: "",

    startDate:
      new Date()
        .toISOString()
        .split("T")[0],

    status:
      "Active",

    notes: "",
  };
}


/* ============================================= */
/* COMPONENT */
/* ============================================= */

export default function Candidates() {

  /* ============================================= */
  /* FILTERS */
  /* ============================================= */

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    plan,
    setPlan,
  ] =
    useState("all");

  const [
    domain,
    setDomain,
  ] =
    useState("all");

  const [
    status,
    setStatus,
  ] =
    useState("all");


  /* ============================================= */
  /* BACKEND DATA */
  /* ============================================= */

  const [
    localCandidates,
    setLocalCandidates,
  ] =
    useState<Candidate[]>([]);

  const [
    loadingCandidates,
    setLoadingCandidates,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");


    const [
  candidateStatuses,
  setCandidateStatuses,
] =
  useState<Record<string, Status>>({});


  /* ============================================= */
  /* MODALS */
  /* ============================================= */

  const [
    showAddModal,
    setShowAddModal,
  ] =
    useState(false);

  const [
    showEditModal,
    setShowEditModal,
  ] =
    useState(false);

  const [
    showImportModal,
    setShowImportModal,
  ] =
    useState(false);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] =
    useState(false);


   // Three-dot actions menu
const [
  openActionMenu,
  setOpenActionMenu,
] = useState<string | null>(null); 


  /* ============================================= */
  /* SELECTED CANDIDATE */
  /* ============================================= */

  const [
    selectedCandidate,
    setSelectedCandidate,
  ] =
    useState<Candidate | null>(
      null,
    );


  /* ============================================= */
  /* LOADING ACTIONS */
  /* ============================================= */

  const [
    updatingStatus,
    setUpdatingStatus,
  ] =
    useState<string | null>(
      null,
    );

  const [
    savingCandidate,
    setSavingCandidate,
  ] =
    useState(false);

  const [
    deletingCandidate,
    setDeletingCandidate,
  ] =
    useState(false);


  /* ============================================= */
  /* IMPORT FILE */
  /* ============================================= */

  


  /* ============================================= */
  /* ADD FORM */
  /* ============================================= */

  const [
    formData,
    setFormData,
  ] =
    useState<CandidateForm>(
      createEmptyForm(),
    );


  /* ============================================= */
  /* EDIT FORM */
  /* ============================================= */

  const [
    editForm,
    setEditForm,
  ] =
    useState<CandidateForm>(
      createEmptyForm(),
    );


  /* ============================================= */
  /* LOAD CANDIDATES */
  /* ============================================= */

 async function loadCandidates() {
  try {
    setLoadingCandidates(true);

    setError("");

    const data = await getCandidates();

    // Safety check: API must return an array
    if (!Array.isArray(data)) {
      console.error(
        "Candidates API did not return an array:",
        data,
      );

      setLocalCandidates([]);

      setCandidateStatuses({});

      return;
    }

    // Store candidates
    setLocalCandidates(data);

    // Create status map for all candidates
    const statusMap = Object.fromEntries(
      data.map((candidate: Candidate) => [
        candidate.id,
        candidate.status,
      ]),
    ) as Record<string, Status>;

    // Store candidate statuses
    setCandidateStatuses(statusMap);
  } catch (error) {
    console.error(
      "Failed to load candidates:",
      error,
    );

    // Clear invalid/old data if loading fails
    setLocalCandidates([]);

    setCandidateStatuses({});

    setError(
      error instanceof Error
        ? error.message
        : "Failed to load candidates",
    );
  } finally {
    setLoadingCandidates(false);
  }
}

  /* ============================================= */
  /* LOAD ON PAGE OPEN */
  /* ============================================= */

  useEffect(() => {

    loadCandidates();

  }, []);


  /* ============================================= */
  /* FILTERED CANDIDATES */
  /* ============================================= */

  const rows =
    useMemo(() => {

      return localCandidates.filter(
        (
          candidate,
        ) => {

          const search =
            query
              .trim()
              .toLowerCase();


          const matchesSearch =
            !search ||
            [
              candidate.name,
              candidate.email,
              candidate.id,
              candidate.targetRole,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(search),
              );


          const matchesPlan =
            plan === "all" ||
            candidate.plan === plan;


          const matchesDomain =
            domain === "all" ||
            candidate.domain === domain;


          const matchesStatus =
            status === "all" ||
            candidate.status === status;


          return (
            matchesSearch &&
            matchesPlan &&
            matchesDomain &&
            matchesStatus
          );

        },
      );

    }, [
      query,
      plan,
      domain,
      status,
      localCandidates,
    ]);


  /* ============================================= */
  /* RESET FILTERS */
  /* ============================================= */

  function resetFilters() {

    setQuery("");

    setPlan("all");

    setDomain("all");

    setStatus("all");

  }


  /* ============================================= */
  /* GET IDENTIFIER */
  /* ============================================= */

  function getCandidateIdentifier(
  candidate:
    | Candidate
    | null
    | undefined,
) {
  if (!candidate) {
    return "";
  }


  if (
    candidate._id &&
    typeof candidate._id ===
      "string"
  ) {
    return candidate._id;
  }


  if (
    candidate._id &&
    typeof candidate._id ===
      "object"
  ) {
    return candidate._id.toString();
  }


  return candidate.id ?? "";
}



/* ============================================= */
/* CALCULATE PROGRAM END DATE */
/* ============================================= */

function getProgramEndDate(
  startDate?: string,
  programDays?: number,
): string {
  if (!startDate || !programDays || programDays < 1) {
    return "-";
  }

  // Parse as local date to avoid timezone shifts
  const [year, month, day] = startDate
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return "-";
  }

  const endDate = new Date(
    year,
    month - 1,
    day,
  );

  // Program Days includes the start date
  endDate.setDate(
    endDate.getDate() + programDays - 1,
  );

  const endYear = endDate.getFullYear();
  const endMonth = String(
    endDate.getMonth() + 1,
  ).padStart(2, "0");
  const endDay = String(
    endDate.getDate(),
  ).padStart(2, "0");

  return `${endYear}-${endMonth}-${endDay}`;
}


  /* ============================================= */
  /* STATUS COLOR */
  /* ============================================= */

  function getStatusClass(
    currentStatus: string,
  ) {

    switch (currentStatus) {

      case "Active":

        return "border-green-200 bg-green-50 text-green-700";


      case "Completed":

        return "border-blue-200 bg-blue-50 text-blue-700";


      case "Expiring Soon":

        return "border-yellow-200 bg-yellow-50 text-yellow-700";


      case "Paused":

        return "border-gray-200 bg-gray-100 text-gray-700";


      default:

        return "border-input bg-background text-foreground";

    }

  }


  /* ============================================= */
  /* CHANGE STATUS */
  /* ============================================= */

  async function changeStatus(
    candidate: Candidate,
    newStatus: Status,
  ) {

    try {

      setUpdatingStatus(
        candidate.id,
      );


      const identifier =
        getCandidateIdentifier(
          candidate,
        );


      const updatedCandidate =
        await updateCandidate(
          identifier,
          {
            status:
              newStatus,
          },
        );


      setLocalCandidates(
        (current) =>
          current.map(
            (item) => {

              if (
                item.id ===
                candidate.id
              ) {

                return {
                  ...item,
                  ...updatedCandidate,
                  status:
                    newStatus,
                };

              }

              return item;

            },
          ),
      );

    } catch (error) {

      console.error(
        "Failed to update status:",
        error,
      );


      alert(
        error instanceof Error
          ? error.message
          : "Failed to update candidate status",
      );

    } finally {

      setUpdatingStatus(
        null,
      );

    }

  }


  /* ============================================= */
  /* ADD CANDIDATE */
  /* ============================================= */

  async function handleAddCandidate(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (
    !formData.name.trim() ||
    !formData.email.trim()
  ) {
    alert(
      "Please enter candidate name and email.",
    );

    return;
  }

  try {
    setSavingCandidate(true);

    const response =
      await createCandidate(
        formData,
      );

    // Get the actual candidate object.
    // Supports both:
    // { success: true, data: candidate }
    // and directly returned candidate.
    const newCandidate =
      response?.data ?? response;

    if (
      !newCandidate ||
      !newCandidate.id
    ) {
      console.error(
        "Invalid candidate response:",
        response,
      );

      throw new Error(
        "Candidate was created, but invalid data was returned from the server.",
      );
    }

    setLocalCandidates(
      (current) => [
        ...current,
        newCandidate as Candidate,
      ],
    );

    // Keep status state updated
    setCandidateStatuses(
      (current) => ({
        ...current,
        [newCandidate.id]:
          newCandidate.status ??
          formData.status,
      }),
    );

    setFormData(
      createEmptyForm(),
    );

    setShowAddModal(
      false,
    );

    alert(
      `${newCandidate.name} has been added successfully.`,
    );
  } catch (error) {
    console.error(
      "Failed to add candidate:",
      error,
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to add candidate",
    );
  } finally {
    setSavingCandidate(
      false,
    );
  }
}


  /* ============================================= */
  /* OPEN EDIT */
  /* ============================================= */

  function openEditCandidate(
    candidate: Candidate,
  ) {

    setSelectedCandidate(
      candidate,
    );


    setEditForm({

      name:
        candidate.name ?? "",

      email:
        candidate.email ?? "",

      phone:
        candidate.phone ?? "",

      location:
        candidate.location ?? "",

      domain:
        candidate.domain ??
        domains[0] ??
        "",

      targetRole:
        candidate.targetRole ?? "",

      experience:
        candidate.experience ??
        "0-2 yrs",

      plan:
  candidate.plan ??
  plans[0]?.name ??
  "Basic",

programDays:
  String(
    candidate.programDays ??
    45,
  ),

assignedSpecialist:
  candidate.assignedSpecialist ??
  "",

      startDate:
        candidate.startDate ??
        new Date()
          .toISOString()
          .split("T")[0],

      status:
        (
          candidate.status ??
          "Active"
        ) as Status,

      notes:
        candidate.notes ?? "",

    });


    setShowEditModal(
      true,
    );

  }


  /* ============================================= */
  /* UPDATE CANDIDATE */
  /* ============================================= */

  async function handleEditCandidate(
    event:
      React.FormEvent<
        HTMLFormElement
      >,
  ) {

    event.preventDefault();


    if (!selectedCandidate) {

      return;

    }


    if (
      !editForm.name.trim() ||
      !editForm.email.trim()
    ) {

      alert(
        "Name and email are required.",
      );

      return;

    }


    try {

      setSavingCandidate(
        true,
      );


      const identifier =
        getCandidateIdentifier(
          selectedCandidate,
        );


      const updatedCandidate =
        await updateCandidate(
          identifier,
          editForm,
        );


      setLocalCandidates(
        (current) =>
          current.map(
            (candidate) =>
              candidate.id ===
              selectedCandidate.id
                ? {
                    ...candidate,
                    ...updatedCandidate,
                  }
                : candidate,
          ),
      );


      setShowEditModal(
        false,
      );

      setSelectedCandidate(
        null,
      );


      alert(
        "Candidate updated successfully.",
      );

    } catch (error) {

      console.error(
        "Failed to update candidate:",
        error,
      );


      alert(
        error instanceof Error
          ? error.message
          : "Failed to update candidate",
      );

    } finally {

      setSavingCandidate(
        false,
      );

    }

  }


  /* ============================================= */
  /* OPEN DELETE */
  /* ============================================= */

  function openDeleteCandidate(
    candidate: Candidate,
  ) {

    setSelectedCandidate(
      candidate,
    );

    setShowDeleteModal(
      true,
    );

  }


  /* ============================================= */
  /* DELETE CANDIDATE */
  /* ============================================= */

  async function handleDeleteCandidate() {

    if (!selectedCandidate) {

      return;

    }


    try {

      setDeletingCandidate(
        true,
      );


      const identifier =
        getCandidateIdentifier(
          selectedCandidate,
        );


      await deleteCandidate(
        identifier,
      );


      setLocalCandidates(
        (current) =>
          current.filter(
            (candidate) =>
              candidate.id !==
              selectedCandidate.id,
          ),
      );


      setShowDeleteModal(
        false,
      );

      setSelectedCandidate(
        null,
      );


      alert(
        "Candidate deleted successfully.",
      );

    } catch (error) {

      console.error(
        "Failed to delete candidate:",
        error,
      );


      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete candidate",
      );

    } finally {

      setDeletingCandidate(
        false,
      );

    }

  }


  /* ============================================= */
  /* IMPORT */
  /* ============================================= */

  

  return (

    <>

      <Layout
        title="Candidates"

        subtitle={
          loadingCandidates
            ? "Loading candidates..."
            : `${rows.length} of ${localCandidates.length} candidates shown`
        }

        actions={
          <>

            <Button
              variant="outline"

              onClick={() =>
                setShowImportModal(
                  true,
                )
              }
            >

              <Upload className="size-4" />

              Import Excel

            </Button>


            <Button
              onClick={() =>
                setShowAddModal(
                  true,
                )
              }
            >

              <UserPlus className="size-4" />

              Add Candidate

            </Button>

          </>
        }
      >


        {/* ERROR */}

        {error && (

          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>
              {error}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadCandidates}
            >
              Retry
            </Button>

          </div>

        )}


        {/* FILTERS */}

        <Card>

          <CardContent className="p-5">

            <div className="flex flex-wrap items-center gap-3">


              {/* SEARCH */}

              <div className="relative min-w-[250px] flex-1">

                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={query}

                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }

                  placeholder="Search by name, email, ID or target role"

                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />

              </div>


              {/* PLAN */}

              <select
                value={plan}

                onChange={(event) =>
                  setPlan(
                    event.target.value,
                  )
                }

                className="h-9 w-[150px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
              >

                <option value="all">
                  All plans
                </option>

                {plans.map(
                  (item) => (

                    <option
                      key={item.name}
                      value={item.name}
                    >

                      {item.name}

                    </option>

                  ),
                )}

              </select>


              {/* DOMAIN */}

              <select
                value={domain}

                onChange={(event) =>
                  setDomain(
                    event.target.value,
                  )
                }

                className="h-9 w-[190px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
              >

                <option value="all">
                  All domains
                </option>

                {domains.map(
                  (item) => (

                    <option
                      key={item}
                      value={item}
                    >

                      {item}

                    </option>

                  ),
                )}

              </select>


              {/* STATUS */}

              <select
                value={status}

                onChange={(event) =>
                  setStatus(
                    event.target.value,
                  )
                }

                className="h-9 w-[160px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
              >

                <option value="all">
                  All statuses
                </option>

                {statuses.map(
                  (item) => (

                    <option
                      key={item}
                      value={item}
                    >

                      {item}

                    </option>

                  ),
                )}

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

              <table className="w-full min-w-[1450px] text-sm">

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
                      Start Date
                    </th>


                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                    End Date
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Days Left
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

                  {loadingCandidates && (

                    <tr>

                      <td
                        colSpan={11}
                        className="px-5 py-14 text-center text-muted-foreground"
                      >

                        Loading candidates...

                      </td>

                    </tr>

                  )}


                  {!loadingCandidates &&
                    rows.map(
                      (
                        candidate,
                      ) => {

                        const identifier =
                          getCandidateIdentifier(
                            candidate,
                          );

                        const currentStatus =
                          (
                            candidate.status ??
                            "Active"
                          ) as Status;


                        return (

                          <tr
                            key={
                              candidate.id
                            }

                            className="border-b last:border-0 hover:bg-accent/40"
                          >

                            <td className="px-5 py-4 text-xs text-muted-foreground">

                              {candidate.id}

                            </td>


                            <td className="px-5 py-4">

                              <p className="font-medium">

                                {candidate.name}

                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">

                                {candidate.email}

                              </p>

                            </td>


                            <td className="px-5 py-4 text-muted-foreground">

                              {candidate.domain || "-"}

                            </td>


                            <td className="px-5 py-4">

                              {candidate.plan || "-"}

                            </td>


                            <td className="px-5 py-4 text-muted-foreground">

                              {candidate.experience || "-"}

                            </td>


                          {/* START DATE */}
<td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
  {candidate.startDate || "-"}
</td>

{/* END DATE */}
<td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
  {getProgramEndDate(
    candidate.startDate,
    candidate.programDays,
  )}
</td>

{/* DAYS LEFT */}
<td className="whitespace-nowrap px-5 py-4">
  {candidate.daysRemaining ?? "-"}
</td>


                            <td className="px-5 py-4">

                              {candidate.creditsRemaining ?? 0}
                              {" / "}
                              {candidate.creditsTotal ?? 0}

                            </td>


                            {/* STATUS */}

                            <td className="px-5 py-4">

                              <select
                                value={currentStatus}

                                disabled={
                                  updatingStatus ===
                                  candidate.id
                                }

                                onChange={(event) =>
                                  changeStatus(
                                    candidate,
                                    event.target
                                      .value as Status,
                                  )
                                }

                                className={`h-8 rounded-md border px-2 text-xs font-medium outline-none ${getStatusClass(
                                  currentStatus,
                                )}`}
                              >

                                {statuses.map(
                                  (item) => (

                                    <option
                                      key={item}
                                      value={item}
                                    >

                                      {item}

                                    </option>

                                  ),
                                )}

                              </select>

                            </td>


                            

                            {/* ACTIONS */}
<td className="px-5 py-4">
  <div className="flex items-center justify-end gap-2">

    {/* VIEW - ALWAYS VISIBLE */}
    <Link
      to={`/candidates/${identifier}`}
      onClick={() => setOpenActionMenu(null)}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={`View ${candidate.name}`}
      >
        <Eye className="size-4" />
      </Button>
    </Link>

    {/* THREE-DOT MENU */}
    <div className="relative">
      <button
        type="button"
        aria-label={`More actions for ${candidate.name}`}
        onClick={() =>
          setOpenActionMenu(
            openActionMenu === candidate.id
              ? null
              : candidate.id
          )
        }
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <MoreVertical size={20} strokeWidth={2} />
      </button>

      {openActionMenu === candidate.id && (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-lg border border-border bg-card p-1 shadow-xl">

          <button
            type="button"
            onClick={() => {
              setOpenActionMenu(null);
              openEditCandidate(candidate);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
          >
            <Edit className="size-4" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenActionMenu(null);
              openDeleteCandidate(candidate);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
            Delete
          </button>

        </div>
      )}
    </div>
  </div>
</td>

                          </tr>

                        );

                      },
                    )}


                  {!loadingCandidates &&
                    rows.length === 0 && (

                      <tr>

                        <td
                          colSpan={11}

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


      {/* ============================================= */}
      {/* ADD CANDIDATE MODAL */}
      {/* ============================================= */}
{showAddModal && (
  <CandidateFormModal
    title="Add New Candidate"
    description="Enter candidate and program details."
    formData={formData}
    setFormData={setFormData}
    onClose={() => {
      setFormData(createEmptyForm());
      setShowAddModal(false);
    }}
    onSubmit={handleAddCandidate}
    submitLabel={
      savingCandidate
        ? "Adding..."
        : "Add Candidate"
    }
    submitIcon={
      <UserPlus className="size-4" />
    }
    saving={savingCandidate}
  />
)}


      {/* ============================================= */}
      {/* EDIT CANDIDATE MODAL */}
      {/* ============================================= */}

      {showEditModal && (

        <CandidateFormModal
          title="Edit Candidate"

          description="Update candidate and program details."

          formData={editForm}

          setFormData={setEditForm}

          onClose={() => {

            setShowEditModal(
              false,
            );

            setSelectedCandidate(
              null,
            );

          }}

          onSubmit={
            handleEditCandidate
          }

          submitLabel={
            savingCandidate
              ? "Saving..."
              : "Save Changes"
          }

          submitIcon={
            <Edit className="size-4" />
          }

          saving={
            savingCandidate
          }
        />

      )}


      {/* ============================================= */}
      {/* DELETE CONFIRMATION */}
      {/* ============================================= */}

      {showDeleteModal &&
        selectedCandidate && (

          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-semibold">

                    Delete Candidate

                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">

                    Are you sure you want to delete{" "}

                    <span className="font-semibold text-foreground">

                      {selectedCandidate.name}

                    </span>

                    ?

                  </p>

                  <p className="mt-2 text-sm text-destructive">

                    This action cannot be undone.

                  </p>

                </div>


                <Button
                  variant="ghost"
                  size="icon"

                  disabled={
                    deletingCandidate
                  }

                  onClick={() => {

                    setShowDeleteModal(
                      false,
                    );

                    setSelectedCandidate(
                      null,
                    );

                  }}
                >

                  <X className="size-5" />

                </Button>

              </div>


              <div className="mt-7 flex justify-end gap-3">

                <Button
                  variant="outline"

                  disabled={
                    deletingCandidate
                  }

                  onClick={() => {

                    setShowDeleteModal(
                      false,
                    );

                    setSelectedCandidate(
                      null,
                    );

                  }}
                >

                  Cancel

                </Button>


                <Button
                  disabled={
                    deletingCandidate
                  }

                  onClick={
                    handleDeleteCandidate
                  }

                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >

                  <Trash2 className="size-4" />

                  {
                    deletingCandidate
                      ? "Deleting..."
                      : "Delete Candidate"
                  }

                </Button>

              </div>

            </div>

          </div>

        )}


            {/* ============================================= */}
      {/* IMPORT CANDIDATES */}
      {/* ============================================= */}

      <ImportCandidatesDialog
        open={showImportModal}
        onClose={() =>
          setShowImportModal(
            false,
          )
        }
        onImported={
          loadCandidates
        }
      />
     

    </>

  );

}


/* ============================================= */
/* REUSABLE CANDIDATE FORM MODAL */
/* ============================================= */



function CandidateFormModal({
  title,
  description,
  formData,
  setFormData,
  onClose,
  onSubmit,
  submitLabel,
  submitIcon,
  saving,
}: {
  title: string;
  description: string;
  formData: CandidateForm;
  setFormData: React.Dispatch<
    React.SetStateAction<CandidateForm>
  >;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
  submitLabel: string;
  submitIcon: React.ReactNode;
  saving: boolean;
}) {
  const inputClass =
    "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30";

  const selectClass =
    "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border bg-background shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-background px-7 py-5">
          <div>
            <h2 className="text-xl font-semibold">
              {title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={saving}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* FORM */}
        <form
          onSubmit={onSubmit}
          className="p-7"
        >

          {/* PERSONAL DETAILS */}
          <div>
            <h3 className="font-semibold">
              Candidate Details
            </h3>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField
                label="Full Name"
                required
              >
                <input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter full name"
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Email Address"
                required
              >
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="candidate@email.com"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Phone">
                <input
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+1 000 000 0000"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Location">
                <input
                  value={formData.location}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="City, State"
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>

          {/* CAREER DETAILS */}
          <div className="mt-7 border-t pt-6">
            <h3 className="font-semibold">
              Career Details
            </h3>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField label="Domain">
                <select
                  value={formData.domain}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      domain: event.target.value,
                    }))
                  }
                  className={selectClass}
                >
                  {domains.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Target Role">
                <input
                  value={formData.targetRole}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      targetRole: event.target.value,
                    }))
                  }
                  placeholder="Example: Data Analyst"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Experience">
                <input
                  value={formData.experience}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      experience: event.target.value,
                    }))
                  }
                  placeholder="Example: 0-2 yrs"
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>

          {/* PROGRAM DETAILS */}
          <div className="mt-7 border-t pt-6">
            <h3 className="font-semibold">
              Program Details
            </h3>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <FormField label="Plan">
                <select
                  value={formData.plan}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      plan: event.target.value,
                    }))
                  }
                  className={selectClass}
                >
                  {plans.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      status: event.target.value as Status,
                    }))
                  }
                  className={selectClass}
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
              </FormField>

              <FormField label="Start Date">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Assigned Specialist">
                <input
                  value={formData.assignedSpecialist}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      assignedSpecialist: event.target.value,
                    }))
                  }
                  placeholder="Enter specialist name"
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Program Days"
                required
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.programDays}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      programDays: event.target.value,
                    }))
                  }
                  placeholder="Example: 45"
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>

          {/* NOTES */}
          <div className="mt-7 border-t pt-6">
            <FormField label="Internal Notes">
              <textarea
                value={formData.notes}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add optional notes about this candidate..."
                className="min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
              />
            </FormField>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {submitIcon}

              <span className="ml-2">
                {saving ? "Saving..." : submitLabel}
              </span>
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}


/* ============================================= */
/* FORM FIELD */
/* ============================================= */

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {

  return (

    <label className="block">

      <span className="mb-2 block text-sm font-medium">

        {label}

        {required && (

          <span className="ml-1 text-destructive">

            *

          </span>

        )}

      </span>

      {children}

    </label>

  );

}