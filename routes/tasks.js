const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Log = require("../models/Log");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");

async function emitTaskUpdate(io) {
  try {
    const tasks = await Task.find()
      .populate("assignedUser", "email")
      .lean()
      .exec();
    console.log("MongoDB tasks queried:", tasks.length);
    const groupedTasks = {
      Todo: tasks.filter((t) => t.status === "Todo"),
      "In Progress": tasks.filter((t) => t.status === "In Progress"),
      Done: tasks.filter((t) => t.status === "Done"),
    };
    console.log("Emitting taskUpdate:", JSON.stringify(groupedTasks, null, 2));
    io.emit("taskUpdate", groupedTasks);
  } catch (err) {
    console.error("Error emitting taskUpdate:", err.message);
  }
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching tasks for user:", req.user.email);
    const tasks = await Task.find()
      .populate("assignedUser", "email")
      .lean()
      .exec();
    console.log("Tasks fetched:", tasks.length);
    const groupedTasks = {
      Todo: tasks.filter((t) => t.status === "Todo"),
      "In Progress": tasks.filter((t) => t.status === "In Progress"),
      Done: tasks.filter((t) => t.status === "Done"),
    };
    res.json(groupedTasks);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { title, description, priority, status } = req.body;
  try {
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (status && !["Todo", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (priority && !["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }
    const task = new Task({
      title,
      description,
      priority,
      status: status || "Todo",
    });
    await task.save();
    const log = new Log({
      user: req.user.email,
      action: `Created task: ${title}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    console.log("Emitting logUpdate:", log);
    req.io?.emit("logUpdate", log);
    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(500).json({ error: "Error creating task" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const { lastFetched, ...updates } = req.body;
  try {
    const task = await Task.findById(req.params.id).exec();
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (lastFetched && task.lastModified > new Date(lastFetched)) {
      return res
        .status(409)
        .json({ error: "Conflict detected", currentTask: task });
    }
    if (
      updates.status &&
      !["Todo", "In Progress", "Done"].includes(updates.status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (
      updates.priority &&
      !["Low", "Medium", "High"].includes(updates.priority)
    ) {
      return res.status(400).json({ error: "Invalid priority" });
    }
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...updates, lastModified: Date.now() },
      { new: true }
    )
      .populate("assignedUser", "email")
      .exec();
    const log = new Log({
      user: req.user.email,
      action: `Updated task: ${updatedTask.title}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    console.log("Emitting logUpdate:", log);
    req.io?.emit("logUpdate", log);
    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({ error: "Error updating task" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).exec();
    if (!task) return res.status(404).json({ error: "Task not found" });
    await Task.deleteOne({ _id: req.params.id }).exec();
    const log = new Log({
      user: req.user.email,
      action: `Deleted task: ${task.title}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    console.log("Emitting logUpdate:", log);
    req.io?.emit("logUpdate", log);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ error: "Error deleting task" });
  }
});

router.post("/:id/smart-assign", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().lean().exec();
    const taskCounts = await Promise.all(
      users.map(async (u) => ({
        user: u,
        count: await Task.countDocuments({
          assignedUser: u._id,
          status: { $ne: "Done" },
        }).exec(),
      }))
    );
    const leastBusyUser = taskCounts.reduce(
      (min, curr) => (curr.count < min.count ? curr : min),
      {
        user: null,
        count: Infinity,
      }
    ).user;
    if (!leastBusyUser)
      return res.status(404).json({ error: "No users available" });
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedUser: leastBusyUser._id, lastModified: Date.now() },
      { new: true }
    )
      .populate("assignedUser", "email")
      .exec();
    if (!task) return res.status(404).json({ error: "Task not found" });
    const log = new Log({
      user: req.user.email,
      action: `Smart assigned task: ${task.title} to ${leastBusyUser.email}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    console.log("Emitting logUpdate:", log);
    req.io?.emit("logUpdate", log);
    res.json(task);
  } catch (err) {
    console.error("Error assigning task:", err.message);
    res.status(500).json({ error: "Error assigning task" });
  }
});

module.exports = (io) => {
  router.io = io;
  return router;
};
