/*
========================================
API BASE URL
========================================
*/

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/candidates";


/*
========================================
APPLICATION HISTORY TYPE
========================================
*/

export type ApplicationHistoryItem = {
  id: string;
  date: string;
  applications: number;
  updatedBy: string;
  createdAt?: string;
  updatedAt?: string;
};


export type ApplicationHistoryResponse = {
  success: boolean;
  data: ApplicationHistoryItem[];
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
};


export type AddDailyApplicationsResponse = {
  success: boolean;
  message: string;
  data: ApplicationHistoryItem;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
};


/*
========================================
CANDIDATE TYPE
========================================
*/

export type Candidate = {
  _id?: string;
  id?: string;

  name: string;
  email: string;

  phone?: string;
  location?: string;
  domain?: string;
  targetRole?: string;
  experience?: string;
  plan?: string;
  assignedSpecialist?: string;
  startDate?: string;
  status?: string;
  notes?: string;

  creditsTotal?: number;
  creditsUsed?: number;
  creditsRemaining?: number;

  applicationHistory?: ApplicationHistoryItem[];

  daysRemaining?: number;

  createdAt?: string;
  updatedAt?: string;
};


export type CandidateForm = {
  name: string;
  email: string;

  phone?: string;
  location?: string;
  domain?: string;
  targetRole?: string;
  experience?: string;
  plan?: string;
  assignedSpecialist?: string;
  startDate?: string;
  status?: string;
  notes?: string;

  creditsTotal?: number;
  creditsRemaining?: number;
  daysRemaining?: number;
};


/*
========================================
CANDIDATE NORMALIZATION
========================================
*/

function normalizeCandidate(
  candidate: any,
): Candidate {
  if (
    !candidate ||
    typeof candidate !== "object"
  ) {
    throw new Error(
      "Invalid candidate data received from the server.",
    );
  }

  const rawId =
    candidate.id ??
    candidate._id;

  const id =
    rawId == null
      ? ""
      : typeof rawId === "string"
        ? rawId
        : String(rawId);

  return {
    ...candidate,

    id,

    _id:
      candidate._id == null
        ? undefined
        : typeof candidate._id === "string"
          ? candidate._id
          : String(candidate._id),
  } as Candidate;
}


/*
========================================
EXTRACT CANDIDATE
========================================
*/

function extractCandidate(
  payload: any,
): any {
  const outer =
    payload?.data ??
    payload;

  return (
    outer?.candidate ??
    outer
  );
}


/*
========================================
PARSE API RESPONSE
========================================
*/

async function parseResponse(
  response: Response,
) {
  const text =
    await response.text();

  let data: any = null;

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    throw new Error(
      text ||
        "Server returned an invalid response.",
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "API request failed.",
    );
  }

  return data;
}


/*
========================================
GET ALL CANDIDATES
GET /api/candidates
========================================
*/

export async function getCandidates(): Promise<
  Candidate[]
> {
  const response =
    await fetch(API_URL, {
      method: "GET",

      headers: {
        Accept:
          "application/json",
      },

      cache: "no-store",
    });

  const data =
    await parseResponse(
      response,
    );

  const candidates =
    Array.isArray(data?.data)
      ? data.data
      : Array.isArray(
          data?.candidates,
        )
        ? data.candidates
        : Array.isArray(data)
          ? data
          : null;

  if (!candidates) {
    throw new Error(
      "Candidates API returned an invalid response.",
    );
  }

  return candidates
    .map(
      (
        candidate: any,
        index: number,
      ) => ({
        candidate:
          normalizeCandidate(
            candidate,
          ),

        originalIndex:
          index,
      }),
    )
    .filter(
      ({
        candidate,
      }: {
        candidate: Candidate;
      }) =>
        Boolean(candidate.id),
    )
    .sort(
      (
        a: {
          candidate: Candidate;
          originalIndex: number;
        },
        b: {
          candidate: Candidate;
          originalIndex: number;
        },
      ) => {
        const aTime =
          a.candidate.createdAt
            ? new Date(
                a.candidate.createdAt,
              ).getTime()
            : Number.NaN;

        const bTime =
          b.candidate.createdAt
            ? new Date(
                b.candidate.createdAt,
              ).getTime()
            : Number.NaN;

        if (
          !Number.isFinite(
            aTime,
          ) ||
          !Number.isFinite(
            bTime,
          )
        ) {
          return (
            a.originalIndex -
            b.originalIndex
          );
        }

        return (
          aTime -
          bTime
        );
      },
    )
    .map(
      ({
        candidate,
      }) => candidate,
    );
}


