const express = require("express");
const Log = require("../models/Log");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).limit(20);
  res.json(logs);
});

module.exports = router;
