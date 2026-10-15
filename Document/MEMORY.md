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

## Bug fixes and audit log (2026-10-15)

### Root causes identified
- **BUG 1 (Invalid ID characters):** HTML `type="number"` allows `e`, `E`, `+`, `-`, and decimal points; backend `Integer.parseInt()` accepted signed integers like `+1` and threw generic errors without range/digit checks.
- **BUG 2 (Member name accepts numbers):** Neither frontend nor backend validated member names against digits or malformed characters.
- **BUG 3 (Duplicate member registration):** Backend registered any non-empty name directly into `members` ArrayList and incremented `nextMemberId` without performing a duplicate name check.
- **BUG 4 (Search case sensitivity & special chars):** `exchange.getRequestURI().getQuery()` returned an already-decoded query string; calling `URLDecoder.decode()` a second time converted `+` (e.g. `C++`) into spaces `C  `. Simple `toLowerCase()` lacked Unicode case folding. React only filtered client-side without query parameters.
- **BUG 5 (Form submission & error handling):** Buttons lacked disabled/loading states during async fetch, permitting duplicate clicks; network failures threw raw exceptions.

### Modified files
- `LibraryServer.java`: Added `parsePositiveId()`, `validateAndNormalizeMemberName()`, `findMemberByName()`, `Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)`, raw query parsing, 409 Conflict handling, and class-level synchronization.
- `App.jsx`: Replaced `type="number"` with `type="text"` and `inputMode="numeric"`, added regex `/[^0-9]/g` sanitization, client-side ID and Unicode name validation, inline name error, button loading/disabled states, and `URLSearchParams` book search/filter requests.
- `App.css`: Added styles for `.pill-button:disabled` and `.inline-error`.
- `Document/TASKS.md`: Updated checklist to reflect all 5 bug fixes and verification passes.
- `Document/MEMORY.md`: Updated with root cause analysis, modified files, test evidence, and audit results.

### Tests executed
- **Java Compilation:** `javac LibraryServer.java` compiled with 0 errors.
- **React Build:** `npm run build` completed in 2.54s with 0 errors.
- **Fine Calculation Test (`FineTest.java`):** Verified 5 scenarios (before due date, on due date, 1 day late, 3 days late, 7 days late) -> 100% PASS.
- **Automated API & Bug Audit Suite (`test_api_audit.py`):** 57 test assertions covering all reported bugs and core features -> 57/57 PASS (0 failures).
- **Browser Subagent E2E Test:** 12-step complete workflow executed and verified in live browser.

### Remaining limitations (intentional)
- **In-memory storage**: Data resides in Java `ArrayList`s and resets on server restart (explicit PRD constraint).
- **Single operator**: No multi-user sessions, authentication, or roles (per PRD/RULES).
- **Loan policy**: Fixed 7-calendar-day loan duration with ₹5/day fine (per PRD).

## Never change without asking
- React + Core Java (no Spring), ArrayList-based storage, no database, exactly the six topic features, seven-day loan/₹5 fine default, and the user-supplied design as visual reference.

## Architecture change policy
- The approved `ARCHITECHTURE.md` specifies a **single-root-folder** layout and must remain unchanged unless the user explicitly approves a further architecture change.


