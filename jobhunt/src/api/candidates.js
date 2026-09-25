const API_URL = "http://localhost:5000/api/candidates";

/*
========================================
GET ALL CANDIDATES
GET /api/candidates
========================================
*/

export async function getCandidates() {
  const response = await fetch(API_URL);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch candidates",
    );
  }

  return data.data;
}


/*
========================================
GET SINGLE CANDIDATE
GET /api/candidates/:id
========================================
*/

export async function getCandidate(id: string) {
  const response = await fetch(
    `${API_URL}/${id}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch candidate",
    );
  }

  return data.data;
}


/*
========================================
CREATE CANDIDATE
POST /api/candidates
========================================
*/

export async function createCandidate(candidate: any) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(candidate),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create candidate",
    );
  }

  return data.data;
}


// Upload Daily MAR with manually entered Updated By name
export async function uploadMARReport(candidateId, file, updatedBy) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("updatedBy", updatedBy);

  const response = await fetch(
    `${API_URL}/${candidateId}/mar`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload MAR");
  }

  return data.data;
}

// Upload Reports / Interview Calls with manually entered Uploaded By name
export async function uploadCandidateReport(
  candidateId,
  file,
  uploadedBy,
  type,
  company = "",
  role = "",
  reportType = ""
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("uploadedBy", uploadedBy);
  formData.append("type", type);
  formData.append("company", company);
  formData.append("role", role);
  formData.append("reportType", reportType);

  const response = await fetch(
    `${API_URL}/${candidateId}/reports`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload report");
  }

  return data.data;
}