const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["Todo", "In Progress", "Done"],
    default: "Todo",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  lastModified: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Task", taskSchema);
