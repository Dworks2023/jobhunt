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


/*
========================================
APPLICATION HISTORY RESPONSE TYPE
========================================
*/

export type ApplicationHistoryResponse = {
  success: boolean;

  data: ApplicationHistoryItem[];

  creditsTotal: number;

  creditsUsed: number;

  creditsRemaining: number;
};


/*
========================================
ADD DAILY APPLICATION RESPONSE TYPE
========================================
*/

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

  /*
  ========================================
  APPLICATION CREDITS
  ========================================
  */

  creditsTotal?: number;

  creditsUsed?: number;

  creditsRemaining?: number;

  /*
  ========================================
  APPLICATION HISTORY
  ========================================
  */

  applicationHistory?:
    ApplicationHistoryItem[];

  daysRemaining?: number;

  createdAt?: string;

  updatedAt?: string;
};


/*
========================================
CANDIDATE FORM TYPE
========================================
*/

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

  /*
  Application credits
  */

  creditsTotal?: number;

  creditsRemaining?: number;

  daysRemaining?: number;
};


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
    data =
      text
        ? JSON.parse(
            text,
          )
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
    await fetch(
      API_URL,
    );

  const data =
    await parseResponse(
      response,
    );

  console.log(
    "Get candidates API response:",
    data,
  );

  if (
    Array.isArray(
      data?.data,
    )
  ) {
    return data.data;
  }

  if (
    Array.isArray(
      data,
    )
  ) {
    return data;
  }

  return [];
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

  const formData =
    new FormData();

  formData.append(
    "file",
    file,
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

  return {
    success:
      Boolean(
        data?.success,
      ),

    message:
      data?.message ||
      "Candidates imported successfully.",

    imported:
      Number(
        data?.imported,
      ) || 0,

    skipped:
      Number(
        data?.skipped,
      ) || 0,

    skippedRows:
      Array.isArray(
        data?.skippedRows,
      )
        ? data.skippedRows
        : [],

    data:
      Array.isArray(
        data?.data,
      )
        ? data.data
        : [],
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

  const candidate =
    data?.data ??
    data;

  if (
    !candidate ||
    typeof candidate !==
      "object"
  ) {
    throw new Error(
      "Candidate data was not returned by the server.",
    );
  }

  /*
  Normalize MongoDB _id to id
  */

  if (
    !candidate.id &&
    candidate._id
  ) {
    candidate.id =
      typeof candidate._id ===
      "string"
        ? candidate._id
        : candidate._id.toString();
  }

  return candidate as Candidate;
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

  /*
  Safety fallback
  */

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
        method:
          "POST",

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

  console.log(
    "Create candidate API response:",
    data,
  );

  /*
  Backend may return:

  {
    success: true,
    message: "...",
    data: { candidate }
  }

  OR directly:

  { candidate }
  */

  const candidate =
    data?.data ??
    data;

  if (
    !candidate ||
    typeof candidate !==
      "object"
  ) {
    throw new Error(
      "Candidate was created, but the server did not return candidate data.",
    );
  }

  /*
  Normalize MongoDB _id
  */

  if (
    !candidate.id &&
    candidate._id
  ) {
    candidate.id =
      typeof candidate._id ===
      "string"
        ? candidate._id
        : candidate._id.toString();
  }

  if (
    !candidate.name
  ) {
    console.error(
      "Invalid candidate returned:",
      candidate,
    );

    throw new Error(
      "Candidate was created, but invalid candidate data was returned.",
    );
  }

  return candidate as Candidate;
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
        method:
          "PUT",

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
    data?.data ??
    data;

  if (
    !updatedCandidate ||
    typeof updatedCandidate !==
      "object"
  ) {
    throw new Error(
      "Updated candidate data was not returned.",
    );
  }

  /*
  Normalize MongoDB _id
  */

  if (
    !updatedCandidate.id &&
    updatedCandidate._id
  ) {
    updatedCandidate.id =
      typeof updatedCandidate._id ===
      "string"
        ? updatedCandidate._id
        : updatedCandidate._id.toString();
  }

  return updatedCandidate as Candidate;
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
        method:
          "DELETE",
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