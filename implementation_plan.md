# Swarm Learning Platform - Collaborative GitHub-Linked Simulation Plan

This revised plan adapts the **Swarm Learning Platform** into a collaborative, community-driven ecosystem. Students discover algorithms, study their mechanics, run interactive simulations, and **contribute new ones by pasting GitHub repository URLs**. 

Additionally, students collaborate on existing algorithms by suggesting improvements, offering fixes, and applying to become developers.

---

## Core System Architecture & User Flow

```mermaid
graph TD
    User[Student / Collaborator] -->|Add GitHub Repo URL| Explorer[Algorithm Explorer Grid]
    Explorer -->|Triggers Backend Pull| GitPull[GitHub Ingestor & Validator]
    GitPull -->|Validates index.html & manifest.json| DB[(SQLite DB)]
    GitPull -->|Hosts Code statically| LocalHost[Same-Origin Serving]
    
    User -->|Views Algorithm| Detail[Algorithm Explorer Details]
    Detail -->|Tab 1| Sim[Interactive Iframe Simulation]
    Detail -->|Tab 2| Edu[Educational steps & Math: explanation.html]
    Detail -->|Tab 3| Collab[Feedback: Comments, Fixes, & Contributor Requests]
```

---

## 1. Simplified Dynamic Algorithm Ingestion via GitHub

Instead of manual zip files, algorithm creation is fully driven by Git integration:
1.  **Add Repo Form**: A student pastes their public GitHub Repository URL (e.g., `https://github.com/abdelrahman/swarm-aco`).
2.  **Repository Ingestion**: 
    *   The backend validates the URL pattern.
    *   It downloads the repository's latest master/main branch zip bundle using a fast, non-blocking HTTP fetch:
        `https://github.com/{username}/{repo}/archive/refs/heads/main.zip` or `archive/refs/heads/master.zip`.
    *   It unzips this archive directly into `backend/static/simulations/{slug}/`.
3.  **Module Validation**:
    *   The system checks for:
        *   `index.html` (Interactive simulation entrypoint).
        *   `explanation.html` (Educational step-by-step/math explanation, loaded directly in Tab 2).
        *   `manifest.json` (Algorithm metadata).
4.  **Author Contribution**: The system records the uploading student as the **Original Author** of the algorithm. This dynamically increases their ranking on the **Contribution Leaderboard**!

---

## 2. Updated Algorithm Page Structure (Three Pages / Tabs)

When a student clicks on an Algorithm Card from the main page, they are presented with a premium workspace containing three dedicated tabs:

### Page 1: Interactive Simulation Page (`index.html`)
*   Loads the dynamic simulation (`index.html`, `style.css`, `script.js` and local assets) in an isolated `iframe`.
*   Uses **Same-Origin Direct DOM Access** from the React app:
    *   React can read real-time stats directly (e.g., `iframe.contentDocument.getElementById('current-best-nectar').innerText`) via a simple DOM polling interval.
    *   React can feed parameters to the simulation inputs directly (e.g., modifying `iframe.contentDocument.getElementById('bee-count').value` and calling `.dispatchEvent(new Event('change'))`).
    *   React injects an override stylesheet to hide the local simulation sidebar (`.sidebar { display: none !important; }`), allowing the canvas to expand seamlessly inside the React dashboard.

### Page 2: Educational Steps & Math Page (`explanation.html`)
*   Loads a clean text/HTML file (`explanation.html`) bundled directly with the GitHub repository.
*   Shows the step-by-step algorithms mechanics, biological inspiration, and mathematical models (using standard math notations).
*   By rendering the file directly inside a styled container (or clean iframe), collaborators can easily write rich educational content using basic HTML structures.

### Page 3: Collaboration & Feedback Page (Comments, Fixes & Contribs)
*   **Discussion Board**: Standard comments section for students to talk about adjustments, performance improvements, or educational clarity.
*   **Offer a Fix**: A specialized form where students can submit patches, fix descriptions, or GitHub pull request URLs to improve the simulation.
*   **Contributor Application**: A "Become a Contributor" button where students supply their contact **email** and a brief message. This notifies the original creator, encouraging peer-to-peer coding collaboration.
*   Every approved improvement or verified review increases the helper's contribution index!