/*
========================================
IMPORT CANDIDATES
POST /api/candidates/import
========================================
*/

export async function importCandidates(
  file: File,
): Promise<{
  success: boolean;
  message: string;
  imported: number;
  created: number;
  updated: number;
  skipped: number;

  skippedRows?: Array<{
    row: number;
    email?: string;
    reason: string;
  }>;

  data: Candidate[];
}> {
  if (!file) {
    throw new Error(
      "Please select a file.",
    );
  }

  const fileName =
    file.name.toLowerCase();

  const supportedFile =
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv");

  if (!supportedFile) {
    throw new Error(
      "Please select a valid Excel or CSV file (.xlsx, .xls, or .csv).",
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file,
    file.name,
  );

  const response =
    await fetch(
      `${API_URL}/import`,
      {
        method: "POST",
        body: formData,
      },
    );

  const data =
    await parseResponse(
      response,
    );

  const imported =
    Number(data?.imported) ||
    0;

  const created =
    Number(data?.created) ||
    0;

  const updated =
    Number(data?.updated) ||
    0;

  const skipped =
    Number(data?.skipped) ||
    0;

  const importedCandidatesRaw =
    Array.isArray(data?.data)
      ? data.data
      : Array.isArray(
          data?.candidates,
        )
        ? data.candidates
        : [];

  const importedCandidates =
    importedCandidatesRaw
      .map(
        (candidate: any) =>
          normalizeCandidate(
            candidate,
          ),
      )
      .filter(
        (candidate: Candidate) =>
          Boolean(candidate.id),
      );

  return {
    success:
      data?.success !== false,

    message:
      data?.message ||
      `Import completed. ${created} created, ${updated} updated, ${skipped} skipped.`,

    imported,

    created,

    updated,

    skipped,

    skippedRows:
      Array.isArray(
        data?.skippedRows,
      )
        ? data.skippedRows
        : Array.isArray(
            data?.errors,
          )
          ? data.errors
          : [],

    data:
      importedCandidates,
  };
}


/*
========================================
GET SINGLE CANDIDATE
GET /api/candidates/:id
========================================
*/

export async function getCandidate(
  id: string,
): Promise<Candidate> {
  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(id)}`,
    );

  const data =
    await parseResponse(
      response,
    );

  const candidate =
    extractCandidate(data);

  if (
    !candidate ||
    typeof candidate !==
      "object"
  ) {
    throw new Error(
      "Candidate data was not returned by the server.",
    );
  }

  return normalizeCandidate(
    candidate,
  );
}


/*
========================================
GET SINGLE CANDIDATE BY ID
Alias used by CandidateDetails.tsx
========================================
*/

export async function getCandidateById(
  id: string,
): Promise<Candidate> {
  return getCandidate(id);
}


/*
========================================
GET APPLICATION HISTORY
GET /api/candidates/:id/applications
========================================
*/

export async function getApplicationHistory(
  id: string,
): Promise<ApplicationHistoryResponse> {
  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(
        id,
      )}/applications`,
    );

  const data =
    await parseResponse(
      response,
    );

  return {
    success:
      data?.success ??
      true,

    data:
      Array.isArray(
        data?.data,
      )
        ? data.data
        : [],

    creditsTotal:
      Number(
        data?.creditsTotal,
      ) || 0,

    creditsUsed:
      Number(
        data?.creditsUsed,
      ) || 0,

    creditsRemaining:
      Number(
        data?.creditsRemaining,
      ) || 0,
  };
}


/*
========================================
ADD DAILY APPLICATIONS
POST /api/candidates/:id/applications
========================================
*/

