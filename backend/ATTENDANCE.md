# Attendance Module Setup

1. Create the `school_management` database and run `database/schema.sql` from the project root.
2. Copy `backend/.env.example` to `backend/.env`, set the MySQL credentials, and replace `ATTENDANCE_TOKEN_SECRET` with a random value of at least 32 bytes.
3. Run `database/attendance_schema.sql` once. It adds class/year snapshots to student attendance and creates the missing staff attendance table.
4. Install dependencies with `npm ci`, then start the server with `node backend/server.js`.
5. Create an access token for an active admin or teacher user with `node backend/scripts/createAttendanceToken.js <user_id> [hours]`. The token is printed once and expires after 8 hours by default; the maximum lifetime is 7 days.
6. Open `http://localhost:5000/attendance/` and enter the token. The API accepts it as `Authorization: Bearer <token>`.

Attendance mutations require an admin or teacher token. Leave decisions require an admin token. Keep the token secret and rotate `ATTENDANCE_TOKEN_SECRET` to invalidate issued tokens.

Run the API tests with `npm test`. The persistence and reporting integration test needs a configured MySQL database and skips when one is unavailable.