---

## 3. Contribution-First Leaderboard System

The first, primary page of the leaderboard ranks students strictly on their **Contributions to the Swarm Learning Ecosystem**:

$$\text{Contribution Score} = (100 \times \text{Algorithms Contributed}) + (25 \times \text{Validated Improvements/Fixes}) + (10 \times \text{Helpful Feedback Suggestions})$$

*   **Leaderboard Grid**:
    *   Rank #1: Abdelrahman Mamdouh (3 Algorithms Contributed, 5 Fixes Offered) -> **Score: 425**
    *   Rank #2: ...

---

## 4. Simplified Database Schema (SQLite)

We model these exact collaborative relationships using SQLite (`backend/database.db`):

```mermaid
erDiagram
    USERS {
        integer id PK
        string email UK
        string password_hash
        string name
        string role "student | collaborator"
        integer contribution_score "Calculated rank base"
    }
    ALGORITHMS {
        integer id PK
        string name
        string slug UK
        string repo_url "GitHub Repository URL"
        string entry_point "index.html"
        string explanation_entry "explanation.html"
        integer creator_id FK "Student who linked it"
        datetime created_at
    }
    COMMENTS {
        integer id PK
        integer algorithm_id FK
        integer user_id FK
        string message
        boolean is_fix_offer "If this offers a code fix"
        string fix_details_url "Optional PR or patch info"
        datetime created_at
    }
    CONTRIBUTOR_APPLICATIONS {
        integer id PK
        integer algorithm_id FK
        integer applicant_id FK
        string applicant_email
        string applicant_message
        string status "pending | approved | rejected"
        datetime created_at
    }

    USERS ||--o{ ALGORITHMS : "contributes"
    USERS ||--o{ COMMENTS : "posts"
    USERS ||--o{ CONTRIBUTOR_APPLICATIONS : "submits"
    ALGORITHMS ||--o{ COMMENTS : "receives"
    ALGORITHMS ||--o{ CONTRIBUTOR_APPLICATIONS : "hosts"
```

---

## 5. Front-End Interface Flow

*   **Explorer Route (`/explorer`)**:
    *   Visual Grid of all dynamic cards.
    *   Includes a special, premium card: `[ + Contribute New Algorithm ]`.
    *   Clicking the special card opens a glassmorphism modal requesting:
        *   Algorithm Name & Description.
        *   GitHub Repository URL (e.g. `https://github.com/user/aco-simulation`).
        *   Difficulty Level (Beginner/Intermediate/Advanced).
3.  **Details Workspace (`/algorithm/:slug`)**:
    *   Header highlighting original student author and GitHub repository source.
    *   Beautiful tab bar with 3 states:
        *   `[ 🎮 Live Simulation ]` -> Hosts interactive Same-Origin iframe.
        *   `[ 📖 Biological & Math Explanation ]` -> Embeds `explanation.html` description.
        *   `[ 💬 Comments & Contributions ]` -> Thread of comments, "Offer a Fix" logs, and a Contributor Contact form.

---

## 6. Design System & UI Aesthetics

To ensure a premium, engaging, and cohesive user experience, the frontend will strictly adhere to the following design system:

### Color Palette
*   **Primary (`#4A7C59`)**: Muted green, used for primary actions, active states, and dominant UI elements.
*   **Secondary (`#D4AF37`)**: Gold/mustard yellow, used for highlights, secondary buttons, warnings, and accents.
*   **Tertiary (`#8FA895`)**: Light sage green, used for subtle backgrounds, inactive elements, or supportive UI features.
*   **Neutral (`#1A2F23`)**: Very dark green/charcoal, serving as the main background color for a sleek, deep dark-mode aesthetic.

### Typography
*   **Headlines**: *Source Serif Four* - Used for main titles, page headers, and prominent algorithm names.
*   **Body**: *Hanken Grotesk* - Used for general paragraphs, descriptions, and educational content.
*   **Labels/Code**: *Jetbrains Mono* - Used for tags, UI labels, metadata, and code snippets.

