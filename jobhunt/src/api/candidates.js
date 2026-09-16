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