const API_URL =
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
CANDIDATE NORMALIZATION HELPERS
========================================
*/

function normalizeCandidate(candidate: any): Candidate {
  if (!candidate || typeof candidate !== "object") {
    throw new Error(
      "Invalid candidate data received from the server."
    );
  }

  const rawId = candidate.id ?? candidate._id;

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

function extractCandidate(payload: any): any {
  const outer = payload?.data ?? payload;
  return outer?.candidate ?? outer;
}

/*
========================================
PARSE API RESPONSE
========================================
*/

async function parseResponse(response: Response) {
  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      text || "Server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      "API request failed."
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

export async function getCandidates(): Promise<Candidate[]> {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await parseResponse(response);

  console.log(
    "Get candidates API response:",
    data
  );

  const candidates =
    Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.candidates)
        ? data.candidates
        : Array.isArray(data)
          ? data
          : null;

  if (!candidates) {
    throw new Error(
      "Candidates API returned an invalid response."
    );
  }

  return candidates
    .map((candidate: any, index: number) => ({
      candidate: normalizeCandidate(candidate),
      originalIndex: index,
    }))
    .filter(
      ({ candidate }: { candidate: Candidate }) =>
        Boolean(candidate.id)
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
        }
      ) => {
        const aTime = a.candidate.createdAt
          ? new Date(a.candidate.createdAt).getTime()
          : Number.NaN;

        const bTime = b.candidate.createdAt
          ? new Date(b.candidate.createdAt).getTime()
          : Number.NaN;

        if (
          !Number.isFinite(aTime) ||
          !Number.isFinite(bTime)
        ) {
          return a.originalIndex - b.originalIndex;
        }

        return aTime - bTime;
      }
    )
    .map(({ candidate }) => candidate);
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
  skipped: number;
  skippedRows?: Array<{
    row: number;
    email?: string;
    reason: string;
  }>;
  data: Candidate[];
}> {
  if (!file) {
    throw new Error("Please select an Excel file.");
  }

  const isExcelFile =
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls");

  if (!isExcelFile) {
    throw new Error(
      "Please select a valid Excel file (.xlsx or .xls).",
    );
  }

  const formData = new FormData();

  formData.append("file", file, file.name);

  const response = await fetch(
    `${API_URL}/import`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await parseResponse(response);

  const imported =
    Number(data?.imported ?? data?.count) || 0;

  const skipped =
    Number(data?.skipped) || 0;

  const importedCandidatesRaw =
    Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.candidates)
        ? data.candidates
        : [];

  const importedCandidates =
    importedCandidatesRaw
      .map((candidate: any) =>
        normalizeCandidate(candidate),
      )
      .filter((candidate: Candidate) =>
        Boolean(candidate.id),
      );

  return {
    success:
      data?.success !== false,

    message:
      data?.message ||
      `Excel import completed. ${imported} candidate(s) imported and ${skipped} skipped.`,

    imported,

    skipped,

    skippedRows:
      Array.isArray(data?.skippedRows)
        ? data.skippedRows
        : Array.isArray(data?.errors)
          ? data.errors
          : [],

    data: importedCandidates,
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
      `${API_URL}/${id}`,
    );

  const data =
    await parseResponse(
      response,
    );

  const candidate = extractCandidate(data);

  if (
    !candidate ||
    typeof candidate !== "object"
  ) {
    throw new Error(
      "Candidate data was not returned by the server.",
    );
  }

  return normalizeCandidate(candidate);
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
  return getCandidate(
    id,
  );
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
      `${API_URL}/${id}/applications`,
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
      `${API_URL}/${id}/applications`,
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
    typeof data.data !== "object"
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

  console.log(
    "Create candidate API response:",
    data,
  );

  const candidate = extractCandidate(data);

  if (
    !candidate ||
    typeof candidate !== "object"
  ) {
    throw new Error(
      "Candidate was created, but the server did not return candidate data.",
    );
  }

  if (!candidate.name) {
    console.error(
      "Invalid candidate returned:",
      candidate,
    );

    throw new Error(
      "Candidate was created, but invalid candidate data was returned.",
    );
  }

  const normalized = normalizeCandidate(candidate);

  if (!normalized.id) {
    throw new Error(
      "Candidate was created, but the server did not return an ID. Check the backend create-candidate response.",
    );
  }

  return normalized;
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
      `${API_URL}/${id}`,
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

  const updatedCandidate = extractCandidate(data);

  if (
    !updatedCandidate ||
    typeof updatedCandidate !== "object"
  ) {
    throw new Error(
      "Updated candidate data was not returned.",
    );
  }

  return normalizeCandidate(updatedCandidate);
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

export async function deleteCandidate(
  id: string,
): Promise<{
  success: boolean;
  message?: string;
}> {
  const response =
    await fetch(
      `${API_URL}/${id}`,
      {
        method: "DELETE",
      },
    );

  const data =
    await parseResponse(
      response,
    );

  return {
    success:
      data?.success ??
      true,

    message:
      data?.message,
  };
}
