Logic Document: Smart Assign and Conflict Handling
This document explains the implementation of the Smart Assign feature and the conflict handling mechanism in the task board application. These features ensure efficient task assignment and maintain data consistency when multiple users interact with tasks simultaneously.
Smart Assign Implementation
The Smart Assign feature automatically assigns tasks to the least busy user to balance workload and streamline task management. Here's how it works:

Identifying Available Users:

When a user triggers Smart Assign for a task, the system retrieves a list of all registered users from the MongoDB database. This ensures that only valid users are considered for assignment.

Calculating Workload:

For each user, the system counts the number of active tasks (those in "Todo" or "In Progress" statuses) assigned to them. Tasks in the "Done" status are excluded, as they no longer contribute to a user's workload.

Selecting the Least Busy User:

The system compares the task counts for all users and selects the user with the fewest active tasks. If multiple users have the same number of tasks, one is chosen arbitrarily (the first in the list).

Assigning the Task:

The selected user's ID is attached to the task in the MongoDB database, and the task's lastModified timestamp is updated to reflect the change. The assigned user's email is also populated for display purposes.

Logging the Action:

An activity log entry is created in the database, recording the action (e.g., "Smart assigned task: [Task Title] to [User Email]"). This helps track assignment history.

Real-Time Updates:

The system broadcasts the updated task list and the new log entry to all connected clients using Socket.IO. This ensures that all users see the updated task assignment and activity log in real-time without needing to refresh the page.

This approach ensures tasks are distributed fairly, minimizing overburdening any single user. For example, if User A has 3 tasks, User B has 1 task, and User C has 0 tasks, Smart Assign will choose User C for the next task.
Conflict Handling Mechanism
The conflict handling mechanism prevents data inconsistencies when multiple users attempt to edit the same task simultaneously. It uses a timestamp-based approach to detect and resolve conflicts. Here's how it works:

Tracking Last Modified Time:

Each task in the MongoDB database has a lastModified field, updated to the current timestamp whenever the task is modified (e.g., edited, moved, or smart-assigned). When a user fetches tasks, the frontend also receives the lastModified timestamp for each task.

Submitting Updates with Last Fetched Timestamp:

When a user submits an update to a task (e.g., editing the title or dragging it to a new status), the frontend sends the lastFetched timestamp (the lastModified value when the task was last retrieved) along with the update request.

Checking for Conflicts:

On the backend, before applying the update, the system compares the task's current lastModified timestamp in the database with the lastFetched timestamp sent by the client. If lastModified is newer than lastFetched, it indicates another user modified the task since it was last fetched, signaling a conflict.

Handling Conflicts:

If a conflict is detected, the backend rejects the update with a 409 Conflict status and returns the current task state. The frontend displays an error message (e.g., "Conflict detected, task was modified by another user") and can prompt the user to refresh or retry with the updated task data.
If no conflict is detected (i.e., lastModified is not newer than lastFetched), the update is applied, and the lastModified timestamp is updated.

Real-Time Notifications:

After a successful update, the backend broadcasts the updated task list and a new activity log entry via Socket.IO, ensuring all clients reflect the change instantly.

Example of Conflict Handling
Scenario 1: No Conflict

User A loads the task board and sees Task X with lastModified: 2025-07-15T10:00:00Z.
User A edits Task X's title and submits the change with lastFetched: 2025-07-15T10:00:00Z.
The backend checks Task X’s lastModified (still 2025-07-15T10:00:00Z) and confirms no conflict.
The update is applied, lastModified is set to the current time (e.g., 2025-07-15T10:01:00Z), and all clients receive the updated task via Socket.IO.

Scenario 2: Conflict Detected

User A loads Task X with lastModified: 2025-07-15T10:00:00Z.
User B edits Task X, updating lastModified to 2025-07-15T10:00:30Z and broadcasting the change.
User A, unaware of User B’s change, submits an edit with lastFetched: 2025-07-15T10:00:00Z.
The backend sees lastModified: 2025-07-15T10:00:30Z is newer than lastFetched: 2025-07-15T10:00:00Z, detects a conflict, and rejects the update with a 409 status.
User A sees an error (e.g., "Conflict detected") and can refresh to see User B’s changes before retrying.

Benefits

Smart Assign: Balances workload by assigning tasks to the least busy user, with real-time updates ensuring all users see the latest assignments.
Conflict Handling: Prevents data overwrites by checking timestamps, maintaining consistency in a multi-user environment.

This approach ensures robust task management and data integrity, with clear feedback for users when conflicts occur.
