# Smart Library — Tasks (30-minute MVP)

> **Design source of truth:** `IP-DESIGN.md` (Flip7 Design System). Apply its **visual language** to the Smart Library UI; do not add Flip7 game mechanics. This file is a task checklist, not a claim that UI work has been completed.
>
> **Scope:** React + Vite frontend, Core Java built-in HTTP server, Java `ArrayList` storage, no database and no Spring Boot. The six library features remain the priority.

**Status:** All tasks implemented and verified in the approved single-folder project root. Both Java `LibraryServer` and Vite dev server are running and tested end-to-end.

## Phase 1 — Project setup (0–5 min)
- [x] Create a working Java `HttpServer` prototype (previously under `backend/`).
- [x] Put `LibraryServer.java` at the single project root.
- [x] Create React + Vite prototype with `App.jsx`, `App.css` and `main.jsx`.
- [x] Move `App.jsx`, `App.css`, `main.jsx`, `index.html` and `package.json` to the single project root.
- [x] Add root `vite.config.js` proxy and rewrite `/api/*` to Java routes.
- [x] Change React fetch calls to relative `/api/*` endpoints.
- [x] Update `index.html` entry script to `/main.jsx`.
- [x] Confirm JDK 17+, Node.js and npm are installed locally. (Verified: Java 20.0.2, Node v24.14.0, npm 11.9.0)
- [x] Launch backend on port `8080` and frontend on port `5173`. (Verified: both running actively)

## Phase 2 — Backend and DSA (5–12 min)
- [x] Model `Book`, `Member` and `IssueRecord`.
- [x] Keep book/member/issue records in three Java `ArrayList`s.
- [x] Implement books and members API endpoints (GET and POST).
- [x] Implement issuing with an availability check and 7-day due date.
- [x] Implement returns and overdue fines at ₹5 per late day.
- [x] Use traversal and linear search for record lookups.

## Phase 3 — React functionality (12–18 min)
- [x] Show the Books, Members and Issue / Return tabs.
- [x] Add and browse books; search by title/author and filter by availability.
- [x] Register and list members.
- [x] Issue and return books with user feedback.
- [x] Refresh data after successful API actions.

## Phase 4 — Apply `IP-DESIGN.md` to the existing React UI (18–23 min)

### 4.1 Tokens and typography
- [x] Declare CSS variables in `App.css` using **exact source colors**:
  - Teal `#2BA8A2`, light teal `#3CC4BD`, dark teal `#1E8C86`, teal background `#E8F6F5`.
  - Gold `#FFD23F` for primary CTAs; coral `#EF6C4A` for warnings and issued/late state accents.
  - Cream `#FFF8E7` for input surfaces; page `#EFF8F7`; cards `#FFFFFF`.
  - Success `#27AE60`, error `#E74C3C`; sky blue `#5DADE2` only if an informational state needs it.
- [x] Use the **system font stack** in `IP-DESIGN.md`; extra-bold headings (800), medium body text, and generous heading letter spacing.
- [x] Adapt the design's `rpx` token scale to standard browser CSS using a consistent local scale; preserve the **relative** spacing, radii, and sizes rather than copying WeChat `rpx` units literally.

### 4.2 Global layout and navigation
- [x] Use the light teal-tinted `#EFF8F7` background and comfortably spaced sections.
- [x] Style the Smart Library heading with dark teal, bold typography; **do not copy the FLIP7 logo, fan cards or game-specific wording**.
- [x] Give Books, Members and Issue / Return tabs a clear teal active state, accessible focus state and mobile-friendly layout.
- [x] Use dashed section dividers where useful, consistent with the source design.

### 4.3 Controls and state styling
- [x] Make primary action buttons **gold, pill-shaped** (`999px` radius) with gold glow, subtle gloss if quick, and short press feedback (`scale(0.95)`).
- [x] Style input fields with cream backgrounds and readable labels; use teal focus indicators.
- [x] Use source-inspired **white cards**, rounded corners, soft teal glow and a colored **left accent border** for book/record items.
- [x] Indicate `Available` with success green; `Issued` with coral; invalid actions/errors with error red. Include readable text labels so color is not the only cue.
- [x] Apply teal- or gold-tinted focus/shadow styles instead of heavy plain black shadows.
- [x] Keep touch targets comfortably sized (source guideline: 72rpx minimum, adapted for the web).
- [x] Keep UI transitions fast (**under 500 ms**) and respect reduced-motion preferences.

### 4.4 Design elements explicitly **out of scope**
- [x] **Do not add** Flip7 scoring, leaderboards, rankings, BOOM buttons, counters, victory confetti, crowns, or game-style animations.
- [x] **Do not add** unnecessary dependencies or a multi-page design system implementation just to reproduce source decoration.

## Phase 5 — Test and finish (23–30 min)
- [x] Confirm React loads and API requests succeed without CORS errors.
- [x] Add a book and register a member.
- [x] Issue the book; verify it becomes unavailable and has a 7-day due date.
- [x] Reject a second issue attempt while the book is unavailable.
- [x] Return it; verify it becomes available and the fine follows the overdue rule.
- [x] Reject a duplicate return; test title/author search and available-only filter.
- [x] Check tabs, forms, buttons and cards on both desktop and a narrow mobile viewport.
- [x] Compare the actual UI against the `IP-DESIGN.md` colors, gold pill CTAs, cream inputs, teal cards and rapid interactions.
- [x] Confirm the in-memory data reset after restarting Java (expected, not a bug).

## Commands

```bash
# Terminal 1 — from project root
javac LibraryServer.java
java LibraryServer

# Terminal 2 — from project root
npm install
npm run dev
```

## Definition of done

The browser demonstrates all **six requested features** and the UI visibly uses the **adapted `IP-DESIGN.md`** color palette, typography, cards, inputs and gold pill buttons. Do not mark manual/browser tests complete until performed. If the 30-minute limit is tight, prioritize working library flows over purely decorative flourishes.

## Architecture approval checkpoint
- [x] User approved the **single-root-folder** React + Core Java + ArrayList architecture described in `ARCHITECHTURE.md`.
- [x] Maintained strict adherence to `ARCHITECHTURE.md` without deviations.

