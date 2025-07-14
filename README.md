Todo Board
Project Overview
Todo Board is a full-stack web application for collaborative task management. It allows users to create, edit, delete, and assign tasks, organized into three columns: Todo, In Progress, and Done. The application supports real-time updates across multiple clients using Socket.IO, ensuring that all users see task changes instantly. It includes user authentication (register/login), activity logging, and a Smart Assign feature that assigns tasks to the least busy user. The frontend is deployed on Vercel, and the backend is deployed on Render, with MongoDB Atlas for data storage.
This project addresses previous issues:

Backend: Fixed TypeError: argument callback is required by using async/await and .exec() in Mongoose queries.
Frontend: Resolved npm run build failures on Vercel with correct Vite and dependency configurations.
Connectivity: Fixed CORS errors by allowing the Vercel URL (https://todo-board-frontend.vercel.app) in the backend.

Tech Stack
Frontend (todo-board-frontend)

Framework: React 18.2.0 (with Vite 4.3.9 for fast builds)
Routing: react-router-dom 6.8.0
HTTP Client: axios 1.6.2
Real-Time: socket.io-client 4.7.2
Styling: TailwindCSS 3.4.1 (with animations like hover:scale-105, hover:bg-blue-600)
Build Tool: Vite
Deployment: Vercel
Environment Variables:
VITE_API_URL: Backend API URL (e.g., https://todo-board-backend.onrender.com/api)

Backend (todo-board-backend)

Framework: Node.js with Express 4.17.1
Database: MongoDB Atlas (with Mongoose 6.0.0)
Authentication: jsonwebtoken 9.0.0, bcryptjs 2.4.3
Real-Time: socket.io 4.7.2
CORS: cors 2.8.5
Environment Management: dotenv 16.0.0
Deployment: Render
Environment Variables:
MONGODB_URI: MongoDB Atlas connection string
JWT_SECRET: Secret for JWT tokens
FRONTEND_URL: Frontend URL (e.g., https://todo-board-frontend.vercel.app)
PORT: Server port (default 5000)

Setup and Installation Instructions
Prerequisites

Node.js: Version 18.x (or 16.x for compatibility)
MongoDB Atlas: Create an account and a cluster
Git: For cloning repositories
Vercel CLI: For frontend deployment (optional)
Render Dashboard: For backend deployment (optional)

Backend Setup (todo-board-backend)

Clone the Repository:
git clone https://github.com/<your-username>/todo-board-backend.git
cd todo-board-backend

Install Dependencies:
npm install

Set Up Environment Variables:

Create a .env file in the root directory:MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tododb?retryWrites=true&w=majority
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
PORT=5000

Replace <username>, <password>, and <cluster> with your MongoDB Atlas credentials.
Ensure JWT_SECRET is a secure string (e.g., generated via openssl rand -base64 32).

Run Locally:
npm run dev

The server runs on http://localhost:5000.
Verify: curl http://localhost:5000/health (should return { "status": "OK" }).

Test MongoDB Connection:
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"

Frontend Setup (todo-board-frontend)

Clone the Repository:
git clone https://github.com/<your-username>/todo-board-frontend.git
cd todo-board-frontend

Install Dependencies:
npm install

Set Up Environment Variables:

Create a .env file in the root directory:VITE_API_URL=http://localhost:5000/api

Run Locally:
npm run dev

The frontend runs on http://localhost:5173.
Open in a browser to verify.

Deployment

Backend (Render):
Push to GitHub and create a new web service in Render.
Set environment variables in Render Dashboard.
Build Command: npm install
Start Command: npm start
Health Check Path: /health
URL: https://todo-board-backend.onrender.com

Frontend (Vercel):
Push to GitHub and import into Vercel.
Set VITE_API_URL: https://todo-board-backend.onrender.com/api in Vercel Settings.
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
URL: https://todo-board-frontend.vercel.app

Features List and Usage Guide
Features

User Authentication:
Register and login with email and password.
JWT-based authentication for secure API access.

Task Management:
Create, edit, delete tasks with title, description, priority (Low, Medium, High), and status (Todo, In Progress, Done).
Tasks are displayed in columns based on status.

Real-Time Updates:
Task and log updates are propagated to all connected clients via Socket.IO.

Smart Assign:
Assigns tasks to the user with the fewest active (non-Done) tasks.

Activity Log:
Tracks user actions (e.g., task creation, update, deletion) with timestamps.

Responsive UI:
Built with TailwindCSS, including animations (e.g., hover:scale-105, hover:bg-blue-600).

Usage Guide

Register/Login:
Navigate to http://localhost:5173/register or https://todo-board-frontend.vercel.app/register.
Enter email and password to register.
Log in at /login to receive a JWT token (stored in localStorage).

View Tasks:
After login, redirect to / (task board).
Tasks are displayed in three columns: Todo, In Progress, Done.

Create Task:
Use the form at the bottom of the task board.
Enter title (required), description (optional), and select priority (Low, Medium, High).
Click Add Task; the task appears in the Todo column.

Edit Task:
Click Edit on a task to modify its title.
Save or cancel changes.

Delete Task:
Click Delete to remove a task.

Smart Assign:
Click Smart Assign on a task to assign it to the least busy user.

View Activity Log:
Navigate to /logs to see user actions (e.g., "user@example.com Created task: Test Task").

Real-Time Updates:
Open the app in multiple browser tabs.
Perform task actions (add, edit, delete); changes reflect instantly in all tabs.

Error Handling:
Errors (e.g., invalid token, network issues) are displayed at the top of the UI.

Smart Assign Logic
Overview
The Smart Assign feature assigns a task to the user with the fewest active (non-Done) tasks, optimizing workload distribution.
Implementation (routes/tasks.js)

Endpoint: POST /api/tasks/:id/smart-assign
Logic:
Fetch Users: Query all users from MongoDB (User.find().lean().exec()).
Count Active Tasks:
For each user, count tasks where assignedUser matches the user’s \_id and status is not Done (Task.countDocuments({ assignedUser: user.\_id, status: { $ne: "Done" } }).exec()).

Select Least Busy User:
Use reduce to find the user with the lowest task count.
If no users exist, return a 404 error ("No users available").

Assign Task:
Update the task with Task.findByIdAndUpdate to set assignedUser to the least busy user’s \_id and update lastModified.
Populate assignedUser.email for the response.

Log Action:
Create a log entry (Log.save) with the action (e.g., "Smart assigned task: to <email>").</li>

</ul>
</li>
<li><strong>Emit Updates</strong>:<ul>
<li>Call <code>emitTaskUpdate</code> to send updated tasks to all clients via Socket.IO.</li>
<li>Emit <code>logUpdate</code> with the new log entry.</li>
</ul>
</li>
</ol>
</li>
<li><strong>Code</strong>:<pre><code class="language-javascript">router.post("/:id/smart-assign", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().lean().exec();
    const taskCounts = await Promise.all(
      users.map(async (u) => ({
        user: u,
        count: await Task.countDocuments({ assignedUser: u._id, status: { $ne: "Done" } }).exec(),
      }))
    );
    const leastBusyUser = taskCounts.reduce((min, curr) => (curr.count < min.count ? curr : min), {
      user: null,
      count: Infinity,
    }).user;
    if (!leastBusyUser) return res.status(404).json({ error: "No users available" });
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedUser: leastBusyUser._id, lastModified: Date.now() },
      { new: true }
    ).populate("assignedUser", "email").exec();
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
    console.error('Error assigning task:', err.message);
    res.status(500).json({ error: "Error assigning task" });
  }
});
</code></pre>
</li>
</ul>
<h3>Usage</h3>
<ul>
<li>In <code>Board.jsx</code>, click <strong>Smart Assign</strong> on a task.</li>
<li>The backend assigns the task to the user with the fewest active tasks.</li>
<li>The task’s <code>assignedUser</code> field updates, and all clients receive the update via Socket.IO.</li>
</ul>
<h2>Conflict Handling Logic</h2>
<h3>Overview</h3>
<p>Conflict handling prevents data loss when multiple users edit the same task simultaneously by checking the task’s <code>lastModified</code> timestamp against the client’s <code>lastFetched</code> timestamp.</p>
<h3>Implementation (<code>routes/tasks.js</code>)</h3>
<ul>
<li><strong>Endpoint</strong>: <code>PUT /api/tasks/:id</code></li>
<li><strong>Logic</strong>:<ol>
<li><strong>Receive Updates</strong>: The client sends task updates (e.g., <code>title</code>, <code>status</code>, <code>priority</code>) and an optional <code>lastFetched</code> timestamp.</li>
<li><strong>Check for Conflict</strong>:<ul>
<li>Retrieve the task from MongoDB (<code>Task.findById</code>).</li>
<li>If <code>lastFetched</code> is provided and <code>task.lastModified</code> is newer, return a <code>409 Conflict</code> response with the current task data.</li>
</ul>
</li>
<li><strong>Validate Updates</strong>:<ul>
<li>Ensure <code>status</code> is one of <code>Todo</code>, <code>In Progress</code>, <code>Done</code>.</li>
<li>Ensure <code>priority</code> is one of <code>Low</code>, <code>Medium</code>, <code>High</code>.</li>
</ul>
</li>
<li><strong>Apply Updates</strong>:<ul>
<li>Update the task with <code>Task.findByIdAndUpdate</code>, setting <code>lastModified</code> to the current time.</li>
<li>Populate <code>assignedUser.email</code> for the response.</li>
</ul>
</li>
<li><strong>Log Action</strong>:<ul>
<li>Create a log entry for the update.</li>
</ul>
</li>
<li><strong>Emit Updates</strong>:<ul>
<li>Emit <code>taskUpdate</code> and <code>logUpdate</code> via Socket.IO.</li>
</ul>
</li>
</ol>
</li>
<li><strong>Code</strong>:<pre><code class="language-javascript">router.put("/:id", authenticateToken, async (req, res) => {
  const { lastFetched, ...updates } = req.body;
  try {
    const task = await Task.findById(req.params.id).exec();
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (lastFetched && task.lastModified > new Date(lastFetched)) {
      return res.status(409).json({ error: "Conflict detected", currentTask: task });
    }
    if (updates.status && !["Todo", "In Progress", "Done"].includes(updates.status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (updates.priority && !["Low", "Medium", "High"].includes(updates.priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...updates, lastModified: Date.now() },
      { new: true }
    ).populate("assignedUser", "email").exec();
    const log = new Log({ user: req.user.email, action: `Updated task: ${updatedTask.title}` });
    await log.save();
    await emitTaskUpdate(req.io);
    req.io?.emit("logUpdate", log);
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: "Error updating task" });
  }
});
</code></pre>
</li>
</ul>
<h3>Usage</h3>
<ul>
<li>In <code>Board.jsx</code>, when editing a task, the client sends the <code>lastFetched</code> timestamp (though not fully implemented in the frontend).</li>
<li>If another user modified the task since <code>lastFetched</code>, the backend returns a <code>409 Conflict</code> response.</li>
<li>The frontend can display a warning and show the latest task data (future enhancement).</li>
</ul>
<h2>Troubleshooting</h2>
<ul>
<li><strong>CORS Errors</strong>:<ul>
<li>Ensure <code>FRONTEND_URL</code> in Render matches <code>https://todo-board-frontend.vercel.app</code>.</li>
<li>Check Render logs for <code>CORS blocked for origin</code>.</li>
</ul>
</li>
<li><strong>Build Failures</strong>:<ul>
<li>Run <code>npm run build</code> locally to debug.</li>
<li>Verify <code>package.json</code>, <code>vite.config.js</code>, and component syntax.</li>
</ul>
</li>
<li><strong>Connectivity</strong>:<ul>
<li>Test backend: <code>curl https://todo-board-backend.onrender.com/health</code>.</li>
<li>Check browser console for <code>Socket initialized</code> and <code>Tasks fetched</code>.</li>
</ul>
</li>
<li><strong>Database</strong>:<ul>
<li>Verify MongoDB Atlas <strong>Network Access</strong> allows <code>0.0.0.0/0</code>.</li>
</ul>
</li>
</ul>
<h2>Contributing</h2>
<ul>
<li>Fork the repository and create a pull request.</li>
<li>Ensure code follows ESLint and Prettier standards.</li>
<li>Test locally before deploying.</li>
</ul>
<h2>License</h2>
<p>MIT License</p>
