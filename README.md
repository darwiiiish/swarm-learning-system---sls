# Swarm Learning System (SLS)

## Overview
Swarm Learning System (SLS) is an interactive, gamified platform designed to teach Swarm Intelligence algorithms (like Ant Colony Optimization and Artificial Bee Colony) through interactive visualizations. Students can explore algorithms, ingest their own algorithm implementations from GitHub repositories, participate in discussions, offer fixes, and climb the leaderboard through a contribution-based scoring system.

## 🏗 System Architecture

The system is split into two primary components, utilizing a modern, serverless-ready stack:

### Frontend
- **Framework:** React 19 via Vite
- **Routing:** React Router v7
- **Styling:** Vanilla CSS (`App.css`, `index.css`) & Lucide React for iconography
- **State Management:** React Context API for global state (`AuthContext`)

### Backend
- **Framework:** Express.js 5.x
- **Database:** SQLite (local) / Turso (LibSQL for production edge computing)
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs`
- **Integrations:** Direct GitHub repository ingestion (`extract-zip`, Axios)

---

## 🗄️ Database Schema

The database is built locally on SQLite and scales to the edge using Turso.

```mermaid
erDiagram
    USERS ||--o{ ALGORITHMS : "creates"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ CONTRIBUTOR_APPLICATIONS : "applies"
    ALGORITHMS ||--o{ COMMENTS : "has"
    ALGORITHMS ||--o{ CONTRIBUTOR_APPLICATIONS : "receives"

    USERS {
        int id PK
        string regnum "UNIQUE"
        string email "UNIQUE"
        string password_hash
        string name
        string role "student | superadmin"
        int contribution_score
    }

    ALGORITHMS {
        int id PK
        string name
        string slug "UNIQUE"
        string repo_url
        string entry_point
        string explanation_entry
        int creator_id FK
        string branch "DEFAULT 'main'"
        datetime created_at
    }

    COMMENTS {
        int id PK
        int algorithm_id FK
        int user_id FK
        string message
        boolean is_fix_offer
        string fix_details_url
        datetime created_at
    }

    CONTRIBUTOR_APPLICATIONS {
        int id PK
        int algorithm_id FK
        int applicant_id FK
        string applicant_email
        string applicant_message
        string status "DEFAULT 'pending'"
        datetime created_at
    }
```

---

## 🔄 Core System Workflows (Sequence Diagrams)

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthController
    participant Database

    User->>Frontend: Fills Registration Form
    Frontend->>AuthController: POST /api/auth/signup
    AuthController->>Database: Check existing regnum
    Database-->>AuthController: Regnum Available
    AuthController->>AuthController: Hash Password (bcrypt)
    AuthController->>Database: INSERT into users
    Database-->>AuthController: Returns user ID
    AuthController->>AuthController: Generate JWT Token
    AuthController-->>Frontend: 201 Created (Token + User Data)
    Frontend->>User: Redirects to Explorer
```

### 2. GitHub Algorithm Ingestion Flow

The platform allows dynamic ingestion of simulations directly from GitHub, making it a highly extensible learning hub.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AlgoController
    participant GitHubIngestor
    participant GitHubAPI
    participant Database

    User->>Frontend: Submits GitHub Repo URL
    Frontend->>AlgoController: POST /api/algorithms/ingest (w/ JWT)
    AlgoController->>Database: Verify Repo is not duplicate
    Database-->>AlgoController: Ok
    AlgoController->>GitHubIngestor: ingest(repoUrl)
    GitHubIngestor->>GitHubAPI: Fetch zip archive of branch
    GitHubAPI-->>GitHubIngestor: ZIP Content
    GitHubIngestor->>GitHubIngestor: Extract ZIP & Move to static/simulations/
    GitHubIngestor-->>AlgoController: Return { slug, fullPath, branch }
    AlgoController->>Database: INSERT into algorithms (name, slug, repo_url...)
    AlgoController->>Database: Sync User Contribution Score
    Database-->>AlgoController: Score updated
    AlgoController-->>Frontend: 201 Success (slug, contribution_score)
```

### 3. Gamification & Commenting Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AlgoController
    participant Database

    User->>Frontend: Post Comment / Fix Offer on Simulation
    Frontend->>AlgoController: POST /api/algorithms/:slug/comments
    AlgoController->>Database: INSERT into comments
    Database-->>AlgoController: Comment Inserted
    AlgoController->>Database: Recalculate User Score (SQL)
    Note over Database: Score = (Algos * 10) + (Comments on others' algos)
    Database-->>AlgoController: Return new score
    AlgoController-->>Frontend: 201 Created (Comment + new score)
    Frontend->>User: UI Updates Score instantly
```

---

## 🚀 Deployment & Infrastructure

The project is designed with a Serverless mindset, ready for deployment on Vercel.

- **Frontend:** Built and exported by Vite.
- **Backend:** Hosted as a Vercel Serverless Function via `vercel.json` rewrites mapping `/api/*` to `backend/src/server.js`.
- **Database:** Auto-detects environment. If `TURSO_DATABASE_URL` is present, it uses `@libsql/client` to connect to the Turso Edge Database; otherwise, it falls back to local `sqlite3`.
- **Static Assets:** GitHub ingests are temporarily stored in `/tmp/simulations` on Vercel (due to serverless file system read-only constraints) and served directly through Express `express.static()`.

## 🛠 Prerequisites for Local Development

- **Node.js** v18+
- **NPM** or **Yarn**

### Running Locally

**1. Clone the repository:**
```bash
git clone <repository-url>
cd swarm-learning-system---sls
```

**2. Backend Setup:**
```bash
cd backend
npm install
npm start
```
*The backend will run on `http://localhost:3001` and create a local SQLite database in `backend/data/database.db`.*

**3. Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on `http://localhost:5173`.*

---
*Developed by the Swarm Learning Platform Team.*
