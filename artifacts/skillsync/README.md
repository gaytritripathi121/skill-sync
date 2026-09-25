# SkillSync

SkillSync is a private career workspace for keeping a profile, skills, projects, job applications, interview preparation, and learning roadmaps together. The dashboard is built from the signed-in user's own records; a new account starts with an empty workspace.

## Stack

- React and Vite for the browser app
- Express and Node.js for the API
- MongoDB with Mongoose for persistent records
- Clerk for email/password sign-in and session verification

## Project layout

```text
.
├── public/                 # Logo, favicon, and static files
├── server/
│   ├── app.js              # Express, Clerk middleware, API and production client serving
│   ├── auth.js             # Verified Clerk identity to a MongoDB account
│   ├── clerkProxyMiddleware.js
│   ├── index.js            # MongoDB connection and API process
│   ├── models.js           # User, profile, and workspace schemas
│   ├── routes.js           # Authenticated API, validation, CRUD, dashboard summaries
│   └── start.js            # Production entry point
├── src/
│   ├── App.jsx             # Landing page, auth, dashboard, and workspace screens
│   ├── index.css
│   ├── lib/api.js          # Cookie-based API client
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## Run locally

Requirements: Node.js 20.19 or newer, npm, a MongoDB database, and a Clerk application with email/password enabled.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`. Fill in the MongoDB URI and your Clerk development keys. Keep `.env` private and out of version control.
3. Start the API:

   ```bash
   npm run dev:server
   ```

4. In a second terminal, start the web app:

   ```bash
   npm run dev
   ```

   Open the Vite address shown in the terminal. The example API URL points to `http://localhost:5000`; the Express API allows the local Vite origin.

For a production-style run, build the browser app and start the Express server:

```bash
npm run build
npm start
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `CLERK_SECRET_KEY` | Server-side Clerk verification |
| `CLERK_PUBLISHABLE_KEY` | Server-side Clerk proxy configuration |
| `VITE_CLERK_PUBLISHABLE_KEY` | Browser Clerk configuration |
| `VITE_CLERK_PROXY_URL` | Optional Clerk proxy URL for the deployment |
| `VITE_API_BASE_URL` | API origin for local development; leave empty for same-origin deployment |
| `FRONTEND_ORIGINS` | Comma-separated browser origins allowed to call the API |
| `PORT` | Express port; defaults to `5000` |

For the Replit deployment, add the MongoDB and Clerk values through Replit Secrets rather than committing them. Use a fresh MongoDB password and URI if a database credential has ever been shared outside the secrets manager. In MongoDB Atlas, allow the deployed server to reach the cluster.

## Privacy and data ownership

- Clerk verifies the session cookie; the browser never chooses the MongoDB owner ID.
- A local `User` document is linked to the verified Clerk user ID. The API creates only that user's profile record on first sign-in.
- Every profile, collection, dashboard, and notification query is scoped by the authenticated MongoDB user ID.
- Request bodies reject unsupported ownership fields, and update/delete operations match both the record ID and the signed-in user's ID.
- No demo skills, projects, applications, roadmaps, or notifications are seeded.
- Passwords are handled by Clerk and are never stored in MongoDB.

## API

All workspace routes require a Clerk session:

- `GET /api/me`, `GET /api/profile`, `PATCH /api/profile`
- `GET /api/dashboard`
- `GET|POST /api/skills`, `PATCH|DELETE /api/skills/:id`
- `GET|POST /api/projects`, `PATCH|DELETE /api/projects/:id`
- `GET|POST /api/applications`, `PATCH|DELETE /api/applications/:id`
- `GET|POST /api/interview-topics`, `PATCH|DELETE /api/interview-topics/:id`
- `GET|POST /api/roadmaps`, `PATCH|DELETE /api/roadmaps/:id`
- `GET /api/notifications`, `PATCH|DELETE /api/notifications/:id`
- `GET /api/healthz` for service and MongoDB status