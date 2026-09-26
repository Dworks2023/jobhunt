import express from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

import { getDatabase } from "../db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| UPLOAD DIRECTORY
|--------------------------------------------------------------------------
*/

const uploadsDirectory = path.join(
  process.cwd(),
  "uploads",
);

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| MULTER CONFIGURATION
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    callback,
  ) => {
    callback(null, uploadsDirectory);
  },

  filename: (
    req,
    file,
    callback,
  ) => {
    const extension = path.extname(
      file.originalname,
    );

    const safeBaseName = path
      .basename(
        file.originalname,
        extension,
      )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        "-",
      )
      .slice(0, 80);

    const fileName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}-${safeBaseName}${extension}`;

    callback(null, fileName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

/*
|--------------------------------------------------------------------------
| HELPER - CANDIDATE QUERY
|--------------------------------------------------------------------------
*/

function getCandidateQuery(candidateId) {
  if (ObjectId.isValid(candidateId)) {
    return {
      _id: new ObjectId(candidateId),
    };
  }

  return {
    id: candidateId,
  };
}

/*
|--------------------------------------------------------------------------
| HELPER - DELETE FILE
|--------------------------------------------------------------------------
*/

function deleteUploadedFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "Unable to delete uploaded file:",
      error,
    );
  }
}

/*
|--------------------------------------------------------------------------
| HELPER - GET NEXT CANDIDATE ID
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This function finds the highest existing CD number.
|
| For normal single candidate creation, this is enough.
|
| During Excel import, DO NOT call this function repeatedly
| without reserving IDs, because the new candidates have
| not been inserted yet.
|
|--------------------------------------------------------------------------
*/

async function getHighestCandidateNumber(db) {
  const candidates = await db
    .collection("candidates")
    .find(
      {},
      {
        projection: {
          id: 1,
        },
      },
    )
    .toArray();

  let highestNumber = 0;

  candidates.forEach((candidate) => {
    const value = String(
      candidate.id || "",
    ).trim();

    const match = value.match(
      /^CD_(\d+)$/,
    );

    if (match) {
      const number = Number(match[1]);

      if (
        Number.isFinite(number) &&
        number > highestNumber
      ) {
        highestNumber = number;
      }
    }
  });

  return highestNumber;
}

/*
|--------------------------------------------------------------------------
| HELPER - CREATE CANDIDATE ID
|--------------------------------------------------------------------------
*/

async function generateCandidateId(db) {
  const highestNumber =
    await getHighestCandidateNumber(db);

  return `CD_${String(
    highestNumber + 1,
  ).padStart(2, "0")}`;
}

/*
|--------------------------------------------------------------------------
| HELPER - CREATE MULTIPLE UNIQUE CANDIDATE IDS
|--------------------------------------------------------------------------
|
| This is the IMPORTANT FIX for Excel imports.
|
| We reserve a sequence of IDs BEFORE inserting the records.
|
| Example:
|
| Existing highest = CD_10
|
| Excel has 5 candidates:
|
| Candidate 1 = CD_11
| Candidate 2 = CD_12
| Candidate 3 = CD_13
| Candidate 4 = CD_14
| Candidate 5 = CD_15
|
|--------------------------------------------------------------------------
*/

async function generateImportCandidateIds(
  db,
  count,
) {
  const highestNumber =
    await getHighestCandidateNumber(db);

  const ids = [];

  for (
    let index = 1;
    index <= count;
    index++
  ) {
    const nextNumber =
      highestNumber + index;

    ids.push(
      `CD_${String(
        nextNumber,
      ).padStart(2, "0")}`,
    );
  }

  return ids;
}

/*
|--------------------------------------------------------------------------
| HELPER - FIND CANDIDATE
|--------------------------------------------------------------------------
*/

async function findCandidate(
  db,
  candidateId,
) {
  const query =
    getCandidateQuery(candidateId);

  const candidate = await db
    .collection("candidates")
    .findOne(query);

  return {
    candidate,
    query,
  };
}

/*
|--------------------------------------------------------------------------
| HELPER - PLAN CREDITS
|--------------------------------------------------------------------------
*/

function getPlanCredits(plan) {
  const planNumber =
    String(plan || "").match(/\d+/)?.[0] ||
    "100";

  const planCredits = {
    "100": 100,
    "250": 250,
    "500": 500,
    "1000": 1000,
  };

  return {
    plan: planCredits[planNumber]
      ? planNumber
      : "100",

    credits: planCredits[planNumber]
      ? planCredits[planNumber]
      : 100,
  };
}

/*
|--------------------------------------------------------------------------
| HELPER - NORMALIZE IMPORT VALUE
|--------------------------------------------------------------------------
*/

function normalizeImportValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  /*
   * Excel date values are returned as JavaScript Date objects.
   * Convert them to YYYY-MM-DD so the frontend receives
   * exactly the same format as manually created candidates.
   */
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();

    const month = String(
      value.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      value.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return String(value).trim();
}
/*
|--------------------------------------------------------------------------
| HELPER - NORMALIZE EXCEL HEADER
|--------------------------------------------------------------------------
*/

function normalizeImportHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/*
|--------------------------------------------------------------------------
| APPLICATION HELPERS
|--------------------------------------------------------------------------
*/

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateApplicationId() {
  return `APP_${Date.now()}_${Math.floor(
    Math.random() * 100000,
  )}`;
}

/*
|--------------------------------------------------------------------------
| HELPER - CALCULATE DAYS LEFT
|--------------------------------------------------------------------------
|
| Every UNIQUE application date consumes 1 program day.
|
| Example:
|
| Program Days = 45
|
| Sep 21 → 10 applications
| Sep 21 → 5 applications
| Sep 22 → 8 applications
|
| Unique dates = 2
| Days Left = 45 - 2 = 43
|
|--------------------------------------------------------------------------
*/

function calculateDaysRemaining(candidate) {
  const programDays =
    Number(candidate.programDays) || 0;

  const applicationHistory =
    Array.isArray(
      candidate.applicationHistory,
    )
      ? candidate.applicationHistory
      : [];

  const uniqueApplicationDates =
    new Set(
      applicationHistory
        .map((item) =>
          String(item?.date || "").trim(),
        )
        .filter(Boolean),
    );

  const daysUsed =
    uniqueApplicationDates.size;

  return Math.max(
    programDays - daysUsed,
    0,
  );
}

/*
|--------------------------------------------------------------------------
| GET ALL CANDIDATES
|--------------------------------------------------------------------------
|
| GET /api/candidates
|
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const db = getDatabase();

    const candidates = await db
  .collection("candidates")
  .find({})
  .sort({
    createdAt: 1,
    _id: 1,
  })
  .toArray();

const candidatesWithDays =
  candidates.map((candidate) => ({
    ...candidate,

    daysRemaining:
      calculateDaysRemaining(
        candidate,
      ),
  }));

return res.json(
  candidatesWithDays,
);
  } catch (error) {
    console.error(
      "Error fetching candidates:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to fetch candidates.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE CANDIDATE
|--------------------------------------------------------------------------
|
| POST /api/candidates
|
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const db = getDatabase();

    const body = req.body || {};

    /*
    PLAN → CREDITS
    */

    const {
      plan: selectedPlan,
      credits: creditsTotal,
    } = getPlanCredits(body.plan);

    const creditsRemaining =
      creditsTotal;

      const programDays =
  Math.max(
    Number(body.programDays) || 0,
    0,
  );

    /*
    GENERATE CANDIDATE ID
    */

    const candidateId =
      body.id &&
      String(body.id).trim()
        ? String(body.id).trim()
        : await generateCandidateId(db);

    const now = new Date();

    const newCandidate = {
  ...body,

  id: candidateId,

  plan: selectedPlan,

  programDays,

  daysRemaining: programDays,

  creditsTotal,

      creditsRemaining,

      creditsUsed:
        Number(body.creditsUsed) || 0,

      monthly:
        Array.isArray(body.monthly)
          ? body.monthly
          : [],

      reports:
        Array.isArray(body.reports)
          ? body.reports
          : [],

      uploadedReports:
        Array.isArray(
          body.uploadedReports,
        )
          ? body.uploadedReports
          : [],

      uploadedMARReports:
        Array.isArray(
          body.uploadedMARReports,
        )
          ? body.uploadedMARReports
          : [],

      applicationHistory:
        Array.isArray(
          body.applicationHistory,
        )
          ? body.applicationHistory
          : [],

      feedback:
        Array.isArray(body.feedback)
          ? body.feedback
          : [],

      activity:
        Array.isArray(body.activity)
          ? body.activity
          : [],

      createdAt: now,

      updatedAt: now,
    };

    const result = await db
      .collection("candidates")
      .insertOne(newCandidate);

    return res.status(201).json({
      ...newCandidate,

      _id: result.insertedId,
    });
  } catch (error) {
    console.error(
      "Error creating candidate:",
      error,
    );

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A candidate with this email or ID already exists.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create candidate.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| IMPORT CANDIDATES FROM EXCEL / CSV
|--------------------------------------------------------------------------
|
| POST /api/candidates/import
|
| Supported:
| .xlsx
| .xls
| .csv
|
| Required:
| name
| email
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| IMPORT CANDIDATES FROM EXCEL / CSV
|--------------------------------------------------------------------------
|
| POST /api/candidates/import
|
| New email:
|   → Create candidate
|
| Existing email:
|   → Update candidate
|
| Duplicate email inside same Excel:
|   → Skip duplicate row
|
|--------------------------------------------------------------------------
*/

router.post(
  "/import",
  upload.single("file"),
  async (req, res) => {
    try {
      const db = getDatabase();

      /*
      ==================================================
      FILE VALIDATION
      ==================================================
      */

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select an Excel or CSV file.",
        });
      }

      const extension = path
        .extname(req.file.originalname)
        .toLowerCase();

      const allowedExtensions = [
        ".xlsx",
        ".xls",
        ".csv",
      ];

      if (
        !allowedExtensions.includes(extension)
      ) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          success: false,
          message:
            "Only .xlsx, .xls, and .csv files are supported.",
        });
      }

      /*
      ==================================================
      READ EXCEL / CSV
      ==================================================
      */

      const workbook = XLSX.read(
        req.file.path,
        {
          type: "file",
          cellDates: true,
        },
      );

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          success: false,
          message:
            "The uploaded file does not contain a worksheet.",
        });
      }

      const worksheet =
        workbook.Sheets[sheetName];

      const rows =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
          },
        );

      if (!rows.length) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          success: false,
          message:
            "The uploaded file is empty.",
        });
      }

      /*
      ==================================================
      HEADER NORMALIZATION
      ==================================================
      */

      function getImportValue(
        row,
        aliases,
      ) {
        for (const alias of aliases) {
          const key =
            normalizeImportHeader(alias);

          if (
            row[key] !== undefined &&
            row[key] !== null &&
            String(row[key]).trim() !== ""
          ) {
            return normalizeImportValue(
              row[key],
            );
          }
        }

        return "";
      }

      /*
      ==================================================
      NORMALIZE ALL ROWS
      ==================================================
      */

      const normalizedRows = [];

      const skippedRows = [];

      const uploadedEmails = new Set();

      for (
        let index = 0;
        index < rows.length;
        index++
      ) {
        const row = rows[index];

        const rowNumber = index + 2;

        const normalizedRow = {};

        Object.keys(row).forEach(
          (header) => {
            normalizedRow[
              normalizeImportHeader(
                header,
              )
            ] =
              normalizeImportValue(
                row[header],
              );
          },
        );

        /*
        ==============================================
        SUPPORT COMMON EXCEL COLUMN NAMES
        ==============================================
        */

        const candidateId =
          getImportValue(
            normalizedRow,
            [
              "candidate id",
              "candidateid",
              "id",
            ],
          );

        const name =
          getImportValue(
            normalizedRow,
            [
              "name",
              "full name",
              "fullname",
              "candidate name",
              "candidatename",
            ],
          );

        const email =
          getImportValue(
            normalizedRow,
            [
              "email",
              "email address",
              "emailaddress",
              "candidate email",
              "candidateemail",
            ],
          );

        const phone =
          getImportValue(
            normalizedRow,
            [
              "phone",
              "phone number",
              "phonenumber",
              "mobile",
              "mobile number",
            ],
          );

        const location =
          getImportValue(
            normalizedRow,
            [
              "location",
              "city",
              "candidate location",
            ],
          );

        const domain =
          getImportValue(
            normalizedRow,
            [
              "domain",
            ],
          );

        const targetRole =
          getImportValue(
            normalizedRow,
            [
              "target role",
              "targetrole",
              "role",
              "job role",
              "jobrole",
            ],
          );

        const experience =
          getImportValue(
            normalizedRow,
            [
              "experience",
              "years of experience",
              "yearsofexperience",
              "experience years",
            ],
          );

        const plan =
          getImportValue(
            normalizedRow,
            [
              "plan",
              "program plan",
            ],
          );

        const programDays =
          getImportValue(
            normalizedRow,
            [
              "program days",
              "programdays",
              "days",
            ],
          );

        const assignedSpecialist =
          getImportValue(
            normalizedRow,
            [
              "assigned specialist",
              "assignedspecialist",
              "specialist",
              "assigned expert",
              "assignedexpert",
              "owner",
            ],
          );

        const startDate =
          getImportValue(
            normalizedRow,
            [
              "start date",
              "startdate",
              "start",
            ],
          );

        const endDate =
          getImportValue(
            normalizedRow,
            [
              "end date",
              "enddate",
              "end",
            ],
          );

        const status =
          getImportValue(
            normalizedRow,
            [
              "status",
            ],
          );

        const notes =
          getImportValue(
            normalizedRow,
            [
              "notes",
              "note",
              "comments",
            ],
          );

        /*
        ==============================================
        REQUIRED FIELDS
        ==============================================
        */

        if (!name || !email) {
          skippedRows.push({
            row: rowNumber,
            email,
            reason:
              "Name and email are required.",
          });

          continue;
        }

        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        /*
        ==============================================
        DUPLICATE EMAIL INSIDE SAME FILE
        ==============================================
        */

        if (
          uploadedEmails.has(
            normalizedEmail,
          )
        ) {
          skippedRows.push({
            row: rowNumber,
            email: normalizedEmail,
            reason:
              "Duplicate email in uploaded file.",
          });

          continue;
        }

        uploadedEmails.add(
          normalizedEmail,
        );

        /*
        ==============================================
        STORE ROW
        ==============================================
        */

        normalizedRows.push({
          rowNumber,
          candidateId,
          name,
          email: normalizedEmail,
          phone,
          location,
          domain,
          targetRole,
          experience,
          plan,
          programDays,
          assignedSpecialist,
          startDate,
          endDate,
          status,
          notes,
        });
      }

      /*
      ==================================================
      FIND EXISTING CANDIDATES
      ==================================================
      */

      const emails =
        normalizedRows.map(
          (row) => row.email,
        );

      const existingCandidates =
        emails.length
          ? await db
              .collection("candidates")
              .find({
                email: {
                  $in: emails,
                },
              })
              .toArray()
          : [];

      const existingByEmail =
        new Map();

      existingCandidates.forEach(
        (candidate) => {
          existingByEmail.set(
            String(
              candidate.email || "",
            )
              .trim()
              .toLowerCase(),
            candidate,
          );
        },
      );

      /*
      ==================================================
      COUNT NEW CANDIDATES
      ==================================================
      */

      const newRows =
        normalizedRows.filter(
          (row) =>
            !existingByEmail.has(
              row.email,
            ),
        );

      /*
      ==================================================
      GENERATE IDs ONLY FOR NEW CANDIDATES
      ==================================================
      */

      const generatedIds =
        await generateImportCandidateIds(
          db,
          newRows.length,
        );

      let generatedIdIndex = 0;

      let created = 0;

      let updated = 0;

      const importedCandidates = [];

      /*
      ==================================================
      PROCESS EACH ROW
      ==================================================
      */

      for (
        const row of normalizedRows
      ) {
        const existing =
          existingByEmail.get(
            row.email,
          );

        /*
        ==============================================
        UPDATE EXISTING CANDIDATE
        ==============================================
        */

        if (existing) {
          const updateFields = {
            updatedAt: new Date(),
          };

          /*
          Only update values actually supplied
          by the Excel file.
          */

          if (row.name) {
            updateFields.name =
              row.name;
          }

          if (row.phone) {
            updateFields.phone =
              row.phone;
          }

          if (row.location) {
            updateFields.location =
              row.location;
          }

          if (row.domain) {
            updateFields.domain =
              row.domain;
          }

          if (row.targetRole) {
            updateFields.targetRole =
              row.targetRole;
          }

          if (row.experience) {
            updateFields.experience =
              row.experience;
          }

          if (row.plan) {
            const planInfo =
              getPlanCredits(
                row.plan,
              );

            updateFields.plan =
              planInfo.plan;

            updateFields.creditsTotal =
              planInfo.credits;

            const currentCreditsUsed =
              Number(
                existing.creditsUsed,
              ) || 0;

            updateFields.creditsRemaining =
              Math.max(
                planInfo.credits -
                  currentCreditsUsed,
                0,
              );
          }

          if (
            row.programDays !== ""
          ) {
            const days =
              Math.max(
                Number(
                  row.programDays,
                ) || 0,
                0,
              );

            updateFields.programDays =
              days;

            const existingHistory =
              Array.isArray(
                existing.applicationHistory,
              )
                ? existing.applicationHistory
                : [];

            const uniqueDates =
              new Set(
                existingHistory
                  .map(
                    (item) =>
                      String(
                        item?.date || "",
                      ).trim(),
                  )
                  .filter(Boolean),
              );

            updateFields.daysRemaining =
              Math.max(
                days -
                  uniqueDates.size,
                0,
              );
          }

          if (
            row.assignedSpecialist
          ) {
            updateFields.assignedSpecialist =
              row.assignedSpecialist;
          }

          if (row.startDate) {
            updateFields.startDate =
              row.startDate;
          }

          if (row.endDate) {
            updateFields.endDate =
              row.endDate;
          }

          if (row.status) {
            updateFields.status =
              row.status;
          }

          if (row.notes) {
            updateFields.notes =
              row.notes;
          }

          /*
          Preserve the existing candidate ID.
          */

          await db
            .collection("candidates")
            .updateOne(
              {
                _id: existing._id,
              },
              {
                $set: updateFields,
              },
            );

          const updatedCandidate = {
            ...existing,
            ...updateFields,
          };

          importedCandidates.push(
            updatedCandidate,
          );

          updated++;

          continue;
        }

        /*
        ==============================================
        CREATE NEW CANDIDATE
        ==============================================
        */

        const candidateId =
          row.candidateId ||
          generatedIds[
            generatedIdIndex
          ];

        generatedIdIndex++;

        const planInfo =
          getPlanCredits(
            row.plan,
          );

        const programDays =
          Math.max(
            Number(
              row.programDays,
            ) || 0,
            0,
          );

        const now =
          new Date();

        const newCandidate = {
          id: candidateId,

          name: row.name,

          email: row.email,

          phone: row.phone || "",

          location:
            row.location || "",

          domain:
            row.domain || "",

          targetRole:
            row.targetRole || "",

          experience:
            row.experience || "",

          plan:
            planInfo.plan,

          programDays,

          daysRemaining:
            programDays,

          creditsTotal:
            planInfo.credits,

          creditsRemaining:
            planInfo.credits,

          creditsUsed: 0,

          assignedSpecialist:
            row.assignedSpecialist ||
            "",

          startDate:
            row.startDate || "",

          endDate:
            row.endDate || "",

          status:
            row.status || "Active",

          notes:
            row.notes || "",

          monthly: [],

          reports: [],

          uploadedReports: [],

          uploadedMARReports: [],

          applicationHistory: [],

          feedback: [],

          activity: [],

          createdAt: now,

          updatedAt: now,
        };

        /*
        ==============================================
        INSERT
        ==============================================
        */

        try {
          const result =
            await db
              .collection(
                "candidates",
              )
              .insertOne(
                newCandidate,
              );

          const insertedCandidate = {
            ...newCandidate,

            _id:
              result.insertedId,
          };

          importedCandidates.push(
            insertedCandidate,
          );

          created++;
        } catch (insertError) {
          /*
          If the email became duplicated
          between the initial lookup and
          insert, report it instead of
          breaking the complete import.
          */

          if (
            insertError?.code ===
            11000
          ) {
            skippedRows.push({
              row:
                row.rowNumber,

              email:
                row.email,

              reason:
                "Candidate already exists.",
            });

            continue;
          }

          throw insertError;
        }
      }

      /*
      ==================================================
      DELETE TEMPORARY FILE
      ==================================================
      */

      deleteUploadedFile(
        req.file.path,
      );

      /*
      ==================================================
      RESPONSE
      ==================================================
      */

      const imported =
        created + updated;

      return res.status(200).json({
        success: true,

        message:
          `${created} candidate(s) created and ${updated} candidate(s) updated.`,

        imported,

        created,

        updated,

        skipped:
          skippedRows.length,

        skippedRows,

        data:
          importedCandidates,
      });
    } catch (error) {
      console.error(
        "Error importing candidates:",
        error,
      );

      deleteUploadedFile(
        req.file?.path,
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to import candidates.",
      });
    }
  },
);
/*
|--------------------------------------------------------------------------
| GET REPORTS
|--------------------------------------------------------------------------
|
| GET /api/candidates/:candidateId/reports
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId/reports",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        data:
          Array.isArray(
            candidate.uploadedReports,
          )
            ? candidate.uploadedReports
            : [],
      });
    } catch (error) {
      console.error(
        "Error fetching reports:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to fetch reports.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPLOAD REPORT / INTERVIEW CALL
|--------------------------------------------------------------------------
|
| POST /api/candidates/:candidateId/reports
|
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/reports",
  upload.single("file"),
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
        query,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        deleteUploadedFile(
          req.file?.path,
        );

        return res.status(404).json({
          message:
            "Candidate not found.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select a file.",
        });
      }

      const type = String(
        req.body.type || "",
      ).trim();

      const company = String(
        req.body.company || "",
      ).trim();

      const role = String(
        req.body.role || "",
      ).trim();

      const reportType = String(
        req.body.reportType || "",
      ).trim();

      /*
      VALIDATE TYPE
      */

      if (
        type !== "Interview Call" &&
        type !== "Report"
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          message:
            "Please select Interview Call or Report.",
        });
      }

      /*
      INTERVIEW CALL
      */

      if (
        type === "Interview Call"
      ) {
        if (
          !req.file.mimetype.startsWith(
            "image/",
          )
        ) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            message:
              "Interview Call upload must be an image.",
          });
        }

        if (!company) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            message:
              "Company name is required.",
          });
        }

        if (!role) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            message:
              "Role is required.",
          });
        }
      }

      /*
      REPORT
      */

      if (type === "Report") {
        if (
          req.file.mimetype !==
          "application/pdf"
        ) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            message:
              "Report upload must be a PDF file.",
          });
        }

        if (!reportType) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            message:
              "Please select a report type.",
          });
        }

        const allowedReportTypes = [
          "15 Days Report",
          "Monthly Report",
          "Final Report",
        ];

        if (
          !allowedReportTypes.includes(
            reportType,
          )
        ) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            message:
              "Invalid report type.",
          });
        }
      }

      /*
      CREATE REPORT
      */

      const newReport = {
        id: new ObjectId().toString(),

        date: new Date()
          .toISOString()
          .split("T")[0],

        type,

        company:
          type === "Interview Call"
            ? company
            : "",

        role:
          type === "Interview Call"
            ? role
            : "",

        reportType:
          type === "Report"
            ? reportType
            : "",

        fileName:
          req.file.originalname,

        fileUrl:
          `/uploads/${req.file.filename}`,

        fileType:
          req.file.mimetype,

       uploadedBy: String(
  req.body.uploadedBy || ""
).trim(),

  

        createdAt: new Date(),
      };

      /*
      SAVE
      */

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $push: {
              uploadedReports:
                newReport,
            },

            $set: {
              updatedAt:
                new Date(),
            },
          },
        );

      return res.status(201).json({
        success: true,

        data: newReport,
      });
    } catch (error) {
      console.error(
        "Error uploading report:",
        error,
      );

      deleteUploadedFile(
        req.file?.path,
      );

      return res.status(500).json({
        message:
          "Failed to upload file.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET DAILY MAR REPORTS
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId/mar",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        data:
          Array.isArray(
            candidate.uploadedMARReports,
          )
            ? candidate.uploadedMARReports
            : [],
      });
    } catch (error) {
      console.error(
        "Error fetching MAR reports:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to fetch MAR reports.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPLOAD DAILY MAR REPORT
|--------------------------------------------------------------------------
|
| TXT / PDF
|
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/mar",
  upload.single("file"),
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
        query,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        deleteUploadedFile(
          req.file?.path,
        );

        return res.status(404).json({
          message:
            "Candidate not found.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select a MAR file.",
        });
      }

      const extension = path
        .extname(
          req.file.originalname,
        )
        .toLowerCase();

      const allowedExtensions = [
        ".txt",
        ".pdf",
      ];

      if (
        !allowedExtensions.includes(
          extension,
        )
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          message:
            "Daily MAR Report must be a .txt or PDF file.",
        });
      }

      const fileFormat =
        extension === ".pdf"
          ? "PDF"
          : "TXT";

      const newMARReport = {
        id: new ObjectId().toString(),

        date: new Date()
          .toISOString()
          .split("T")[0],

        fileName:
          req.file.originalname,

        fileUrl:
          `/uploads/${req.file.filename}`,

        fileType:
          req.file.mimetype,

        fileFormat,
updatedBy:
  String(req.body.updatedBy || "").trim(),
        createdAt: new Date(),
      };

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $push: {
              uploadedMARReports:
                newMARReport,
            },

            $set: {
              updatedAt:
                new Date(),
            },
          },
        );

      return res.status(201).json({
        success: true,

        data: newMARReport,
      });
    } catch (error) {
      console.error(
        "Error uploading MAR report:",
        error,
      );

      deleteUploadedFile(
        req.file?.path,
      );

      return res.status(500).json({
        message:
          "Failed to upload MAR report.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET CANDIDATE ACTIVITY
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| PROGRAM ACTIVITY
|--------------------------------------------------------------------------
|
| Program Activity is used to record meetings and interactions
| with a candidate.
|
| Stored inside candidate:
|
| programActivities: []
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET PROGRAM ACTIVITIES
|--------------------------------------------------------------------------
|
| GET /api/candidates/:candidateId/program-activities
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId/program-activities",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }

      const programActivities =
        Array.isArray(
          candidate.programActivities,
        )
          ? candidate.programActivities
          : [];

      /*
      Sort newest activity first.
      */

      const sortedActivities =
        [...programActivities].sort(
          (first, second) => {
            const firstDate =
              new Date(
                first?.date ||
                  first?.createdAt ||
                  0,
              ).getTime();

            const secondDate =
              new Date(
                second?.date ||
                  second?.createdAt ||
                  0,
              ).getTime();

            return secondDate - firstDate;
          },
        );

      return res.status(200).json({
        success: true,

        data: sortedActivities,
      });
    } catch (error) {
      console.error(
        "Error fetching program activities:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch program activities.",
      });
    }
  },
);


/*
|--------------------------------------------------------------------------
| ADD PROGRAM ACTIVITY
|--------------------------------------------------------------------------
|
| POST /api/candidates/:candidateId/program-activities
|
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/program-activities",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
        query,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }

      const {
        date,
        activityType,
        conductedBy,
        subject,
        notes,
        nextSteps,
      } = req.body || {};


      /*
      --------------------------------------------------
      VALIDATE DATE
      --------------------------------------------------
      */

      const activityDate =
        typeof date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
          date,
        )
          ? date
          : getTodayDate();


      /*
      --------------------------------------------------
      VALIDATE ACTIVITY TYPE
      --------------------------------------------------
      */

      const allowedActivityTypes = [
        "Candidate Meeting",
        "Progress Review",
        "Follow-up Call",
        "Program Discussion",
        "Other",
      ];

      const normalizedActivityType =
        String(
          activityType || "",
        ).trim();

      if (
        !allowedActivityTypes.includes(
          normalizedActivityType,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please select a valid activity type.",
        });
      }


      /*
      --------------------------------------------------
      CONDUCTED BY
      --------------------------------------------------
      */

      const normalizedConductedBy =
        String(
          conductedBy || "",
        ).trim();

      if (!normalizedConductedBy) {
        return res.status(400).json({
          success: false,

          message:
            "Conducted By is required.",
        });
      }


      /*
      --------------------------------------------------
      SUBJECT
      --------------------------------------------------
      */

      const normalizedSubject =
        String(
          subject || "",
        ).trim();

      if (!normalizedSubject) {
        return res.status(400).json({
          success: false,

          message:
            "Subject is required.",
        });
      }


      /*
      --------------------------------------------------
      MEETING REPORT / NOTES
      --------------------------------------------------
      */

      const normalizedNotes =
        String(
          notes || "",
        ).trim();

      if (!normalizedNotes) {
        return res.status(400).json({
          success: false,

          message:
            "Meeting report is required.",
        });
      }


      /*
      --------------------------------------------------
      NEXT STEPS
      --------------------------------------------------
      */

      const normalizedNextSteps =
        String(
          nextSteps || "",
        ).trim();


      /*
      --------------------------------------------------
      CREATE ACTIVITY
      --------------------------------------------------
      */

      const newProgramActivity = {
        id:
          new ObjectId().toString(),

        date:
          activityDate,

        activityType:
          normalizedActivityType,

        conductedBy:
          normalizedConductedBy,

        subject:
          normalizedSubject,

        notes:
          normalizedNotes,

        nextSteps:
          normalizedNextSteps,

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      };


      /*
      --------------------------------------------------
      SAVE ACTIVITY
      --------------------------------------------------
      */

      const result =
        await db
          .collection("candidates")
          .findOneAndUpdate(
            query,
            {
              $push: {
                programActivities:
                  newProgramActivity,
              },

              $set: {
                updatedAt:
                  new Date(),
              },
            },
            {
              returnDocument:
                "after",
            },
          );


      if (!result) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }


      /*
      --------------------------------------------------
      SUCCESS
      --------------------------------------------------
      */

      return res.status(201).json({
        success: true,

        message:
          "Program activity added successfully.",

        data:
          newProgramActivity,
      });
    } catch (error) {
      console.error(
        "Error adding program activity:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to add program activity.",
      });
    }
  },
);


/*
|--------------------------------------------------------------------------
| DELETE PROGRAM ACTIVITY
|--------------------------------------------------------------------------
|
| DELETE /api/candidates/:candidateId/program-activities/:activityId
|
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId/program-activities/:activityId",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
        query,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }


      /*
      --------------------------------------------------
      GET EXISTING ACTIVITIES
      --------------------------------------------------
      */

      const activities =
        Array.isArray(
          candidate.programActivities,
        )
          ? candidate.programActivities
          : [];


      const activityId =
        String(
          req.params.activityId,
        );


      /*
      --------------------------------------------------
      FIND ACTIVITY
      --------------------------------------------------
      */

      const activity =
        activities.find(
          (item) =>
            String(
              item?.id ||
                item?._id ||
                "",
            ) === activityId,
        );


      if (!activity) {
        return res.status(404).json({
          success: false,

          message:
            "Program activity not found.",
        });
      }


      /*
      --------------------------------------------------
      REMOVE ACTIVITY
      --------------------------------------------------
      */

      const updatedActivities =
        activities.filter(
          (item) =>
            String(
              item?.id ||
                item?._id ||
                "",
            ) !== activityId,
        );


      /*
      --------------------------------------------------
      UPDATE DATABASE
      --------------------------------------------------
      */

      const result =
        await db
          .collection("candidates")
          .updateOne(
            query,
            {
              $set: {
                programActivities:
                  updatedActivities,

                updatedAt:
                  new Date(),
              },
            },
          );


      if (
        result.modifiedCount === 0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Program activity could not be deleted.",
        });
      }


      /*
      --------------------------------------------------
      SUCCESS
      --------------------------------------------------
      */

      return res.json({
        success: true,

        message:
          "Program activity deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Error deleting program activity:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to delete program activity.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE CANDIDATE STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/candidates/:candidateId/status
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:candidateId/status",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        status,
      } = req.body || {};

      const allowedStatuses = [
        "Active",
        "Completed",
        "Expiring Soon",
        "Paused",
      ];

      if (
        !allowedStatuses.includes(
          status,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid candidate status.",
        });
      }

      const query =
        getCandidateQuery(
          req.params.candidateId,
        );

      const result =
        await db
          .collection("candidates")
          .findOneAndUpdate(
            query,
            {
              $set: {
                status,

                updatedAt:
                  new Date(),
              },
            },
            {
              returnDocument: "after",
            },
          );

      if (!result) {
        return res.status(404).json({
          message:
            "Candidate not found.",
        });
      }

      return res.json(result);
    } catch (error) {
      console.error(
        "Error updating status:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to update candidate status.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET APPLICATION HISTORY
|--------------------------------------------------------------------------
|
| GET /api/candidates/:candidateId/applications
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId/applications",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }

      const applicationHistory =
        Array.isArray(
          candidate.applicationHistory,
        )
          ? [
              ...candidate.applicationHistory,
            ]
          : [];

      applicationHistory.sort(
        (first, second) =>
          new Date(
            second.date,
          ).getTime() -
          new Date(
            first.date,
          ).getTime(),
      );

      const creditsTotal =
        Number(
          candidate.creditsTotal,
        ) || 0;

      const creditsRemaining =
        Number.isFinite(
          Number(
            candidate.creditsRemaining,
          ),
        )
          ? Number(
              candidate.creditsRemaining,
            )
          : creditsTotal;

      const creditsUsed =
        Number.isFinite(
          Number(
            candidate.creditsUsed,
          ),
        )
          ? Number(
              candidate.creditsUsed,
            )
          : creditsTotal -
            creditsRemaining;

      return res.status(200).json({
        success: true,

        data: applicationHistory,

        creditsTotal,

        creditsUsed,

        creditsRemaining,
      });
    } catch (error) {
      console.error(
        "Error getting application history:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load application history.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| ADD APPLICATIONS
|--------------------------------------------------------------------------
|
| POST /api/candidates/:candidateId/applications
|
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/applications",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        applications,
        date,
        updatedBy,
      } = req.body || {};

      const applicationCount =
        Number(applications);

      if (
        !Number.isFinite(
          applicationCount,
        ) ||
        applicationCount <= 0 ||
        !Number.isInteger(
          applicationCount,
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Applications must be a whole number greater than 0.",
        });
      }

      const {
        candidate,
        query,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

      if (!candidate) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }

      const creditsTotal =
        Number(
          candidate.creditsTotal,
        ) || 0;

      const applicationHistory =
        Array.isArray(
          candidate.applicationHistory,
        )
          ? [
              ...candidate.applicationHistory,
            ]
          : [];

      const previousApplicationsUsed =
        applicationHistory.reduce(
          (total, item) =>
            total +
            (
              Number(
                item.applications,
              ) || 0
            ),
          0,
        );

      const storedCreditsRemaining =
        Number(
          candidate.creditsRemaining,
        );

      const currentCreditsRemaining =
        Number.isFinite(
          storedCreditsRemaining,
        )
          ? storedCreditsRemaining
          : Math.max(
              creditsTotal -
                previousApplicationsUsed,
              0,
            );

      if (
        applicationCount >
        currentCreditsRemaining
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Only ${currentCreditsRemaining} application credits are remaining.`,
        });
      }

      const applicationDate =
        typeof date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
          date,
        )
          ? date
          : getTodayDate();

      /*
      CREATE NEW HISTORY ENTRY
      */

      const savedEntry = {
        id:
          generateApplicationId(),

        date:
          applicationDate,

        applications:
          applicationCount,

        updatedBy:
          String(
            updatedBy ||
              candidate.owner ||
              candidate.assignedSpecialist ||
              "Unassigned",
          ).trim(),

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      };

      /*
      DO NOT MERGE SAME-DAY ENTRIES
      */

      applicationHistory.push(
        savedEntry,
      );

      /*
      RECALCULATE USED CREDITS
      */

      const creditsUsed =
        applicationHistory.reduce(
          (total, item) =>
            total +
            (
              Number(
                item.applications,
              ) || 0
            ),
          0,
        );

      const creditsRemaining =
        Math.max(
          creditsTotal -
            creditsUsed,
          0,
        );

        /*
|--------------------------------------------------------------------------
| RECALCULATE PROGRAM DAYS
|--------------------------------------------------------------------------
*/

