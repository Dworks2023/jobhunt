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
| HELPER - GET HIGHEST CANDIDATE NUMBER
|--------------------------------------------------------------------------
|
| Finds the highest existing CD_XX candidate ID.
|
| Example:
|
| CD_01
| CD_02
| CD_06
|
| Highest = 6
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
|
| Generates:
|
| CD_01
| CD_02
| CD_03
| CD_04
|
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
|
| IMPORTANT:
|
| 100 Applications  = 100 credits
| 250 Applications  = 250 credits
| 500 Applications  = 500 credits
| 1000 Applications = 1000 credits
|
|--------------------------------------------------------------------------
*/

function getPlanCredits(plan) {
  const rawPlan = String(
    plan || "",
  ).trim();

  /*
  Extract the plan number.
  */

  const planNumber =
    rawPlan.match(
      /(?:^|\s)(100|250|500|1000)(?:\s|$)/,
    )?.[1] ||
    rawPlan.match(
      /^(100|250|500|1000)$/,
    )?.[1] ||
    "100";

  const planCredits = {
    "100": 100,
    "250": 250,
    "500": 500,
    "1000": 1000,
  };

  const credits =
    planCredits[planNumber] ?? 100;

  return {
    plan: `${planNumber} Applications`,
    credits,
  };
}

/*
|--------------------------------------------------------------------------
| HELPER - NORMALIZE IMPORT VALUE
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| HELPER - NORMALIZE EXCEL DATE
|--------------------------------------------------------------------------
|
| The Add Candidate flow stores the date as YYYY-MM-DD.
| Excel can return a real Date object when cellDates=true, which
| otherwise becomes a value such as:
| "Sun Sep 27 2026 23:59:50 GMT+0530 ..."
|
| Always convert imported dates to YYYY-MM-DD before saving.
|--------------------------------------------------------------------------
*/

function normalizeExcelDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  /*
  ------------------------------------------------------------
  EXCEL SERIAL DATE
  ------------------------------------------------------------

  Excel stores dates as numbers.

  Example:
  46293 = 09/28/2026

  Do NOT use:
  XLSX.SSF.parse_date_code()

  because some XLSX versions do not expose XLSX.SSF.

  Instead, convert the Excel serial number directly.
  ------------------------------------------------------------
  */
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    const excelEpoch =
      Date.UTC(1899, 11, 30);

    const milliseconds =
      value * 24 * 60 * 60 * 1000;

    const date =
      new Date(
        excelEpoch + milliseconds,
      );

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
      const year =
        date.getUTCFullYear();

      const month =
        String(
          date.getUTCMonth() + 1,
        ).padStart(2, "0");

      const day =
        String(
          date.getUTCDate(),
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  }

  /*
  ------------------------------------------------------------
  JAVASCRIPT DATE OBJECT
  ------------------------------------------------------------
  */

  if (value instanceof Date) {
    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return "";
    }

    const year =
      value.getFullYear();

    const month =
      String(
        value.getMonth() + 1,
      ).padStart(2, "0");

    const day =
      String(
        value.getDate(),
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /*
  ------------------------------------------------------------
  STRING DATE
  ------------------------------------------------------------
  */

  const raw =
    String(value).trim();

  if (!raw) {
    return "";
  }

  /*
  Already YYYY-MM-DD
  */

  const yyyyMmDd =
    raw.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (yyyyMmDd) {
    return (
      `${yyyyMmDd[1]}-${yyyyMmDd[2]}-${yyyyMmDd[3]}`
    );
  }

  /*
  MM/DD/YYYY
  */

  const mmDdYyyy =
    raw.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    );

  if (mmDdYyyy) {
    const month =
      String(
        Number(mmDdYyyy[1]),
      ).padStart(2, "0");

    const day =
      String(
        Number(mmDdYyyy[2]),
      ).padStart(2, "0");

    const year =
      mmDdYyyy[3];

    return `${year}-${month}-${day}`;
  }

  /*
  ISO DATE/TIME

  Example:
  2026-09-28T00:00:00
  */

  const isoDate =
    raw.match(
      /^(\d{4})-(\d{2})-(\d{2})T/,
    );

  if (isoDate) {
    return (
      `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`
    );
  }

  /*
  JavaScript date string

  Example:
  Sun Sep 27 2026 23:59:50 GMT+0530
  */

  const parsed =
    new Date(raw);

  if (
    !Number.isNaN(
      parsed.getTime(),
    )
  ) {
    const year =
      parsed.getFullYear();

    const month =
      String(
        parsed.getMonth() + 1,
      ).padStart(2, "0");

    const day =
      String(
        parsed.getDate(),
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /*
  Unknown format.
  Return the original value rather
  than crashing the import.
  */

  return raw;
}

function normalizeImportValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
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

  const year =
    today.getFullYear();

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
*/

function calculateDaysRemaining(
  candidate,
) {
  const programDays =
    Number(
      candidate.programDays,
    ) || 0;

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
          String(
            item?.date || "",
          ).trim(),
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

router.get(
  "/",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const candidates =
        await db
          .collection(
            "candidates",
          )
          .find({})
          .sort({
            createdAt: 1,
            _id: 1,
          })
          .toArray();

      const candidatesWithDays =
        candidates.map(
          (candidate) => ({
            ...candidate,

            daysRemaining:
              calculateDaysRemaining(
                candidate,
              ),
          }),
        );

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
  },
);

/*
|--------------------------------------------------------------------------
| CREATE CANDIDATE
|--------------------------------------------------------------------------
|
| POST /api/candidates
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const body =
        req.body || {};

      /*
      PLAN → CREDITS

      Backend calculates credits
      from the selected plan.

      This prevents frontend values
      such as 250 from accidentally
      being stored for a 100-plan.
      */

      const {
        plan: selectedPlan,
        credits: creditsTotal,
      } =
        getPlanCredits(
          body.plan,
        );

      const creditsRemaining =
        creditsTotal;

      const programDays =
        Math.max(
          Number(
            body.programDays,
          ) || 0,
          0,
        );

      /*
      ------------------------------------------------
      IMPORTANT ID FIX
      ------------------------------------------------

      DO NOT use body.id here.

      Older frontend data may send:
      CAND-0001

      We always generate:
      CD_01
      CD_02
      CD_03
      etc.
      */

      const candidateId =
        await generateCandidateId(
          db,
        );

      const now =
        new Date();

      /*
      ------------------------------------------------
      CREATE CANDIDATE
      ------------------------------------------------
      */

      const newCandidate = {
        ...body,

        /*
        Backend-generated ID.
        */
        id: candidateId,

        /*
        Backend-normalized plan.
        */
        plan: selectedPlan,

        programDays,

        daysRemaining:
          programDays,

        /*
        Backend-calculated credits.
        */
        creditsTotal,

        creditsRemaining,

        /*
        New candidate always starts
        with zero used credits.
        */
        creditsUsed: 0,

        monthly:
          Array.isArray(
            body.monthly,
          )
            ? body.monthly
            : [],

        reports:
          Array.isArray(
            body.reports,
          )
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
          Array.isArray(
            body.feedback,
          )
            ? body.feedback
            : [],

        activity:
          Array.isArray(
            body.activity,
          )
            ? body.activity
            : [],

        createdAt: now,

        updatedAt: now,
      };

      const result =
        await db
          .collection(
            "candidates",
          )
          .insertOne(
            newCandidate,
          );

      return res
        .status(201)
        .json({
          ...newCandidate,

          _id:
            result.insertedId,
        });
    } catch (error) {
      console.error(
        "Error creating candidate:",
        error,
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A candidate with this email or ID already exists.",
          });
      }

      return res
        .status(500)
        .json({
          message:
            "Failed to create candidate.",
        });
    }
  },
);

