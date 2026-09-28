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
| MULTER
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadsDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(
      file.originalname || "",
    );

    const baseName = path
      .basename(
        file.originalname || "upload",
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
      )}-${baseName}${extension}`;

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
| HELPERS
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

function getTodayDate() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function getPlanCredits(plan) {
  const normalizedPlan = String(
    plan || "",
  )
    .trim()
    .toLowerCase();

  if (
    normalizedPlan.includes("1000")
  ) {
    return {
      plan: "1000",
      credits: 1000,
    };
  }

  if (
    normalizedPlan.includes("500")
  ) {
    return {
      plan: "500",
      credits: 500,
    };
  }

  if (
    normalizedPlan.includes("250")
  ) {
    return {
      plan: "250",
      credits: 250,
    };
  }

  return {
    plan:
      String(plan || "").trim() ||
      "250",
    credits: 250,
  };
}

function calculateDaysRemaining(
  candidate,
) {
  const explicitDays =
    Number(
      candidate?.daysRemaining,
    );

  if (
    Number.isFinite(explicitDays) &&
    explicitDays >= 0
  ) {
    return explicitDays;
  }

  const programDays =
    Number(candidate?.programDays);

  if (
    !Number.isFinite(programDays) ||
    programDays <= 0
  ) {
    return 0;
  }

  const startDate =
    candidate?.startDate ||
    candidate?.programStartDate ||
    candidate?.createdAt;

  if (!startDate) {
    return programDays;
  }

  const start =
    new Date(startDate);

  if (
    Number.isNaN(start.getTime())
  ) {
    return programDays;
  }

  const today = new Date();

  const diff =
    Math.floor(
      (
        today.getTime() -
        start.getTime()
      ) /
        (1000 * 60 * 60 * 24),
    );

  return Math.max(
    programDays - diff,
    0,
  );
}

async function findCandidate(
  db,
  candidateId,
) {
  const query =
    getCandidateQuery(
      candidateId,
    );

  const candidate =
    await db
      .collection("candidates")
      .findOne(query);

  return {
    candidate,
    query,
  };
}

function normalizeImportHeader(
  value,
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      "",
    );
}

function normalizeImportValue(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    value instanceof Date
  ) {
    return value
      .toISOString()
      .split("T")[0];
  }

  return String(value).trim();
}

async function generateCandidateId(
  db,
) {
  const candidates =
    await db
      .collection("candidates")
      .find(
        {
          id: {
            $regex: /^CAND-\d+$/,
          },
        },
        {
          projection: {
            id: 1,
          },
        },
      )
      .toArray();

  let maxNumber = 0;

  for (
    const candidate of candidates
  ) {
    const match =
      String(
        candidate.id || "",
      ).match(
        /^CAND-(\d+)$/,
      );

    if (match) {
      maxNumber = Math.max(
        maxNumber,
        Number(match[1]),
      );
    }
  }

  return `CAND-${String(
    maxNumber + 1,
  ).padStart(4, "0")}`;
}

/*
|--------------------------------------------------------------------------
| GET ALL CANDIDATES
|--------------------------------------------------------------------------
| GET /api/candidates
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  async (req, res) => {
    try {
      const db = getDatabase();

      const candidates =
        await db
          .collection("candidates")
          .find({})
          .sort({
            createdAt: 1,
            _id: 1,
          })
          .toArray();

      const result =
        candidates.map(
          (candidate) => ({
            ...candidate,

            daysRemaining:
              calculateDaysRemaining(
                candidate,
              ),
          }),
        );

      return res.json(result);
    } catch (error) {
      console.error(
        "Error fetching candidates:",
        error,
      );

      return res.status(500).json({
        success: false,
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
| POST /api/candidates
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  async (req, res) => {
    try {
      const db = getDatabase();

      const body =
        req.body || {};

      const {
        plan,
        credits,
      } =
        getPlanCredits(
          body.plan,
        );

      const programDays =
        Math.max(
          Number(
            body.programDays,
          ) || 0,
          0,
        );

      const candidateId =
        body.id &&
        String(body.id).trim()
          ? String(body.id).trim()
          : await generateCandidateId(
              db,
            );

      const now =
        new Date();

      const candidate = {
        ...body,

        id: candidateId,

        plan,

        programDays,

        daysRemaining:
          programDays,

        creditsTotal:
          Number(
            body.creditsTotal,
          ) || credits,

        creditsRemaining:
          Number.isFinite(
            Number(
              body.creditsRemaining,
            ),
          )
            ? Number(
                body.creditsRemaining,
              )
            : credits,

        creditsUsed:
          Number(
            body.creditsUsed,
          ) || 0,

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

        programActivities:
          Array.isArray(
            body.programActivities,
          )
            ? body.programActivities
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
          .collection("candidates")
          .insertOne(
            candidate,
          );

      return res.status(201).json({
        ...candidate,
        _id:
          result.insertedId,
      });
    } catch (error) {
      console.error(
        "Error creating candidate:",
        error,
      );

      if (
        error?.code === 11000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A candidate with this email or ID already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create candidate.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| IMPORT CANDIDATES
|--------------------------------------------------------------------------
| POST /api/candidates/import
|--------------------------------------------------------------------------
*/

router.post(
  "/import",
  upload.single("file"),
  async (req, res) => {
    try {
      const db =
        getDatabase();

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select an Excel or CSV file.",
        });
      }

      const extension =
        path
          .extname(
            req.file.originalname,
          )
          .toLowerCase();

      if (
        ![
          ".xlsx",
          ".xls",
          ".csv",
        ].includes(extension)
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          success: false,
          message:
            "Only Excel and CSV files are supported.",
        });
      }

      const workbook =
        XLSX.read(
          req.file.path,
          {
            type: "file",
            cellDates: true,
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

      const rows =
        XLSX.utils.sheet_to_json(
          workbook.Sheets[
            sheetName
          ],
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
            "The uploaded file is empty.",
        });
      }

      const inserted =
        [];

      const skipped =
        [];

      for (
        const rawRow of rows
      ) {
        const row = {};

        for (
          const [
            key,
            value,
          ] of Object.entries(
            rawRow,
          )
        ) {
          row[
            normalizeImportHeader(
              key,
            )
          ] =
            normalizeImportValue(
              value,
            );
        }

        const name =
          row.name ||
          row.fullname ||
          row.candidatename ||
          "";

        const email =
          String(
            row.email || "",
          )
            .trim()
            .toLowerCase();

        if (
          !name &&
          !email
        ) {
          skipped.push({
            reason:
              "Name and email are missing.",
            row: rawRow,
          });

          continue;
        }

        if (!email) {
          skipped.push({
            reason:
              "Email is missing.",
            row: rawRow,
          });

          continue;
        }

        const existing =
          await db
            .collection(
              "candidates",
            )
            .findOne({
              email,
            });

        if (existing) {
          skipped.push({
            reason:
              "Candidate already exists.",
            email,
          });

          continue;
        }

        const {
          plan,
          credits,
        } =
          getPlanCredits(
            row.plan,
          );

        const programDays =
          Math.max(
            Number(
              row.programdays,
            ) || 0,
            0,
          );

        const now =
          new Date();

        const candidateId =
          await generateCandidateId(
            db,
          );

        const candidate = {
          ...rawRow,

          id: candidateId,

          name,

          email,

          plan,

          programDays,

          daysRemaining:
            programDays,

          creditsTotal:
            credits,

          creditsRemaining:
            credits,

          creditsUsed: 0,

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

        await db
          .collection(
            "candidates",
          )
          .insertOne(
            candidate,
          );

        inserted.push(
          candidate,
        );
      }

      deleteUploadedFile(
        req.file.path,
      );

      return res.status(201).json({
        success: true,

        message:
          "Candidates imported successfully.",

        insertedCount:
          inserted.length,

        skippedCount:
          skipped.length,

        data: inserted,

        skipped,
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
| GET /api/candidates/:candidateId/reports
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        success: true,

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
        success: false,
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
| POST /api/candidates/:candidateId/reports
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
          req.params.candidateId,
        );

      if (!candidate) {
        deleteUploadedFile(
          req.file?.path,
        );

        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a file.",
        });
      }

      const type =
        String(
          req.body.type || "",
        ).trim();

      const company =
        String(
          req.body.company || "",
        ).trim();

      const role =
        String(
          req.body.role || "",
        ).trim();

      const reportType =
        String(
          req.body.reportType || "",
        ).trim();

      /*
      IMPORTANT:
      OFFER LETTER IS INCLUDED HERE.
      */

      const allowedTypes = [
        "Interview Call",
        "Report",
        "Offer Letter",
      ];

      if (
        !allowedTypes.includes(
          type,
        )
      ) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          success: false,
          message:
            "Please select Interview Call, Report, or Offer Letter.",
        });
      }

      /*
      ==================================================
      INTERVIEW CALL
      ==================================================
      */

      if (
        type === "Interview Call"
      ) {
        const isImage =
          String(
            req.file.mimetype || "",
          ).startsWith(
            "image/",
          );

        if (!isImage) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Interview Call upload must be an image.",
          });
        }

        if (!company) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Company name is required.",
          });
        }

        if (!role) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Role is required.",
          });
        }
      }

      /*
      ==================================================
      NORMAL REPORT
      ==================================================
      */

      if (
        type === "Report"
      ) {
        const isPDF =
          req.file.mimetype ===
            "application/pdf" ||
          String(
            req.file.originalname ||
              "",
          )
            .toLowerCase()
            .endsWith(".pdf");

        if (!isPDF) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Report upload must be a PDF file.",
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
            success: false,
            message:
              "Please select a valid report type.",
          });
        }
      }

      /*
      ==================================================
      OFFER LETTER
      ==================================================
      */

      if (
        type === "Offer Letter"
      ) {
        const isPDF =
          req.file.mimetype ===
            "application/pdf" ||
          String(
            req.file.originalname ||
              "",
          )
            .toLowerCase()
            .endsWith(".pdf");

        if (!isPDF) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Offer Letter upload must be a PDF file.",
          });
        }

        if (!company) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Company name is required.",
          });
        }

        if (!role) {
          deleteUploadedFile(
            req.file.path,
          );

          return res.status(400).json({
            success: false,
            message:
              "Role is required.",
          });
        }
      }

      /*
      ==================================================
      CREATE REPORT OBJECT
      ==================================================
      */

      const newReport = {
        id:
          new ObjectId().toString(),

        date:
          getTodayDate(),

        type,

        company:
          type === "Interview Call" ||
          type === "Offer Letter"
            ? company
            : "",

        role:
          type === "Interview Call" ||
          type === "Offer Letter"
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

        uploadedBy:
          String(
            req.body.uploadedBy ||
              "",
          ).trim(),

        createdAt:
          new Date(),
      };

      /*
      ==================================================
      SAVE TO MONGODB
      ==================================================
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

        message:
          type === "Offer Letter"
            ? "Offer Letter uploaded successfully."
            : "File uploaded successfully.",

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
        success: false,
        message:
          error?.message ||
          "Failed to upload file.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE REPORT / OFFER LETTER
|--------------------------------------------------------------------------
| DELETE /api/candidates/:candidateId/reports/:reportId
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId/reports/:reportId",
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      const reportId =
        String(
          req.params.reportId,
        );

      const reports =
        Array.isArray(
          candidate.uploadedReports,
        )
          ? candidate.uploadedReports
          : [];

      const report =
        reports.find(
          (item) =>
            String(
              item?.id || "",
            ) === reportId,
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Report not found.",
        });
      }

      if (
        report.fileUrl
      ) {
        const fileName =
          path.basename(
            String(
              report.fileUrl,
            ),
          );

        deleteUploadedFile(
          path.join(
            uploadsDirectory,
            fileName,
          ),
        );
      }

      const updatedReports =
        reports.filter(
          (item) =>
            String(
              item?.id || "",
            ) !== reportId,
        );

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $set: {
              uploadedReports:
                updatedReports,

              updatedAt:
                new Date(),
            },
          },
        );

      return res.json({
        success: true,

        message:
          report.type ===
          "Offer Letter"
            ? "Offer Letter deleted successfully."
            : "Report deleted successfully.",

        data: report,
      });
    } catch (error) {
      console.error(
        "Error deleting report:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete report.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET MAR REPORTS
|--------------------------------------------------------------------------
| GET /api/candidates/:candidateId/mar
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        success: true,

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
        success: false,
        message:
          "Failed to fetch MAR reports.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPLOAD MAR
|--------------------------------------------------------------------------
| POST /api/candidates/:candidateId/mar
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
          req.params.candidateId,
        );

      if (!candidate) {
        deleteUploadedFile(
          req.file?.path,
        );

        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a MAR file.",
        });
      }

      const isAllowed =
        req.file.mimetype ===
          "application/pdf" ||
        req.file.mimetype ===
          "text/plain" ||
        String(
          req.file.originalname ||
            "",
        )
          .toLowerCase()
          .endsWith(".pdf") ||
        String(
          req.file.originalname ||
            "",
        )
          .toLowerCase()
          .endsWith(".txt");

      if (!isAllowed) {
        deleteUploadedFile(
          req.file.path,
        );

        return res.status(400).json({
          success: false,
          message:
            "MAR file must be PDF or TXT.",
        });
      }

      const report = {
        id:
          new ObjectId().toString(),

        date:
          getTodayDate(),

        fileName:
          req.file.originalname,

        fileUrl:
          `/uploads/${req.file.filename}`,

        fileType:
          req.file.mimetype,

        uploadedBy:
          String(
            req.body.uploadedBy ||
              "",
          ).trim(),

        createdAt:
          new Date(),
      };

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $push: {
              uploadedMARReports:
                report,
            },

            $set: {
              updatedAt:
                new Date(),
            },
          },
        );

      return res.status(201).json({
        success: true,
        message:
          "MAR uploaded successfully.",
        data: report,
      });
    } catch (error) {
      console.error(
        "Error uploading MAR:",
        error,
      );

      deleteUploadedFile(
        req.file?.path,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to upload MAR.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE MAR
|--------------------------------------------------------------------------
| DELETE /api/candidates/:candidateId/mar/:reportId
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId/mar/:reportId",
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      const reports =
        Array.isArray(
          candidate.uploadedMARReports,
        )
          ? candidate.uploadedMARReports
          : [];

      const report =
        reports.find(
          (item) =>
            String(
              item?.id || "",
            ) ===
            String(
              req.params.reportId,
            ),
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "MAR report not found.",
        });
      }

      if (
        report.fileUrl
      ) {
        const fileName =
          path.basename(
            String(
              report.fileUrl,
            ),
          );

        deleteUploadedFile(
          path.join(
            uploadsDirectory,
            fileName,
          ),
        );
      }

      const updated =
        reports.filter(
          (item) =>
            String(
              item?.id || "",
            ) !==
            String(
              req.params.reportId,
            ),
        );

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $set: {
              uploadedMARReports:
                updated,

              updatedAt:
                new Date(),
            },
          },
        );

      return res.json({
        success: true,
        message:
          "MAR report deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Error deleting MAR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete MAR report.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET PROGRAM ACTIVITIES
|--------------------------------------------------------------------------
| GET /api/candidates/:candidateId/program-activities
|--------------------------------------------------------------------------
*/

router.get(
  "/:candidateId/program-activities",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const {
        candidate,
      } =
        await findCandidate(
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

      return res.json({
        success: true,

        data:
          Array.isArray(
            candidate.programActivities,
          )
            ? candidate.programActivities
            : [],
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
| CREATE PROGRAM ACTIVITY
|--------------------------------------------------------------------------
| POST /api/candidates/:candidateId/program-activities
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/program-activities",
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      const body =
        req.body || {};

      const activity = {
        id:
          new ObjectId().toString(),

        date:
          String(
            body.date ||
              getTodayDate(),
          ).trim(),

        activityType:
          String(
            body.activityType ||
              "Other",
          ).trim(),

        conductedBy:
          String(
            body.conductedBy ||
              "",
          ).trim(),

        subject:
          String(
            body.subject || "",
          ).trim(),

        notes:
          String(
            body.notes || "",
          ).trim(),

        nextSteps:
          String(
            body.nextSteps || "",
          ).trim(),

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      };

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $push: {
              programActivities:
                {
                  $each: [
                    activity,
                  ],
                  $position: 0,
                },
            },

            $set: {
              updatedAt:
                new Date(),
            },
          },
        );

      return res.status(201).json({
        success: true,

        message:
          "Program activity saved successfully.",

        data: activity,
      });
    } catch (error) {
      console.error(
        "Error creating program activity:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save program activity.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE PROGRAM ACTIVITY
|--------------------------------------------------------------------------
| DELETE /api/candidates/:candidateId/program-activities/:activityId
|--------------------------------------------------------------------------
*/

router.delete(
  "/:candidateId/program-activities/:activityId",
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

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

      const exists =
        activities.some(
          (item) =>
            String(
              item?.id || "",
            ) === activityId,
        );

      if (!exists) {
        return res.status(404).json({
          success: false,
          message:
            "Program activity not found.",
        });
      }

      const updated =
        activities.filter(
          (item) =>
            String(
              item?.id || "",
            ) !== activityId,
        );

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $set: {
              programActivities:
                updated,

              updatedAt:
                new Date(),
            },
          },
        );

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
| GET CANDIDATE ACTIVITY
|--------------------------------------------------------------------------
| GET /api/candidates/:candidateId/activity
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        success: true,

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

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch activity.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| ADD ACTIVITY
|--------------------------------------------------------------------------
| POST /api/candidates/:candidateId/activity
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/activity",
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      const activity = {
        id:
          new ObjectId().toString(),

        text:
          String(
            req.body?.text ||
              "",
          ).trim(),

        date:
          String(
            req.body?.date ||
              getTodayDate(),
          ).trim(),

        createdAt:
          new Date(),
      };

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $push: {
              activity:
                {
                  $each: [
                    activity,
                  ],
                  $position: 0,
                },
            },

            $set: {
              updatedAt:
                new Date(),
            },
          },
        );

      return res.status(201).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      console.error(
        "Error creating activity:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create activity.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET APPLICATION HISTORY
|--------------------------------------------------------------------------
| GET /api/candidates/:candidateId/applications
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      const history =
        Array.isArray(
          candidate.applicationHistory,
        )
          ? [
              ...candidate.applicationHistory,
            ]
          : [];

      history.sort(
        (a, b) =>
          new Date(
            b.date || 0,
          ).getTime() -
          new Date(
            a.date || 0,
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
          : Math.max(
              creditsTotal -
                creditsRemaining,
              0,
            );

      return res.json({
        success: true,

        data: history,

        creditsTotal,

        creditsUsed,

        creditsRemaining,
      });
    } catch (error) {
      console.error(
        "Error fetching applications:",
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
| POST /api/candidates/:candidateId/applications
|--------------------------------------------------------------------------
*/

router.post(
  "/:candidateId/applications",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const applicationCount =
        Number(
          req.body?.applications,
        );

      if (
        !Number.isInteger(
          applicationCount,
        ) ||
        applicationCount <= 0
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
      } =
        await findCandidate(
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

      if (
        applicationCount >
        creditsRemaining
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Not enough credits remaining.",
        });
      }

      const history =
        Array.isArray(
          candidate.applicationHistory,
        )
          ? [
              ...candidate.applicationHistory,
            ]
          : [];

      const entry = {
        id:
          new ObjectId().toString(),

        date:
          String(
            req.body?.date ||
              getTodayDate(),
          ),

        applications:
          applicationCount,

        updatedBy:
          String(
            req.body?.updatedBy ||
              "",
          ).trim(),

        createdAt:
          new Date(),
      };

      history.push(entry);

      const newRemaining =
        creditsRemaining -
        applicationCount;

      const newUsed =
        creditsTotal -
        newRemaining;

      await db
        .collection("candidates")
        .updateOne(
          query,
          {
            $set: {
              applicationHistory:
                history,

              creditsRemaining:
                newRemaining,

              creditsUsed:
                newUsed,

              updatedAt:
                new Date(),
            },
          },
        );

      return res.status(201).json({
        success: true,

        data: entry,

        creditsTotal,

        creditsUsed:
          newUsed,

        creditsRemaining:
          newRemaining,
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
| PATCH STATUS
|--------------------------------------------------------------------------
| PATCH /api/candidates/:candidateId/status
|--------------------------------------------------------------------------
*/

router.patch(
  "/:candidateId/status",
  async (req, res) => {
    try {
      const db =
        getDatabase();

      const status =
        String(
          req.body?.status ||
            "",
        ).trim();

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Status is required.",
        });
      }

      const query =
        getCandidateQuery(
          req.params.candidateId,
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
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        "Error updating status:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update status.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET SINGLE CANDIDATE
|--------------------------------------------------------------------------
| GET /api/candidates/:candidateId
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
          req.params.candidateId,
        );

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found.",
        });
      }

      return res.json({
        ...candidate,

        daysRemaining:
          calculateDaysRemaining(
            candidate,
          ),
      });
    } catch (error) {
      console.error(
        "Error fetching candidate:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch candidate.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE CANDIDATE
|--------------------------------------------------------------------------
| PUT /api/candidates/:candidateId
| PATCH /api/candidates/:candidateId
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
        req.params.candidateId,
      );

    const existing =
      await db
        .collection(
          "candidates",
        )
        .findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Candidate not found.",
      });
    }

    const updates = {
      ...(req.body || {}),
      updatedAt:
        new Date(),
    };

    delete updates._id;
    delete updates.id;

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

      if (
        String(
          existing.plan || "",
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
      }
    }

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
    }

    const candidateForDays = {
      ...existing,
      ...updates,
    };

    updates.daysRemaining =
      calculateDaysRemaining(
        candidateForDays,
      );

    const result =
      await db
        .collection(
          "candidates",
        )
        .findOneAndUpdate(
          query,
          {
            $set: updates,
          },
          {
            returnDocument:
              "after",
          },
        );

    return res.json({
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

router.put(
  "/:candidateId",
  updateCandidateHandler,
);

router.patch(
  "/:candidateId",
  updateCandidateHandler,
);

/*
|--------------------------------------------------------------------------
| DELETE CANDIDATE
|--------------------------------------------------------------------------
| DELETE /api/candidates/:candidateId
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
          req.params.candidateId,
        );

      const result =
        await db
          .collection(
            "candidates",
          )
          .deleteOne(query);

      if (
        result.deletedCount ===
        0
      ) {
        return res.status(404).json({
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

      return res.status(500).json({
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
      return res.status(400).json({
        success: false,

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