const daysRemaining =
  calculateDaysRemaining({
    ...candidate,
    applicationHistory,
  });

      /*
      UPDATE DATABASE
      */

      const result =
        await db
          .collection("candidates")
          .findOneAndUpdate(
            query,
            {
              $set: {
  applicationHistory,

  creditsUsed,

  creditsRemaining,

  daysRemaining,

  updatedAt:
    new Date(),
},
            },
            {
              returnDocument: "after",
            },
          );

      if (!result) {
        return res.status(404).json({
          success: false,

          message:
            "Candidate not found.",
        });
      }

      return res.status(201).json({
  success: true,

  message:
    "Applications updated successfully.",

  data: savedEntry,

  creditsTotal,

  creditsUsed,

  creditsRemaining,

  daysRemaining,
});
    } catch (error) {
      console.error(
        "Error saving applications:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to save applications.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET SINGLE CANDIDATE
|--------------------------------------------------------------------------
|
| GET /api/candidates/:candidateId
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId",
  async (req, res) => {
    try {
      const db = getDatabase();

      const {
        candidate,
      } = await findCandidate(
        db,
        req.params.candidateId,
      );

     if (!candidate) {
  return res.status(404).json({
    message:
      "Candidate not found.",
  });
}

const candidateWithDays = {
  ...candidate,

  daysRemaining:
    calculateDaysRemaining(
      candidate,
    ),
};

return res.json(
  candidateWithDays,
);
    } catch (error) {
      console.error(
        "Error fetching candidate:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to fetch candidate.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE CANDIDATE HANDLER
|--------------------------------------------------------------------------
*/

async function updateCandidateHandler(
  req,
  res,
) {
  try {
    const db = getDatabase();

    const query =
      getCandidateQuery(
        req.params.candidateId,
      );

    const existingCandidate =
      await db
        .collection("candidates")
        .findOne(query);

    if (!existingCandidate) {
      return res.status(404).json({
        success: false,

        message:
          "Candidate not found.",
      });
    }

    const updates = {
      ...req.body,

      updatedAt: new Date(),
    };

    /*
    Prevent ID changes.
    */

    delete updates._id;
    delete updates.id;

    /*
    Normalize email.
    */

    if (
      updates.email !==
      undefined
    ) {
      updates.email =
        String(
          updates.email,
        )
          .trim()
          .toLowerCase();
    }

    /*
    If plan is changed,
    automatically update credits.
    */

    if (
      updates.plan !==
      undefined
    ) {
      const {
        plan,
        credits,
      } =
        getPlanCredits(
          updates.plan,
        );

      updates.plan = plan;

      /*
      Only reset credits when
      the plan actually changes.
      */

      if (
        String(
          existingCandidate.plan ||
            "",
        ) !== plan
      ) {
        updates.creditsTotal =
          credits;

        updates.creditsRemaining =
          credits;

        updates.creditsUsed =
          0;

        updates.applicationHistory =
          [];

          updates.daysRemaining =
  Number(
    updates.programDays ??
      existingCandidate.programDays,
  ) || 0;
      }
    }


    if (updates.programDays !== undefined) {
  updates.programDays = Math.max(
    Number(updates.programDays) || 0,
    0,
  );

  const candidateWithUpdatedProgramDays = {
    ...existingCandidate,
    ...updates,
  };

  updates.daysRemaining =
    calculateDaysRemaining(
      candidateWithUpdatedProgramDays,
    );
}

    const result =
      await db
        .collection("candidates")
        .findOneAndUpdate(
          query,
          {
            $set: updates,
          },
          {
            returnDocument: "after",
          },
        );

    if (!result) {
      return res.status(404).json({
        success: false,

        message:
          "Candidate not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Candidate updated successfully.",

      data: result,
    });
  } catch (error) {
    console.error(
      "Error updating candidate:",
      error,
    );

    if (
      error?.code === 11000
    ) {
      return res.status(400).json({
        success: false,

        message:
          "A candidate with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to update candidate.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| PUT UPDATE
|--------------------------------------------------------------------------
*/

router.put(
  "/:candidateId",
  updateCandidateHandler,
);

/*
|--------------------------------------------------------------------------
| PATCH UPDATE
|--------------------------------------------------------------------------
*/

router.patch(
  "/:candidateId",
  updateCandidateHandler,
);

/* ============================================================
   DELETE CANDIDATE
   DELETE /api/candidates/:candidateId
============================================================ */

router.delete(
  "/:candidateId",
  async (req, res) => {
    try {
      const db = getDatabase();

      const candidateId = String(
        req.params.candidateId || "",
      ).trim();

      console.log(
        "=================================",
      );

      console.log(
        "DELETE CANDIDATE REQUEST",
      );

      console.log(
        "Candidate ID:",
        candidateId,
      );

      if (!candidateId) {
        return res.status(400).json({
          success: false,
          message:
            "Candidate ID is required.",
        });
      }

      /*
      Build candidate query.

      Your candidates can use either:
      - MongoDB _id
      - custom id
      */

      let query;

      if (
        ObjectId.isValid(candidateId)
      ) {
        query = {
          _id: new ObjectId(
            candidateId,
          ),
        };
      } else {
        query = {
          id: candidateId,
        };
      }

      console.log(
        "Delete query:",
        query,
      );

      /*
      First check whether candidate exists.
      */

      const candidate =
        await db
          .collection("candidates")
          .findOne(query);

      if (!candidate) {
        console.log(
          "Candidate not found:",
          candidateId,
        );

        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      /*
      Delete candidate.
      */

      const result =
        await db
          .collection("candidates")
          .deleteOne(query);

      if (
        result.deletedCount !== 1
      ) {
        console.log(
          "Candidate deletion failed:",
          candidateId,
        );

        return res.status(500).json({
          success: false,
          message:
            "Candidate could not be deleted.",
        });
      }

      console.log(
        "Candidate deleted successfully:",
        candidateId,
      );

      console.log(
        "=================================",
      );

      return res.status(200).json({
        success: true,

        message:
          "Candidate deleted successfully.",

        deletedCount:
          result.deletedCount,

        candidateId:
          candidateId,
      });
    } catch (error) {
      console.error(
        "ERROR DELETING CANDIDATE:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to delete candidate.",

        error:
          error?.message ||
          "Unknown server error.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE CANDIDATE
|--------------------------------------------------------------------------
|
| DELETE /api/candidates/:candidateId
|
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| DELETE DAILY MAR REPORT
|--------------------------------------------------------------------------
|
| DELETE /api/candidates/:candidateId/mar/:reportId
|
| Deletes one MAR report from the candidate's uploadedMARReports array.
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId/mar/:reportId",
  async (req, res) => {
    try {
      const db = getDatabase();
      const query = getCandidateQuery(req.params.candidateId);

      const candidate = await db
        .collection("candidates")
        .findOne(query);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found.",
        });
      }

      const reports = Array.isArray(candidate.uploadedMARReports)
        ? candidate.uploadedMARReports
        : [];

      const reportId = String(req.params.reportId);

      const report = reports.find(
        (item) =>
          String(item?.id || item?._id || "") === reportId,
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "MAR report not found.",
        });
      }

      const updatedReports = reports.filter(
        (item) =>
          String(item?.id || item?._id || "") !== reportId,
      );

      const result = await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $set: {
              uploadedMARReports: updatedReports,
              updatedAt: new Date(),
            },
          },
        );

      if (result.modifiedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "MAR report could not be deleted.",
        });
      }

      // Delete the physical uploaded file as well.
      if (report.fileUrl) {
        const relativePath = String(report.fileUrl)
          .replace(/^\/+/, "")
          .replace(/^uploads[\\/]/, "");

        deleteUploadedFile(
          path.join(uploadsDirectory, relativePath),
        );
      }

      return res.json({
        success: true,
        message: "MAR report deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting MAR report:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete MAR report.",
      });
    }
  },
);


/*
|--------------------------------------------------------------------------
| DELETE REPORT / INTERVIEW CALL
|--------------------------------------------------------------------------
|
| DELETE /api/candidates/:candidateId/reports/:reportId
|
| Deletes one item from the candidate's uploadedReports array.
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId/reports/:reportId",
  async (req, res) => {
    try {
      const db = getDatabase();
      const query = getCandidateQuery(req.params.candidateId);

      const candidate = await db
        .collection("candidates")
        .findOne(query);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found.",
        });
      }

      const reports = Array.isArray(candidate.uploadedReports)
        ? candidate.uploadedReports
        : [];

      const reportId = String(req.params.reportId);

      const report = reports.find(
        (item) =>
          String(item?.id || item?._id || "") === reportId,
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found.",
        });
      }

      const updatedReports = reports.filter(
        (item) =>
          String(item?.id || item?._id || "") !== reportId,
      );

      const result = await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $set: {
              uploadedReports: updatedReports,
              updatedAt: new Date(),
            },
          },
        );

      if (result.modifiedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Report could not be deleted.",
        });
      }

      // Delete the physical uploaded file as well.
      if (report.fileUrl) {
        const relativePath = String(report.fileUrl)
          .replace(/^\/+/, "")
          .replace(/^uploads[\\/]/, "");

        deleteUploadedFile(
          path.join(uploadsDirectory, relativePath),
        );
      }

      return res.json({
        success: true,
        message: "Report deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting report:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete report.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| MULTER ERROR HANDLER
|--------------------------------------------------------------------------
*/

router.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        message:
          error.code ===
          "LIMIT_FILE_SIZE"
            ? "File is too large. Maximum allowed size is 20MB."
            : error.message,
      });
    }

    return next(error);
  },
);

export default router;