/*
|--------------------------------------------------------------------------
| IMPORT CANDIDATES FROM EXCEL / CSV
|--------------------------------------------------------------------------
|
| POST /api/candidates/import
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
      ============================================================
      FILE VALIDATION
      ============================================================
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
        !allowedExtensions.includes(
          extension,
        )
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          success: false,
          message:
            "Only .xlsx, .xls, and .csv files are supported.",
        });
      }

      /*
      ============================================================
      READ EXCEL / CSV
      ============================================================
      */

      const workbook = XLSX.read(
        req.file.path,
        {
          type: "file",
          cellDates: false,
          cellNF: true,
        },
      );

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {
        deleteUploadedFile(
          req.file.path,
        );

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
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          success: false,
          message:
            "The uploaded Excel file is empty.",
        });
      }

      /*
      ============================================================
      HEADER NORMALIZATION
      ============================================================
      */

      function normalizeHeader(
        value,
      ) {
        return String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      }

      function getColumnValue(
        row,
        aliases,
        preserveType = false,
      ) {
        const normalizedRow = {};

        Object.keys(row).forEach(
          (key) => {
            normalizedRow[
              normalizeHeader(key)
            ] = row[key];
          },
        );

        for (
          const alias of aliases
        ) {
          const normalizedAlias =
            normalizeHeader(
              alias,
            );

          if (
            Object.prototype.hasOwnProperty.call(
              normalizedRow,
              normalizedAlias,
            )
          ) {
            const value =
              normalizedRow[
                normalizedAlias
              ];

            if (
              value !== null &&
              value !== undefined &&
              String(value).trim() !==
                ""
            ) {
              if (preserveType) {
                return value;
              }

              return String(
                value,
              ).trim();
            }
          }
        }

        return "";
      }

      /*
      ============================================================
      PLAN → CREDITS
      ============================================================
      */

      function getImportedPlanCredits(
        planValue,
      ) {
        const rawPlan = String(
          planValue || "",
        )
          .trim()
          .toLowerCase();

        if (
          rawPlan.includes("1000")
        ) {
          return {
            plan:
              "1000 Applications",
            credits: 1000,
          };
        }

        if (
          rawPlan.includes("500")
        ) {
          return {
            plan:
              "500 Applications",
            credits: 500,
          };
        }

        if (
          rawPlan.includes("250")
        ) {
          return {
            plan:
              "250 Applications",
            credits: 250,
          };
        }

        /*
        Default to 100 applications.
        */

        return {
          plan:
            "100 Applications",
          credits: 100,
        };
      }

      /*
      ============================================================
      FIND HIGHEST CD_XX ID
      ============================================================
      */

      async function getHighestCDNumber() {
        const existingCandidates =
          await db
            .collection(
              "candidates",
            )
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

        existingCandidates.forEach(
          (candidate) => {
            const candidateId =
              String(
                candidate.id || "",
              ).trim();

            const match =
              candidateId.match(
                /^CD_(\d+)$/i,
              );

            if (match) {
              const number =
                Number(
                  match[1],
                );

              if (
                Number.isFinite(
                  number,
                ) &&
                number >
                  highestNumber
              ) {
                highestNumber =
                  number;
              }
            }
          },
        );

        return highestNumber;
      }

      /*
      ============================================================
      GET EXISTING EMAILS
      ============================================================
      */

      const existingCandidates =
        await db
          .collection(
            "candidates",
          )
          .find(
            {},
            {
              projection: {
                email: 1,
                id: 1,
              },
            },
          )
          .toArray();

      const existingEmails =
        new Set(
          existingCandidates
            .map(
              (candidate) =>
                String(
                  candidate.email ||
                    "",
                )
                  .trim()
                  .toLowerCase(),
            )
            .filter(Boolean),
        );

      /*
      ============================================================
      PROCESS EXCEL ROWS
      ============================================================
      */

      const candidatesToInsert =
        [];

      const skippedRows = [];

      const uploadedEmails =
        new Set();

      let nextCandidateNumber =
        await getHighestCDNumber();

      for (
        let index = 0;
        index < rows.length;
        index++
      ) {
        const row =
          rows[index];

        const excelRowNumber =
          index + 2;

        /*
        ----------------------------------------------------------
        SUPPORT MULTIPLE EXCEL HEADER NAMES
        ----------------------------------------------------------
        */

        const name =
          getColumnValue(row, [
            "name",
            "fullname",
            "candidate name",
            "candidate_name",
            "candidateName",
          ]);

        const email =
          getColumnValue(row, [
            "email",
            "emailaddress",
            "email address",
            "candidate email",
            "candidate_email",
            "candidateEmail",
          ]);

        const phone =
          getColumnValue(row, [
            "phone",
            "phonenumber",
            "phone number",
            "mobile",
            "mobile number",
          ]);

        const location =
          getColumnValue(row, [
            "location",
            "city",
            "citystate",
            "city state",
          ]);

        const domain =
          getColumnValue(row, [
            "domain",
            "industry",
          ]);

        const targetRole =
          getColumnValue(row, [
            "targetrole",
            "target role",
            "role",
            "jobrole",
            "job role",
          ]);

        const experience =
          getColumnValue(row, [
            "experience",
            "years of experience",
            "yearsofexperience",
          ]);

        const planValue =
          getColumnValue(row, [
            "plan",
            "application plan",
            "applicationplan",
          ]);

        const programDaysValue =
          getColumnValue(row, [
            "programdays",
            "program days",
            "duration",
            "days",
          ]);

        const assignedSpecialist =
          getColumnValue(row, [
            "assignedspecialist",
            "assigned specialist",
            "specialist",
            "assignedexpert",
            "assigned expert",
          ]);

        const startDateRaw =
          getColumnValue(
            row,
            [
              "startdate",
              "start date",
              "programstartdate",
              "program start date",
            ],
            true,
          );

        // IMPORTANT:
        // Normalize Excel dates to the same YYYY-MM-DD format
        // used by Add Candidate before saving to MongoDB.
        const startDate =
          normalizeExcelDate(startDateRaw);

        const status =
          getColumnValue(row, [
            "status",
          ]) ||
          "Active";

        const notes =
          getColumnValue(row, [
            "notes",
            "note",
          ]);

        /*
        ----------------------------------------------------------
        REQUIRED FIELD VALIDATION
        ----------------------------------------------------------
        */

        if (!name) {
          skippedRows.push({
            row:
              excelRowNumber,
            email,
            reason:
              "Candidate name is missing.",
          });

          continue;
        }

        if (!email) {
          skippedRows.push({
            row:
              excelRowNumber,
            email: "",
            reason:
              "Email address is missing.",
          });

          continue;
        }

        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        /*
        ----------------------------------------------------------
        DUPLICATE EMAIL IN DATABASE
        ----------------------------------------------------------
        */

        if (
          existingEmails.has(
            normalizedEmail,
          )
        ) {
          skippedRows.push({
            row:
              excelRowNumber,
            email:
              normalizedEmail,
            reason:
              "A candidate with this email already exists.",
          });

          continue;
        }

        /*
        ----------------------------------------------------------
        DUPLICATE EMAIL INSIDE CURRENT EXCEL
        ----------------------------------------------------------
        */

        if (
          uploadedEmails.has(
            normalizedEmail,
          )
        ) {
          skippedRows.push({
            row:
              excelRowNumber,
            email:
              normalizedEmail,
            reason:
              "Duplicate email found in the Excel file.",
          });

          continue;
        }

        uploadedEmails.add(
          normalizedEmail,
        );

        /*
        ----------------------------------------------------------
        GENERATE CD_XX ID
        ----------------------------------------------------------
        */

        nextCandidateNumber +=
          1;

        const candidateId =
          `CD_${String(
            nextCandidateNumber,
          ).padStart(2, "0")}`;

        /*
        ----------------------------------------------------------
        PLAN / CREDITS
        ----------------------------------------------------------
        */

        const {
          plan,
          credits,
        } =
          getImportedPlanCredits(
            planValue,
          );

        /*
        ----------------------------------------------------------
        PROGRAM DAYS
        ----------------------------------------------------------
        */

        const programDays =
          Math.max(
            Number(
              programDaysValue,
            ) || 45,
            0,
          );

        /*
        ----------------------------------------------------------
        CREATE CANDIDATE OBJECT
        ----------------------------------------------------------
        */

        const now =
          new Date();

        const candidate = {
          id:
            candidateId,

          name:
            name.trim(),

          email:
            normalizedEmail,

          phone:
            phone || "",

          location:
            location || "",

          domain:
            domain || "",

          targetRole:
            targetRole || "",

          experience:
            experience || "",

          /*
          EXACT PLAN FROM EXCEL
          */

          plan,

          programDays,

          daysRemaining:
            programDays,

          /*
          EXACT PLAN CREDIT VALUE
          */

          creditsTotal:
            credits,

          creditsRemaining:
            credits,

          creditsUsed: 0,

          assignedSpecialist:
            assignedSpecialist ||
            "",

          startDate:
            startDate || "",

          status:
            status || "Active",

          notes:
            notes || "",

          monthly: [],

          reports: [],

          uploadedReports: [],

          uploadedMARReports: [],

          programActivities: [],

          applicationHistory: [],

          feedback: [],

          activity: [],

          createdAt: now,

          updatedAt: now,
        };

        candidatesToInsert.push(
          candidate,
        );
      }

      /*
      ============================================================
      NO VALID CANDIDATES
      ============================================================
      */

      if (
        candidatesToInsert.length ===
        0
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(200).json({
          success: true,

          message:
            "No new candidates were imported.",

          imported: 0,

          skipped:
            skippedRows.length,

          skippedRows,

          data: [],
        });
      }

      /*
      ============================================================
      INSERT CANDIDATES
      ============================================================
      */

      let insertedCandidates =
        [];

      try {
        const result =
          await db
            .collection(
              "candidates",
            )
            .insertMany(
              candidatesToInsert,
              {
                ordered: true,
              },
            );

        insertedCandidates =
          candidatesToInsert.map(
            (
              candidate,
              index,
            ) => ({
              ...candidate,

              _id:
                result
                  .insertedIds[
                  index
                ],
            }),
          );
      } catch (
        insertError
      ) {
        console.error(
          "Excel import database error:",
          insertError,
        );

        deleteUploadedFile(
          req.file.path,
        );

        /*
        Duplicate-key error
        */

        if (
          insertError?.code ===
          11000
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "One or more candidates already exist. Please check duplicate email addresses.",

              imported: 0,

              skipped:
                skippedRows.length,

              skippedRows,
            });
        }

        throw insertError;
      }

      /*
      ============================================================
      DELETE TEMPORARY UPLOAD
      ============================================================
      */

      deleteUploadedFile(
        req.file.path,
      );

      /*
      ============================================================
      SUCCESS RESPONSE
      ============================================================
      */

      return res.status(200).json({
        success: true,

        message:
          `${insertedCandidates.length} candidate(s) imported successfully.`,

        imported:
          insertedCandidates.length,

        skipped:
          skippedRows.length,

        skippedRows,

        data:
          insertedCandidates,
      });
    } catch (error) {
      console.error(
        "Excel candidate import failed:",
        error,
      );

      deleteUploadedFile(
        req.file?.path,
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to import candidates from Excel.",

        imported: 0,

        skipped: 0,

        skippedRows: [],
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET REPORTS
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId/reports",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
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

      return res
        .status(500)
        .json({
          message:
            "Failed to fetch reports.",
        });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPLOAD REPORT / INTERVIEW CALL / OFFER LETTER
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/reports",
  upload.single("file"),
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
        query,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        deleteUploadedFile(
          req.file?.path,
        );

        return res
          .status(404)
          .json({
            message:
              "Candidate not found.",
          });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "Please select a file.",
          });
      }

      const type =
        String(
          req.body.type ||
            "",
        ).trim();

      const company =
        String(
          req.body.company ||
            "",
        ).trim();

      const role =
        String(
          req.body.role ||
            "",
        ).trim();

      const reportType =
        String(
          req.body.reportType ||
            "",
        ).trim();

      /*
      VALID TYPES
      */

      if (
        type !==
          "Interview Call" &&
        type !== "Report" &&
        type !== "Offer Letter"
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res
          .status(400)
          .json({
            message:
              "Please select Interview Call, Report, or Offer Letter.",
          });
      }

      /*
      INTERVIEW CALL
      */

      if (
        type ===
        "Interview Call"
      ) {
        if (
          !req.file.mimetype.startsWith(
            "image/",
          )
        ) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Interview Call upload must be an image.",
            });
        }

        if (!company) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Company name is required.",
            });
        }

        if (!role) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Role is required.",
            });
        }
      }

      /*
      REPORT
      */

      if (
        type === "Report"
      ) {
        if (
          req.file.mimetype !==
          "application/pdf"
        ) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Report upload must be a PDF file.",
            });
        }

        if (!reportType) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Please select a report type.",
            });
        }

        const allowedReportTypes =
          [
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

          return res
            .status(400)
            .json({
              message:
                "Invalid report type.",
            });
        }
      }

      /*
      OFFER LETTER
      */

      if (
        type ===
        "Offer Letter"
      ) {
        const isPDF =
          req.file.mimetype ===
            "application/pdf" ||
          String(
            req.file
              .originalname ||
              "",
          )
            .toLowerCase()
            .endsWith(
              ".pdf",
            );

        if (!isPDF) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Offer Letter upload must be a PDF file.",
            });
        }

        if (!company) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Company name is required.",
            });
        }

        if (!role) {
          deleteUploadedFile(
            req.file.path,
          );

          return res
            .status(400)
            .json({
              message:
                "Role is required.",
            });
        }
      }

      /*
      CREATE REPORT
      */

      const newReport = {
        id:
          new ObjectId().toString(),

        date:
          new Date()
            .toISOString()
            .split("T")[0],

        type,

        company:
          type ===
            "Interview Call" ||
          type ===
            "Offer Letter"
            ? company
            : "",

        role:
          type ===
            "Interview Call" ||
          type ===
            "Offer Letter"
            ? role
            : "",

        reportType:
          type === "Report"
            ? reportType
            : "",

        fileName:
          req.file
            .originalname,

        fileUrl:
          `/uploads/${req.file.filename}`,

        fileType:
          req.file
            .mimetype,

        uploadedBy:
          String(
            req.body
              .uploadedBy ||
              "",
          ).trim(),

        createdAt:
          new Date(),
      };

      await db
        .collection(
          "candidates",
        )
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

      return res
        .status(201)
        .json({
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

      return res
        .status(500)
        .json({
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
      const db =
        getDatabase();

      const {
        candidate,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
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

      return res
        .status(500)
        .json({
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
*/

router.post(
  "/:candidateId/mar",
  upload.single("file"),
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
        query,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        deleteUploadedFile(
          req.file?.path,
        );

        return res
          .status(404)
          .json({
            message:
              "Candidate not found.",
          });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "Please select a MAR file.",
          });
      }

      const extension =
        path
          .extname(
            req.file
              .originalname,
          )
          .toLowerCase();

      const allowedExtensions =
        [
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

        return res
          .status(400)
          .json({
            message:
              "Daily MAR Report must be a .txt or PDF file.",
          });
      }

      const fileFormat =
        extension === ".pdf"
          ? "PDF"
          : "TXT";

      const newMARReport = {
        id:
          new ObjectId().toString(),

        date:
          new Date()
            .toISOString()
            .split("T")[0],

        fileName:
          req.file
            .originalname,

        fileUrl:
          `/uploads/${req.file.filename}`,

        fileType:
          req.file
            .mimetype,

        fileFormat,

        updatedBy:
          String(
            req.body
              .updatedBy ||
              "",
          ).trim(),

        createdAt:
          new Date(),
      };

      await db
        .collection(
          "candidates",
        )
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

      return res
        .status(201)
        .json({
          success: true,

          data:
            newMARReport,
        });
    } catch (error) {
      console.error(
        "Error uploading MAR report:",
        error,
      );

      deleteUploadedFile(
        req.file?.path,
      );

      return res
        .status(500)
        .json({
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

router.get(
  "/:candidateId/activity",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
            message:
              "Candidate not found.",
          });
      }

      return res.json({
        data:
          Array.isArray(
            candidate.activity,
          )
            ? candidate.activity
            : [],
      });
    } catch (error) {
      console.error(
        "Error fetching activity:",
        error,
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to fetch activity.",
        });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE CANDIDATE STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  "/:candidateId/status",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        status,
      } = req.body || {};

      const allowedStatuses =
        [
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
        return res
          .status(400)
          .json({
            message:
              "Invalid candidate status.",
          });
      }

      const query =
        getCandidateQuery(
          req.params
            .candidateId,
        );

      const result =
        await db
          .collection(
            "candidates",
          )
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
              returnDocument:
                "after",
            },
          );

      if (!result) {
        return res
          .status(404)
          .json({
            message:
              "Candidate not found.",
          });
      }

      return res.json(
        result,
      );
    } catch (error) {
      console.error(
        "Error updating status:",
        error,
      );

      return res
        .status(500)
        .json({
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
*/

router.get(
  "/:candidateId/applications",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
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
        (
          first,
          second,
        ) =>
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

      return res
        .status(200)
        .json({
          success: true,

          data:
            applicationHistory,

          creditsTotal,

          creditsUsed,

          creditsRemaining,
        });
    } catch (error) {
      console.error(
        "Error getting application history:",
        error,
      );

      return res
        .status(500)
        .json({
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
*/

router.post(
  "/:candidateId/applications",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        applications,
        date,
        updatedBy,
      } = req.body || {};

      const applicationCount =
        Number(
          applications,
        );

      if (
        !Number.isFinite(
          applicationCount,
        ) ||
        applicationCount <= 0 ||
        !Number.isInteger(
          applicationCount,
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Applications must be a whole number greater than 0.",
          });
      }

      const {
        candidate,
        query,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
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
          (
            total,
            item,
          ) =>
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
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Only ${currentCreditsRemaining} application credits are remaining.`,
          });
      }

      const applicationDate =
        typeof date ===
          "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
          date,
        )
          ? date
          : getTodayDate();

      /*
      CREATE HISTORY ENTRY
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
          (
            total,
            item,
          ) =>
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
      RECALCULATE PROGRAM DAYS
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
          .collection(
            "candidates",
          )
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
              returnDocument:
                "after",
            },
          );

      if (!result) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Candidate not found.",
          });
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Applications updated successfully.",

          data:
            savedEntry,

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

      return res
        .status(500)
        .json({
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
*/

router.get(
  "/:candidateId",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
      } =
        await findCandidate(
          db,
          req.params
            .candidateId,
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
            message:
              "Candidate not found.",
          });
      }

      const candidateWithDays =
        {
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

      return res
        .status(500)
        .json({
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
    const db =
      getDatabase();

    const query =
      getCandidateQuery(
        req.params
          .candidateId,
      );

    const existingCandidate =
      await db
        .collection(
          "candidates",
        )
        .findOne(
          query,
        );

    if (!existingCandidate) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Candidate not found.",
        });
    }

    const updates = {
      ...req.body,

      updatedAt:
        new Date(),
    };

    /*
    NEVER allow ID changes.
    */

    delete updates._id;
    delete updates.id;

    /*
    NORMALIZE EMAIL
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
    PLAN CHANGE
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

      updates.plan =
        plan;

      /*
      Only reset credits if
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

    /*
    PROGRAM DAYS UPDATE
    */

    if (
      updates.programDays !==
      undefined
    ) {
      updates.programDays =
        Math.max(
          Number(
            updates.programDays,
          ) || 0,
          0,
        );

      const candidateWithUpdatedProgramDays =
        {
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
        .collection(
          "candidates",
        )
        .findOneAndUpdate(
          query,
          {
            $set:
              updates,
          },
          {
            returnDocument:
              "after",
          },
        );

    if (!result) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Candidate not found.",
        });
    }

    return res
      .status(200)
      .json({
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
      error?.code ===
      11000
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A candidate with this email already exists.",
        });
    }

    return res
      .status(500)
      .json({
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

/*
|--------------------------------------------------------------------------
| DELETE CANDIDATE
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const query =
        getCandidateQuery(
          req.params
            .candidateId,
        );

      console.log(
        "Deleting candidate with query:",
        query,
      );

      const result =
        await db
          .collection(
            "candidates",
          )
          .deleteOne(
            query,
          );

      if (
        result.deletedCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Candidate not found.",
          });
      }

      return res.json({
        success: true,

        message:
          "Candidate deleted successfully.",

        deletedCount:
          result.deletedCount,
      });
    } catch (error) {
      console.error(
        "Error deleting candidate:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to delete candidate.",
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
      return res
        .status(400)
        .json({
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