# Smart Library — Architecture (Single Project Folder)

> **Approved change:** Replace separate `backend/` and `frontend/` source folders with one project root. This document describes the **target structure**, not a claim that the existing source files have already been moved.
>
> The filename `ARCHITECHTURE.md` intentionally retains the requested spelling.

## 1. Goal and scope

A minimal local Smart Library Management System demonstrating Java `ArrayList`, traversal, and linear search. Deliver only the six features specified in `PRD.md`: book catalog, member registration, issue, return, overdue fines, and book search/filter. No database, authentication, Spring Boot, build tools for Java, or extra services.

**One folder does not mean one runtime:** React/Vite and Java still run as **two local processes**. Keeping one directory is a repository organization change, not a way to execute Java inside React.

## 2. Proposed single-folder structure

```text
smart-library/
├── LibraryServer.java       # Core Java HTTP server + models + ArrayLists
├── App.jsx                  # React interface and API requests
├── App.css                  # Styles following IP-DESIGN.md / DESIGN.md
├── main.jsx                 # React entry point
├── index.html               # Browser HTML entry
├── vite.config.js           # Vite proxy: /api -> localhost:8080
├── package.json             # React and Vite dependencies
├── PRD.md
├── ARCHITECHTURE.md         # This document
├── RULES.md
├── DESIGN.md
├── TASKS.md
├── MEMORY.md
└── IP-DESIGN.md           # Original design reference
```

`node_modules/`, `dist/`, and `*.class` are generated artifacts and should not be committed. There are no separate backend/frontend directories, nor a database directory.

## 3. Runtime architecture

```text
Browser (http://localhost:5173)
        │
        ▼
React: index.html → main.jsx → App.jsx + App.css
        │
        │ fetch('/api/books'), fetch('/api/members'), etc.
        ▼
Vite dev server (http://localhost:5173)
        │ proxy: /api/* → http://localhost:8080/*
        ▼
Core Java: LibraryServer.java
com.sun.net.httpserver.HttpServer (http://localhost:8080)
        │
        ├── ArrayList<Book>
        ├── ArrayList<Member>
        └── ArrayList<IssueRecord>
```

The Vite proxy avoids development-time cross-origin requests. The browser uses relative `/api` paths. Java keeps the existing route names (`/books`, `/members`, `/issue`, `/return`); Vite removes `/api` before forwarding. No extra npm packages are necessary for the proxy.

## 4. Data structures and models

All data is held in Java memory:

| Object | Fields | Storage |
|---|---|---|
| Book | `id`, `title`, `author`, `available` | `ArrayList<Book>` |
| Member | `id`, `name` | `ArrayList<Member>` |
| IssueRecord | `bookId`, `memberId`, `issueDate`, `dueDate`, `returned` | `ArrayList<IssueRecord>` |

Identifiers use incrementing counters. The server can seed two demo books; restarting resets all data. A book has one available copy in this minimal implementation.

## 5. API contracts

Frontend requests use `/api/...`; Java handles the matching route without `/api`.

| Browser endpoint | Method | Form fields | Purpose |
|---|---|---|---|
| `/api/books` | GET | Optional search/filter query | List, search, filter books |
| `/api/books` | POST | `title`, `author` | Add book |
| `/api/members` | GET | — | List members |
| `/api/members` | POST | `name` | Register member |
| `/api/issue` | POST | `bookId`, `memberId` | Issue available book |
| `/api/return` | POST | `bookId` | Return active issue; calculate fine |

Use `application/x-www-form-urlencoded` for POST requests as in the existing Java implementation, and JSON for responses. The backend validates required inputs, IDs, member existence, book availability, and active loans.

### Core business rules

- Issue period: 7 calendar days from issue date (`LocalDate`).
- Fine: `max(0, daysBetween(dueDate, returnDate)) × ₹5`.
- A book cannot be issued twice while already issued.
- Returning a book marks its active issue returned and makes the book available again.
- Search/filter uses `ArrayList` traversal; no database or search engine.

## 6. Algorithm complexity

Let `B` = number of books, `M` = members, and `I` = issue records.

| Operation | DSA approach | Complexity |
|---|---|---|
| Add book/member | `ArrayList.add()` | Amortized O(1) |
| Find book/member | Linear scan | O(B) / O(M) |
| List/search/filter | Traverse books | O(B), plus string matching |
| Issue | Find book, member; add record | O(B + M) |
| Return | Find book and active issue | O(B + I) |

## 7. Required changes to existing source (not yet implemented)

The previous implementation was split into `backend/` and `frontend/`. To adopt this architecture:

1. Move `LibraryServer.java` from `backend/` to the project root.
2. Move `App.jsx`, `App.css`, and `main.jsx` from `frontend/src/` to the root.
3. Move `index.html` and `package.json` from `frontend/` to the root.
4. Update `index.html` script to `src="/main.jsx"`.
5. Add root `vite.config.js` with the `/api` proxy and rewrite.
6. Change frontend API calls from `http://localhost:8080/books` (and other paths) to relative `/api/books` (and equivalents).
7. Preserve all existing Java handlers; optional CORS headers may remain but are unnecessary when using the Vite proxy.
8. Apply the styling specified by `IP-DESIGN.md` through the library adaptation in `DESIGN.md`.
9. Test all six workflows before marking migration tasks complete.

### `vite.config.js` target

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

Vite can run the current React JSX entry without adding an additional React plugin.

## 8. Local execution after migration

**Prerequisites:** JDK 17+ and Node.js/npm.

Open two terminals **in the same `smart-library/` folder**:

Terminal 1 — Java:
```bash
javac LibraryServer.java
java LibraryServer
```

Terminal 2 — React:
```bash
npm install
npm run dev
```

Visit `http://localhost:5173`.

`npm run build` only builds the React client; it **does not package or launch the Java server**. This architecture is intended for a quick local demonstration, not production deployment.

## 9. Constraints and documentation ownership

- No separate `backend/` or `frontend/` source directory.
- Do not replace Core Java `HttpServer` with Spring Boot or introduce a database.
- Preserve the design system from `IP-DESIGN.md`; only adapt the game-specific elements to library UI.
- `PRD.md` owns the feature scope, `DESIGN.md` owns the UI adaptation, `RULES.md` owns coding constraints, `TASKS.md` tracks implementation, and `MEMORY.md` records decisions.
- This architecture change is **documented only** until the user asks to migrate/build the code. Supporting documentation is aligned with this approved target structure; source migration remains pending.
