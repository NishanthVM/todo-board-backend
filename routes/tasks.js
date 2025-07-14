const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const Log = require("../models/Log");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

// Helper function to emit updated tasks to all clients
const emitTaskUpdate = async (io) => {
  try {
    if (!io) {
      console.warn("Socket.io instance is undefined, cannot emit taskUpdate");
      return;
    }
    const tasks = await Task.find().populate("assignedUser", "email").lean();
    const grouped = { Todo: [], "In Progress": [], Done: [] };
    tasks.forEach((t) => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      } else {
        console.warn(`Invalid task status: ${t.status}`);
      }
    });
    console.log("Emitting taskUpdate:", grouped); // Debug
    io.emit("taskUpdate", grouped);
  } catch (err) {
    console.error("Error in emitTaskUpdate:", err.message);
  }
};

// Get all tasks, grouped by status
router.get("/", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedUser", "email").lean();
    const grouped = { Todo: [], "In Progress": [], Done: [] };
    tasks.forEach((t) => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      }
    });
    res.json(grouped);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// Create a new task
router.post("/", authenticateToken, async (req, res) => {
  const { title, description, priority, status = "Todo" } = req.body;
  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ error: "Task title is required and must be a string" });
  }
  if (!["Todo", "In Progress", "Done"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  if (!["Low", "Medium", "High"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }
  try {
    const task = new Task({ title, description, priority, status });
    await task.save();
    const log = new Log({
      user: req.user.email,
      action: `Created task: ${title}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    req.io?.emit("logUpdate", log);
    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(400).json({ error: err.message || "Error creating task" });
  }
});

// Update a task
router.put("/:id", authenticateToken, async (req, res) => {
  const { lastFetched, ...updates } = req.body;
  try {
    const task = await Task.findById(req.params.id);
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
    ).populate("assignedUser", "email");
    const log = new Log({
      user: req.user.email,
      action: `Updated task: ${updatedTask.title}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    req.io?.emit("logUpdate", log);
    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({ error: "Error updating task" });
  }
});

// Smart Assign: Assign task to user with fewest active tasks
router.post("/:id/smart-assign", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().lean();
    const taskCounts = await Promise.all(
      users.map(async (u) => ({
        user: u,
        count: await Task.countDocuments({
          assignedUser: u._id,
          status: { $ne: "Done" },
        }),
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
    ).populate("assignedUser", "email");
    if (!task) return res.status(404).json({ error: "Task not found" });
    const log = new Log({
      user: req.user.email,
      action: `Smart assigned task: ${task.title} to ${leastBusyUser.email}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    req.io?.emit("logUpdate", log);
    res.json(task);
  } catch (err) {
    console.error("Error assigning task:", err.message);
    res.status(500).json({ error: "Error assigning task" });
  }
});

// Delete a task
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const log = new Log({
      user: req.user.email,
      action: `Deleted task: ${task.title}`,
    });
    await log.save();
    await emitTaskUpdate(req.io);
    req.io?.emit("logUpdate", log);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ error: "Error deleting task" });
  }
});

// Listen for client task updates
module.exports = (io) => {
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("clientTaskUpdate", async () => {
      try {
        console.log("Received clientTaskUpdate from", socket.id); // Debug
        await emitTaskUpdate(io); // Broadcast updated tasks
      } catch (err) {
        console.error("Error handling clientTaskUpdate:", err.message);
      }
    });
    socket.on("disconnect", () => console.log("User disconnected:", socket.id));
  });

  return router;
};
