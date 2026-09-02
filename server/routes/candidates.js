const express = require("express");
const { getDatabase } = require("../db");

const router = express.Router();

const VALID_STATUSES = [
  "Active",
  "Completed",
  "Expiring Soon",
  "Paused",
];

/*
  GET /api/candidates
*/
router.get("/", async (req, res) => {
  try {
    const db = getDatabase();

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.plan) {
      filter.plan = req.query.plan;
    }

    if (req.query.domain) {
      filter.domain = req.query.domain;
    }

    const candidates = await db
      .collection("candidates")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error("GET /api/candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
    });
  }
});

/*
  GET /api/candidates/:id
*/
router.get("/:id", async (req, res) => {
  try {
    const db = getDatabase();

    const candidate = await db
      .collection("candidates")
      .findOne({
        candidateId: req.params.id,
      });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error(
      "GET /api/candidates/:id error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch candidate",
    });
  }
});

/*
  POST /api/candidates
*/
router.post("/", async (req, res) => {
  try {
    const db = getDatabase();

    const {
      candidateId,
      name,
      email,
      phone,
      domain,
      targetRole,
      experience,
      plan,
      startDate,
      owner,
      location,
      notes,
    } = req.body;

    if (
      !name ||
      !email ||
      !domain ||
      !plan ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, domain, plan and start date are required",
      });
    }

    /*
      Find selected plan.
      This is what automatically determines
      credits and duration.
    */
    const selectedPlan = await db
      .collection("plans")
      .findOne({
        name: plan,
        active: true,
      });

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Selected plan does not exist",
      });
    }

    /*
      Generate candidate ID if frontend
      doesn't provide one.
    */
    let newCandidateId = candidateId;

    if (!newCandidateId) {
      const lastCandidate = await db
        .collection("candidates")
        .find({})
        .sort({ candidateId: -1 })
        .limit(1)
        .next();

      let nextNumber = 1001;

      if (lastCandidate?.candidateId) {
        const number = Number(
          lastCandidate.candidateId.replace(
            "JH-",
            "",
          ),
        );

        if (!Number.isNaN(number)) {
          nextNumber = number + 1;
        }
      }

      newCandidateId = `JH-${nextNumber}`;
    }

    /*
      Prevent duplicate candidate IDs.
    */
    const existing = await db
      .collection("candidates")
      .findOne({
        candidateId: newCandidateId,
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Candidate ID already exists",
      });
    }

    const start = new Date(startDate);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    /*
      Calculate end date from plan duration.
    */
    const end = new Date(start);

    end.setMonth(
      end.getMonth() +
        selectedPlan.durationMonths,
    );

    const candidate = {
      candidateId: newCandidateId,

      name,
      email,
      phone: phone || "",

      domain,
      targetRole: targetRole || "",
      experience: experience || "",

      plan: selectedPlan.name,

      creditsTotal: selectedPlan.credits,
      creditsRemaining: selectedPlan.credits,

      status: "Active",

      owner: owner || "",
      location: location || "",
      notes: notes || "",

      startDate,
      endDate: end.toISOString().slice(0, 10),

      monthly: [],
      reports: [],
      feedback: [],

      activity: [
        {
          id: `${newCandidateId}-A1`,
          date: startDate,
          text: `Enrolled in ${selectedPlan.name} plan`,
        },
      ],

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db
      .collection("candidates")
      .insertOne(candidate);

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("POST /api/candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create candidate",
    });
  }
});

/*
  PATCH /api/candidates/:id/status

  Example body:
  {
    "status": "Completed"
  }
*/
router.patch("/:id/status", async (req, res) => {
  try {
    const db = getDatabase();

    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate status",
      });
    }

    const result = await db
      .collection("candidates")
      .findOneAndUpdate(
        {
          candidateId: req.params.id,
        },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        },
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate status updated",
      data: result,
    });
  } catch (error) {
    console.error(
      "PATCH /api/candidates/:id/status error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to update candidate status",
    });
  }
});

module.exports = router;