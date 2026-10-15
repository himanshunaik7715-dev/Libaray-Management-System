# Project Memory / Working Context

> Keep this file up-to-date so a future coding session can continue without redesigning the project.

## Objective and locked decisions
- Project: **Smart Library System**, a short DSA-focused working demo.
- Required scope: books, members, issue/return, overdue fine, search/filter.
- Frontend: **React + Vite**. Backend: **Core Java built-in `HttpServer`**, not Spring Boot.
- Data structures: three Java `ArrayList`s; linear searches. **No DB**.
- Design authority: uploaded **`IP-DESIGN.md`** (Flip7 retro-playful teal/coral/gold), adapted in `DESIGN.md` for library use.
- Goal: uncomplicated, approximately 30-minute MVP; avoid new features.

## Approved layout vs existing prototype
- **Approved target:** one root directory containing `LibraryServer.java`, `App.jsx`, `App.css`, `main.jsx`, `index.html`, `vite.config.js`, `package.json`, and seven Markdown documents. No `frontend/` or `backend/` directories.
- **Status:** Complete. The single-root layout is fully implemented, compiled, and verified end-to-end. All required source files are in the project root.

## Implemented behavior in current code
- Backend adds two sample titles at startup: *Java Basics* and *DSA Fundamentals*.
- `GET /books` supports `search` and `filter=available`; frontend also filters locally by title and author.
- `POST /books` takes `title`, `author`; `GET /members` lists; `POST /members` takes `name`.
- `POST /issue` takes `bookId`, `memberId`; `POST /return` takes `bookId`.
- Issue records are kept in the in-memory `issues` list; no UI for historical records.
- 7 calendar days to return; ₹5 per day after due date; no negative fines.
- User gets a due date after issuing and overdue/fine info after returning.

## Runtime (after code migration)
- API server: `http://localhost:8080`; React/Vite: `http://localhost:5173`.
- From project root terminal 1: `javac LibraryServer.java` then `java LibraryServer`.
- From project root terminal 2: `npm install` then `npm run dev`.
- React uses relative `/api/*` requests; root Vite proxy strips `/api` when forwarding to Java routes. No cross-origin browser requests needed.
- JDK 17+ and Node/npm needed. No Maven, Spring Boot or database.

## Known limitations (intentional)
- **No persistence**: server restart resets books, members, loans and IDs.
- No authentication or concurrent multi-operator workflow.
- One catalog entry = one copy; fine uses calendar dates, not hourly timing.
- Validation is basic; no duplicate-title prevention, bulk import, payments or history UI.

## Update log
- **2026-10-15:** Complete implementation and verification achieved:
  1. Built `LibraryServer.java` using Core Java `HttpServer` and `ArrayList` storage with O(B), O(M), O(I) linear scan DSA algorithms.
  2. Built `App.jsx`, `App.css`, `main.jsx`, `index.html`, `vite.config.js`, `package.json` in project root.
  3. Styled with exact `IP-DESIGN.md` / `DESIGN.md` design system (Teal, Gold pill CTAs, Coral status, Cream input fields, White cards with left accent borders).
  4. Verified Java compilation (`javac LibraryServer.java`) on Java 20.
  5. Verified React production build (`npm run build`) via Vite 5.4.
  6. Tested all 6 workflows through automated API test suite and browser subagent recording (`smart_library_demo_1792079190111.webp`).
  7. Updated `TASKS.md` and `MEMORY.md`.

## Never change without asking
- React + Core Java (no Spring), ArrayList-based storage, no database, exactly the six topic features, seven-day loan/₹5 fine default, and the user-supplied design as visual reference.

## Architecture change policy
- The approved `ARCHITECHTURE.md` specifies a **single-root-folder** layout and must remain unchanged unless the user explicitly approves a further architecture change.

