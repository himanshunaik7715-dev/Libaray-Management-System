# Product Requirements Document (PRD)

## Project
**Name:** Smart Library System  
**Type:** Local, single-operator DSA demonstration  
**Stack:** React + Vite frontend, Core Java built-in `HttpServer`, `ArrayList` storage  
**Target:** Minimal end-to-end implementation, approximately 30 minutes of focused setup/development if prerequisites are installed.

## Problem statement
Manage a book catalog, member registration, issue/return tracking, and overdue fine calculation through a searchable interface for browsing and filtering books.

## Goals and acceptance criteria
| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Book catalog | Operator can add a book with title and author; each book receives an ID; the list displays ID, title, author and availability. |
| FR-02 | Member registration | Operator can register a name; each member receives an ID; registered members are listed. |
| FR-03 | Issue tracking | Given existing book and member IDs, the system issues an available book, saves an issue record and shows its due date. |
| FR-04 | Return tracking | Given an issued book ID, the system closes the active record and makes the book available again. |
| FR-05 | Overdue fine | On return, the system calculates `lateDays = max(0, daysBetween(dueDate, today))` and `fine = lateDays * 5` INR. |
| FR-06 | Search and filter | Operator can search catalog by title **or author** (case-insensitive) and filter to available books. |

## User and workflows
**User:** One person operating the library interface locally (no accounts or roles).
1. Add one or more books; view catalog.
2. Register a member; note assigned member ID.
3. Enter book and member IDs to issue a book; see due date.
4. Enter book ID to return it; see fine and late days.
5. Search or filter books at any time.

## Business rules
- Each catalog entry represents **one copy** of a book.
- IDs start at 1 and increase automatically for books and members independently.
- Initial catalog contains two demo books: *Java Basics* and *DSA Fundamentals*.
- Issue duration: **7 calendar days** from issue date.
- Overdue charge: **₹5 for each full calendar day** after the due date; no fine on or before due date.
- An unavailable book cannot be issued again until returned.
- Issue requires valid book ID and member ID; return requires an active issue for that book.
- Empty required fields, invalid numeric IDs and invalid operations return an error.

## Screens (one-page app)
- **Books tab:** add-book form; search input; All Books / Available Only filter; catalog table.
- **Members tab:** register-member form; members table.
- **Issue / Return tab:** issue form, return form, due-date/fine feedback.
- Show readable success/error feedback; no separate pages.

## API contract (current implementation)
| Method | Path | Inputs | Success |
|---|---|---|---|
| GET | `/books` | Optional query: `search`, `filter=available` | `200` book array |
| POST | `/books` | Form: `title`, `author` | `201` book object |
| GET | `/members` | None | `200` member array |
| POST | `/members` | Form: `name` | `201` member object |
| POST | `/issue` | Form: `bookId`, `memberId` | `200` message, `dueDate` |
| POST | `/return` | Form: `bookId` | `200` message, `lateDays`, `fine` |

POST input is `application/x-www-form-urlencoded`; responses are JSON. Validation errors return HTTP 400 with `{ "error": "..." }`. The UI presently performs search/filter locally after requesting the full book list; the backend also supports these query parameters.

## Constraints and non-goals
- No database, login, roles, barcode scanning, email, payments, reservations, renewals, sorting, or multiple-copy inventory.
- Records are **in memory only** and are lost on Java process restart. This is not production-ready.
- No persistent issue-history screen is required: issue records exist in backend memory for tracking active loans/fines.
- Frontend and backend are expected to run locally on ports 5173 and 8080.

## Definition of done
All six feature requirements work from the React UI against the running Java server; issue/return status changes and errors display correctly; the code compiles and runs without Spring Boot or a DB.
