const express = require("express");
const { getDatabase } = require("../db");

const router = express.Router();

/*
  GET /api/plans
*/
router.get("/", async (req, res) => {
  try {
    const db = getDatabase();

    const plans = await db
      .collection("plans")
      .find({})
      .sort({ price: 1 })
      .toArray();

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("GET /api/plans error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
    });
  }
});

/*
  GET /api/plans/:id
*/
router.get("/:id", async (req, res) => {
  try {
    const db = getDatabase();

    const plan = await db.collection("plans").findOne({
      id: req.params.id,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("GET /api/plans/:id error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch plan",
    });
  }
});

module.exports = router;