### UI Components & Styling
*   **Buttons**: Pill-shaped with generous border radius. Variants include Solid (Primary/Secondary), Inverted, and Outlined.
*   **Inputs & Search**: Rounded corners with a dark background and subtle borders, integrating seamlessly into the dark theme.
*   **Navigation & Icons**: Floating, pill-shaped navigation bars with clean, rounded icon buttons.
*   **General Vibe**: The application should feel organic yet modern, utilizing the deep green background with vibrant green and gold accents to evoke a sense of nature (swarms) combined with high-tech algorithms.

---

## 7. SOLID & Clean Code Architecture

The backend and frontend will adhere to Robert C. Martin's SOLID principles to ensure maintainability and scalability:

*   **Single Responsibility Principle (SRP)**: Modules have one job. `GitHubIngestor` only downloads zips. `ManifestValidator` only checks metadata. `AlgorithmController` only handles HTTP routing.
*   **Open/Closed Principle (OCP)**: Core systems are open to extension but closed to modification. We will use Strategy patterns for `StorageService` (e.g., local storage vs cloud storage in future) without altering core ingest logic.
*   **Liskov Substitution Principle (LSP)**: Any subclass or implementation must be substitutable for its base interface. All database repositories will implement a standard `IRepository` interface so the database layer can be swapped.
*   **Interface Segregation Principle (ISP)**: API endpoints and React contexts will be split into smaller, domain-specific interfaces (e.g., `SimulationAPI` vs `CollaborationAPI`) rather than one monolithic service.
*   **Dependency Inversion Principle (DIP)**: High-level business logic will depend on abstractions (interfaces), not concrete implementations like direct SQLite queries. Dependency Injection (DI) will provide the necessary concrete classes at runtime.

---

## Verification Plan

### Manual Verification Flow
1.  **Clone Ingestion Simulation**: Trigger backend pull with a mock repository, confirming that the files extract successfully to `backend/static/simulations/` and populate SQL models.
2.  **Direct DOM Integration Check**: Toggle sliders on our React page to verify values change inside the simulation iframe instantly, and observe output metrics syncing in real-time.
3.  **Tab Verification**: Verify switching between the Simulation, Educational text (`explanation.html`), and Comment cards renders correctly with isolated states.
4.  **Feedback & Application Flow**: Fill out a contributor request, verify it saves correctly to SQLite, and check that the contributor score increments the student's global contribution rank.

---

## 8. Premium UI Overhaul (Match Reference Photo)

### User Review Required
> [!IMPORTANT]
> The current layout uses the correct color palette but lacks the structural depth and specific styling of the provided reference image. We will overhaul `Explorer.jsx` and the global CSS.

### Proposed Changes

#### Frontend Components
##### [MODIFY] `frontend/src/index.css`
- Add modern fonts (`Inter` for body, `Syne` or `Outfit` for display headings) if possible, or refine usage of current fonts.
- Add utility classes for pills, badges, and layout grids to perfectly match the design.
- Implement specialized buttons (`btn-forge` for the gold button, `btn-observe` for the dark outline button).

##### [MODIFY] `frontend/src/App.jsx`
- Remove the current generic header.
- Allow `Explorer.jsx` to control the top-level hero section to match the "Channel Collective Intelligence" design.

##### [MODIFY] `frontend/src/pages/Explorer.jsx`
- **Hero Section**: Implement the centered text block with the "Primordial Phase v4.2" badge, "Channel Collective Intelligence" header, and the two main action buttons (Forge Algorithm, Observe Ether).
- **Main Layout Grid**: Split the bottom area into a main content column (70%) for "Emergent Swarms" and a right sidebar (30%) for "Communal Resonance".
- **Algorithm Cards**: Redesign cards to include tags (e.g., "Lithic Stability"), descriptive text, and stat badges, matching the dark green glassmorphism style.
- **Sidebar**: Add mock data for recent activity and tags ("Shifting Currents", "Harmonic Sync Rate") to match the reference design exactly.

### Verification Plan for UI
- **Visual Match**: The user will view the page at `http://localhost:5173` and confirm it closely matches the provided reference photo.