export async function addDailyApplications(
  id: string,

  applicationData: {
    applications: number;
    date?: string;
    updatedBy?: string;
  },
): Promise<AddDailyApplicationsResponse> {
  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(
        id,
      )}/applications`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            applicationData,
          ),
      },
    );

  const data =
    await parseResponse(
      response,
    );

  if (
    !data?.data ||
    typeof data.data !==
      "object"
  ) {
    throw new Error(
      "Applications were saved, but invalid data was returned.",
    );
  }

  return {
    success:
      data?.success ??
      true,

    message:
      data?.message ||
      "Applications updated successfully.",

    data:
      data.data as ApplicationHistoryItem,

    creditsTotal:
      Number(
        data?.creditsTotal,
      ) || 0,

    creditsUsed:
      Number(
        data?.creditsUsed,
      ) || 0,

    creditsRemaining:
      Number(
        data?.creditsRemaining,
      ) || 0,
  };
}


/*
========================================
CREATE CANDIDATE
POST /api/candidates
========================================
*/

export async function createCandidate(
  candidateData: CandidateForm,
): Promise<Candidate> {
  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            candidateData,
          ),
      },
    );

  const data =
    await parseResponse(
      response,
    );

  const candidate =
    extractCandidate(data);

  if (
    !candidate ||
    typeof candidate !==
      "object"
  ) {
    throw new Error(
      "Candidate was created, but the server did not return candidate data.",
    );
  }

  return normalizeCandidate(
    candidate,
  );
}


/*
========================================
UPDATE CANDIDATE
PUT /api/candidates/:id
========================================
*/

export async function updateCandidate(
  id: string,
  candidate: Partial<Candidate>,
): Promise<Candidate> {
  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(id)}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            candidate,
          ),
      },
    );

  const data =
    await parseResponse(
      response,
    );

  const updatedCandidate =
    extractCandidate(data);

  if (
    !updatedCandidate ||
    typeof updatedCandidate !==
      "object"
  ) {
    throw new Error(
      "Updated candidate data was not returned.",
    );
  }

  return normalizeCandidate(
    updatedCandidate,
  );
}


/*
========================================
UPDATE CANDIDATE STATUS
PUT /api/candidates/:id
========================================
*/

export async function updateCandidateStatus(
  id: string,
  status: string,
): Promise<Candidate> {
  return updateCandidate(
    id,
    {
      status,
    },
  );
}


/*
========================================
DELETE CANDIDATE
DELETE /api/candidates/:id
========================================
*/

/*
========================================
DELETE CANDIDATE
DELETE /api/candidates/:id
========================================
*/

export async function deleteCandidate(
  id: string,
): Promise<{
  success: boolean;
  message?: string;
}> {
  if (!id) {
    throw new Error(
      "Candidate ID is required.",
    );
  }

  const candidateId =
    String(id).trim();

  const deleteUrl =
    `http://localhost:5000/api/candidates/${encodeURIComponent(
      candidateId,
    )}`;

  console.log(
    "========================================",
  );

  console.log(
    "DELETE CANDIDATE",
  );

  console.log(
    "Candidate ID:",
    candidateId,
  );

  console.log(
    "DELETE URL:",
    deleteUrl,
  );

  console.log(
    "========================================",
  );

  const response =
    await fetch(
      deleteUrl,
      {
        method: "DELETE",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  const responseText =
    await response.text();

  let data: any = {};

  try {
    data = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    data = {
      message:
        responseText ||
        "Server returned an invalid response.",
    };
  }

  console.log(
    "Delete response status:",
    response.status,
  );

  console.log(
    "Delete response:",
    data,
  );

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Failed to delete candidate. HTTP ${response.status}`,
    );
  }

  return {
    success:
      data?.success ??
      true,

    message:
      data?.message ||
      "Candidate deleted successfully.",
  };
}


/*
========================================
UPLOAD DAILY MAR
========================================
*/

export async function uploadMARReport(
  candidateId: string,
  file: File,
  updatedBy: string,
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  formData.append(
    "updatedBy",
    updatedBy,
  );

  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(
        candidateId,
      )}/mar`,
      {
        method: "POST",
        body: formData,
      },
    );

  const data =
    await parseResponse(
      response,
    );

  return data.data;
}


/*
========================================
UPLOAD REPORT / INTERVIEW CALL
========================================
*/

export async function uploadCandidateReport(
  candidateId: string,
  file: File,
  uploadedBy: string,
  type: string,
  company = "",
  role = "",
  reportType = "",
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  formData.append(
    "uploadedBy",
    uploadedBy,
  );

  formData.append(
    "type",
    type,
  );

  formData.append(
    "company",
    company,
  );

  formData.append(
    "role",
    role,
  );

  formData.append(
    "reportType",
    reportType,
  );

  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(
        candidateId,
      )}/reports`,
      {
        method: "POST",
        body: formData,
      },
    );

  const data =
    await parseResponse(
      response,
    );

  return data.data;
}