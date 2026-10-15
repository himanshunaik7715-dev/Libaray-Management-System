# 📚 Smart Library Management System

A lightweight, full-stack library management system demonstrating core **Data Structures & Algorithms (DSA)** in Java with a modern **React + Vite** single-page frontend.

Built with **Zero Java Frameworks** (no Spring Boot, no external dependencies, no database) using Core Java's built-in `com.sun.net.httpserver.HttpServer` and in-memory `ArrayList` data storage.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture & How It Works](#-system-architecture--how-it-works)
3. [Key Features & Business Rules](#-key-features--business-rules)
4. [Data Structures & Algorithms (DSA)](#-data-structures--algorithms-dsa)
5. [Directory Structure](#-directory-structure)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Prerequisites & Getting Started](#-prerequisites--getting-started)
8. [UI & Design System](#-ui--design-system)
9. [Important Constraints & Characteristics](#-important-constraints--characteristics)

---

## 🌟 Project Overview

The Smart Library System manages book inventories, member memberships, book issues, and returns with automatic overdue fine calculation. It was created to demonstrate how algorithmic fundamentals (linear scanning, array traversal, time complexity) power a real-world web application without relying on heavy abstractions or database engines.

- **Frontend**: React 18, Vite 5, Vanilla CSS with custom tokens.
- **Backend**: Core Java 17+ (`HttpServer`), zero external libraries or Maven/Gradle wrappers.
- **Data Persistence**: In-memory `ArrayList` collections.
- **Communication**: RESTful JSON responses over HTTP with Vite reverse proxy.

---

## 🏗️ System Architecture & How It Works

The project uses a unified single-folder project layout while running as two independent, decoupled processes:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Web Browser (Client Side)                   │
│                   http://localhost:5173                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
            HTTP Requests (/api/books, /api/issue, etc.)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vite Development Server                     │
│                  (Reverse Proxy Engine)                     │
│  - Proxies '/api/*' -> 'http://localhost:8080/*'            │
│  - Strips '/api' prefix automatically                       │
│  - Eliminates browser Cross-Origin (CORS) issues            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                   Rewritten HTTP Requests (/books, /issue, etc.)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Core Java Server (LibraryServer.java)              │
│            com.sun.net.httpserver.HttpServer                │
│                 Running on Port: 8080                       │
├─────────────────────────────────────────────────────────────┤
│  Handler Routing:                                           │
│    - /books   -> BooksHandler (GET, POST)                   │
│    - /members -> MembersHandler (GET, POST)                 │
│    - /issue   -> IssueHandler (POST)                        │
│    - /return  -> ReturnHandler (POST)                       │
├─────────────────────────────────────────────────────────────┤
│  In-Memory Storage (Data Structures):                       │
│    - ArrayList<Book>                                        │
│    - ArrayList<Member>                                      │
│    - ArrayList<IssueRecord>                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1. Request Flow
1. The user interacts with the React UI at `http://localhost:5173`.
2. The UI sends a `fetch('/api/...')` request using standard URL-encoded form data for POST or query parameters for GET.
3. Vite's dev server intercepts all `/api/*` traffic, rewrites the URL (stripping `/api`), and forwards it to `http://localhost:8080`.
4. `LibraryServer.java` receives the HTTP request, executes thread-safe linear search and mutations on the `ArrayList` collections, and returns a JSON response.
5. React updates state and provides feedback alerts (gold, teal, or coral notifications).

---

## 🚀 Key Features & Business Rules

### 1. Book Catalog (`FR-01`)
- Add books with **Title** and **Author**.
- Each book receives an auto-incrementing integer ID starting at `1`.
- Seeded at startup with two demo books: *Java Basics* (James Gosling) and *DSA Fundamentals* (Robert Sedgewick).
- Each book entry represents **one physical copy** that is either Available or Issued.

### 2. Member Registration (`FR-02`)
- Register members by entering their **Full Name**.
- Each member receives an auto-incrementing integer ID starting at `1`.
- View all active members in an interactive table.

### 3. Issue Tracking (`FR-03`)
- Issue a book by supplying `bookId` and `memberId`.
- **Validation**:
  - Book ID and Member ID must exist.
  - The book must currently be marked `available = true`. An already issued book cannot be issued again.
- **Loan Duration**: Exactly **7 calendar days** (`issueDate = LocalDate.now()`, `dueDate = issueDate.plusDays(7)`).

### 4. Return Tracking & Overdue Fines (`FR-04` & `FR-05`)
- Return a book by providing its `bookId`.
- Finds the unreturned `IssueRecord` matching the book.
- Marks the issue record as returned and restores `book.setAvailable(true)`.
- **Fine Calculation Formula**:
  $$\text{lateDays} = \max(0, \text{daysBetween}(\text{dueDate}, \text{today}))$$
  $$\text{fine} = \text{lateDays} \times 5 \text{ INR}$$
- If returned on or before the due date, fine is ₹0.

### 5. Search & Filtering (`FR-06`)
- **Live Search**: Case-insensitive substring matching against both book **Title** and **Author**.
- **Availability Filter**: Toggle between "All Books" and "Available Only".

---

## 🧠 Data Structures & Algorithms (DSA)

All data storage and search algorithms are intentionally implemented using fundamental Java Data Structures without reliance on database indexes or query engines.

### Storage Models

| Model | Fields | Storage Type |
|---|---|---|
| `Book` | `id` (int), `title` (String), `author` (String), `available` (boolean) | `ArrayList<Book>` |
| `Member` | `id` (int), `name` (String) | `ArrayList<Member>` |
| `IssueRecord` | `bookId` (int), `memberId` (int), `issueDate` (LocalDate), `dueDate` (LocalDate), `returned` (boolean) | `ArrayList<IssueRecord>` |

### Algorithm Analysis

| Operation | Algorithm / Mechanism | Complexity |
|---|---|---|
| **Add Book / Member** | Append to end of dynamic array (`ArrayList.add()`) | **$O(1)$** amortized |
| **Find Book by ID** | Linear traversal inspecting `book.getId() == id` | **$O(B)$** where $B$ is number of books |
| **Find Member by ID** | Linear traversal inspecting `member.getId() == id` | **$O(M)$** where $M$ is number of members |
| **Find Active Issue** | Linear search for active loan `issue.getBookId() == id && !issue.isReturned()` | **$O(I)$** where $I$ is total issue records |
| **Search / Filter Catalog** | Traversal with case-insensitive string containment checking | **$O(B)$** |
| **Issue Book** | Find book ($O(B)$) + Find member ($O(M)$) + Add record ($O(1)$) | **$O(B + M)$** |
| **Return Book** | Find book ($O(B)$) + Find active issue ($O(I)$) + Date math | **$O(B + I)$** |

---

## 📁 Directory Structure

```text
smart-library/
├── App.css                  # UI styling with retro-teal and gold design tokens
├── App.jsx                  # Main React frontend component (Tabs, Forms, Tables)
├── LibraryServer.java       # Standalone Java HTTP server & in-memory DSA storage
├── index.html               # Frontend HTML5 entry file
├── main.jsx                 # React root mounting point
├── package.json             # NPM dependencies (React 18, Vite 5)
├── vite.config.js           # Vite dev server and /api proxy configuration
├── README.md                # Project documentation (this file)
└── Document/                # Project specifications and architecture docs
    ├── ARCHITECHTURE.md     # Single-folder architecture and runtime design
    ├── DESIGN.md            # Library design system adaptation
    ├── IP-DESIGN.md         # Reference visual palette tokens
    ├── MEMORY.md            # Engineering log and architectural decisions
    ├── PRD.md               # Product Requirements Document
    ├── RULES.md             # Implementation rules and constraints
    └── TASKS.md             # Development checklist and verification record
```

---

## 📡 API Endpoints Reference

The backend accepts `application/x-www-form-urlencoded` payloads for POST requests and returns `application/json`.

| Endpoint | Method | Parameters / Form Body | Description | Example Success Response |
|---|---|---|---|---|
| `/api/books` | `GET` | `search` *(optional)*<br>`filter` *(optional: `available`)* | List, search, or filter books | `[{"id":1,"title":"Java Basics","author":"James Gosling","available":true}]` |
| `/api/books` | `POST` | `title` *(String)*<br>`author` *(String)* | Add a new book to the catalog | `{"id":3,"title":"Clean Code","author":"Robert Martin","available":true}` |
| `/api/members` | `GET` | None | List all registered members | `[{"id":1,"name":"Alice Johnson"}]` |
| `/api/members` | `POST` | `name` *(String)* | Register a new member | `{"id":2,"name":"Bob Smith"}` |
| `/api/issue` | `POST` | `bookId` *(int)*<br>`memberId` *(int)* | Issue an available book for 7 days | `{"message":"Book issued successfully.","bookId":1,"dueDate":"2026-10-22"}` |
| `/api/return` | `POST` | `bookId` *(int)* | Return an issued book and calculate late fee | `{"message":"Book returned successfully.","lateDays":0,"fine":0}` |

> **Note**: Error responses return appropriate HTTP status codes (`400`, `405`) with a JSON payload: `{"error": "Descriptive message"}`.

---

## 🛠️ Prerequisites & Getting Started

### Prerequisites
- **Java Development Kit (JDK)**: Version 17 or higher (`javac -version` and `java -version`)
- **Node.js**: Version 18 or higher (`node -v`)
- **NPM**: Version 9 or higher (`npm -v`)

---

### Step-by-Step Running Guide

Because this project runs with two decoupled local processes, open **two terminal windows** in the project root (`smart-library`):

#### 🖥️ Terminal 1 — Backend (Java Server)

1. Compile the Java source code:
   ```bash
   javac LibraryServer.java
   ```
2. Start the HTTP server:
   ```bash
   java LibraryServer
   ```
   *Output confirmation:*
   ```text
   Smart Library Core Java HTTP Server is running on port 8080
   Endpoints available: /books, /members, /issue, /return
   ```

---

#### 💻 Terminal 2 — Frontend (React + Vite)

1. Install frontend dependencies (only needed the first time):
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Output confirmation:*
   ```text
     VITE v5.4.2  ready in 250 ms

     ➜  Local:   http://localhost:5173/
     ➜  Network: use --host to expose
   ```

---

### 🌐 Accessing the Application

Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 🎨 UI & Design System

The visual design system is inspired by the **Flip7 palette** (`IP-DESIGN.md` / `DESIGN.md`), featuring a modern, retro-playful look:

- **Primary Colors**:
  - Teal (`#2BA8A2`, Dark: `#1E8C86`, Light: `#3CC4BD`) - Core branding, headers, active tabs.
  - Background Tint (`#EFF8F7`) - Clean, soft, readable page surface.
- **Accents & CTAs**:
  - Radiant Gold (`#FFD23F`) - Pill-shaped primary action buttons (`border-radius: 999px`) with micro-interaction hover scales.
  - Coral (`#EF6C4A`) - Highlighting warnings, overdue fines, and "Issued" status badges.
- **Cards & Inputs**:
  - Pure White Cards (`#FFFFFF`) with soft teal shadows and vertical left-edge accent borders.
  - Soft Cream Inputs (`#FFF8E7`) with teal border focus highlights.
- **Status Indicators**:
  - Success Green (`#27AE60`) for "Available" badges and successful transactions.
  - Warning/Error Red (`#E74C3C`) for validation errors and overdue alerts.

---

## ⚠️ Important Constraints & Characteristics

1. **In-Memory Volatility**: Data is maintained in JVM heap memory (`ArrayList`). Restarting the Java server resets books and members back to default seeded values. This is an intentional educational design.
2. **Single-Copy Semantics**: Each catalog entry corresponds to one physical copy.
3. **No External Database**: No SQLite, MySQL, MongoDB, or ORM frameworks are used.
4. **No Third-Party Java Libraries**: Standard Java SE standard library only (`java.net`, `java.time`, `java.util`).
5. **Single Operator**: Built as an operator terminal interface without user roles, authentication, or session tokens.
