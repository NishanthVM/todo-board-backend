const express = require("express");
const Log = require("../models/Log");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).lean().exec();
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err.message);
    res.status(500).json({ error: "Error fetching logs" });
  }
});

module.exports = (io) => {
  router.use((req, res, next) => {
    req.io = io;
    next();
  });
  return router;
};
