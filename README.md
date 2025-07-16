Task Board Application

Demo Video: https://drive.google.com/file/d/1QdBcQ4e1LUymEaGgpREvHrZGIpsqIrIw/view?usp=drive_link

This is a full-stack task board application with a Kanban-style interface, real-time updates, user authentication, and smart task assignment. The frontend is built with React, Vite, and custom CSS, deployed on Vercel. The backend uses Node.js, Express, MongoDB, and Socket.IO, deployed on Render.
Features

Kanban Board: Organize tasks in Todo, In Progress, and Done columns with drag-and-drop functionality.
Real-Time Updates: Task and activity log updates sync instantly across clients using Socket.IO.
Smart Assign: Automatically assigns tasks to the least busy user based on active task count.
Conflict Handling: Prevents data overwrites using timestamp-based conflict detection.
Authentication: Secure login and registration with JWT.
Activity Log: Tracks task actions (create, update, delete, assign) in real-time.
Custom CSS: Styled UI with hover effects (e.g., scale on task cards, button color changes).

Prerequisites

Node.js (v18 or higher)
MongoDB Atlas account
Vercel account (for frontend deployment)
Render account (for backend deployment)
Git

Project Structure
todo-board/
├── todo-board-frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── Board.jsx
│ │ │ ├── Login.jsx
│ │ │ ├── Register.jsx
│ │ ├── App.jsx
│ │ ├── styles.css
│ ├── public/
│ │ ├── index.html
│ ├── .env
│ ├── package.json
├── todo-board-backend/
│ ├── routes/
│ │ ├── tasks.js
│ │ ├── auth.js
│ ├── models/
│ │ ├── Task.js
│ │ ├── User.js
│ │ ├── Log.js
│ ├── middleware/
│ │ ├── auth.js
│ ├── server.js
│ ├── .env
│ ├── package.json
├── docs/
│ ├── Logic_Document.md
├── README.md

Environment Variable Setup
Frontend (todo-board-frontend)
Create a .env file in the todo-board-frontend/ directory with the following variable:

VITE_API_URL: The URL of the backend API.
Example: VITE_API_URL=https://todo-board-backend.onrender.com/api
For local development: VITE_API_URL=http://localhost:5000/api
Note: Ensure the URL ends with /api and matches the deployed backend URL (or local server URL during development).

Backend (todo-board-backend)
Create a .env file in the todo-board-backend/ directory with the following variables:

MONGODB_URI: MongoDB Atlas connection string for the database.
Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tododb?retryWrites=true&w=majority
Replace <username>, <password>, and <cluster> with your MongoDB Atlas credentials and cluster name.
Note: Do not share this URI, as it contains sensitive credentials.

JWT_SECRET: A secret key for signing JSON Web Tokens (JWT).
Example: JWT_SECRET=your_secret_key_here
Use a secure, random string (e.g., generated via a password manager or openssl rand -base64 32).
Note: Keep this secret private and do not commit it to version control.

FRONTEND_URL: The URL of the deployed frontend for CORS configuration.
Example: FRONTEND_URL=https://todo-board-frontend.vercel.app
For local development: FRONTEND_URL=http://localhost:5173
Note: Ensure this matches the Vercel deployment URL or local frontend URL.

PORT: The port for the backend server.
Example: PORT=5000
Default to 5000 for local development; Render may override this with its own port.

Security Note: Never commit .env files to version control. Use .gitignore to exclude them.
Setup Instructions
Frontend Setup

Clone the Repository:
git clone <repository-url>
cd todo-board-frontend

Install Dependencies:
npm install

Create .env:

Add VITE_API_URL as described above.

Run Locally:
npm run dev

Open http://localhost:5173 in your browser.

Backend Setup

Navigate to Backend:
cd todo-board-backend

Install Dependencies:
npm install

Create .env:

Add MONGODB_URI, JWT_SECRET, FRONTEND_URL, and PORT as described above.

Run Locally:
npm run dev

Test health endpoint: curl http://localhost:5000/health (should return {"status":"OK"}).

Deployment Instructions
Frontend (Vercel)

Push to GitHub:
cd todo-board-frontend
git add .
git commit -m "Initial frontend setup"
git push origin main

Set Up Vercel:

Create a new project in Vercel and link it to your GitHub repository.
Configure environment variables in Vercel Dashboard:
VITE_API_URL: Set to https://todo-board-backend.onrender.com/api.

Set build settings:
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install

Deploy the project.

Verify Deployment:

Visit the Vercel-provided URL (e.g., https://todo-board-frontend.vercel.app).
Check build logs for errors.

Backend (Render)

Push to GitHub:
cd todo-board-backend
git add .
git commit -m "Initial backend setup"
git push origin main

Set Up Render:

Create a new Web Service in Render and link it to your GitHub repository.
Configure environment variables in Render Dashboard:
MONGODB_URI: Your MongoDB Atlas connection string.
JWT_SECRET: Your secret key for JWT.
FRONTEND_URL: https://todo-board-frontend.vercel.app.
PORT: 5000 (or leave unset for Render’s default).

Set runtime:
Environment: Node
Build Command: npm install
Start Command: npm run dev

Deploy the service.

Verify Deployment:

Test health endpoint: curl https://todo-board-backend.onrender.com/health.
Check Render logs for MongoDB connection or CORS issues.

Testing

Authentication:

Open the frontend URL, register a new user, and log in.
Verify redirect to the task board and visibility of the Logout button.

Task Board:

Create, edit, delete, smart assign, and drag-and-drop tasks.
Verify tasks appear in the correct columns (Todo, In Progress, Done).
Check activity log for updates.

Real-Time Updates:

Open two browser tabs, log in, and perform task actions in one tab.
Confirm updates (tasks and logs) appear instantly in the other tab.

Conflict Handling:

Edit a task in two tabs simultaneously.
Verify a conflict error appears if one tab’s update is outdated.

Smart Assign:

Click Smart Assign on a task and confirm it’s assigned to the least busy user.

Console Logs:

Browser: Check for Socket.IO connected, Tasks fetched successfully, Received taskUpdate.
Render: Verify MongoDB tasks queried, Emitting taskUpdate.

Debugging
Logout Button Not Visible

Check browser console for Initial token or Restoring token from localStorage.
Verify localStorage.getItem('token') in DevTools → Application → Local Storage.
Inspect <nav> element for btn btn-red styles.

Tasks Not Fetched

Browser console: Look for Fetch tasks error (e.g., 401 Unauthorized, 500 Internal Server Error).
Render logs: Check for Error fetching tasks or MongoDB tasks queried: 0.
Test with Postman: GET https://todo-board-backend.onrender.com/api/tasks with Authorization: Bearer <token>.

Real-Time Updates Failing

Browser console: Check for Socket.IO connect error.
Render logs: Look for Socket.IO CORS blocked or Emitting taskUpdate.
Verify FRONTEND_URL in Render .env.

MongoDB Issues

Ensure MONGODB_URI is correct in Render .env.
Connect to MongoDB Atlas and check tasks collection:mongo <MONGODB_URI>
use tododb;
db.tasks.find();

Documentation

Logic_Document.md: Explains Smart Assign and conflict handling logic in docs/Logic_Document.md.

Notes

Ensure .env files are not committed to GitHub (use .gitignore).
Use secure values for JWT_SECRET and MONGODB_URI.
For local testing, run both frontend and backend simultaneously.
If issues persist, check browser console and Render logs for errors.
