import React, { useState, useEffect } from 'react';

// Form-encoded POST helper as required by PRD and ARCHITECTURE
async function postForm(url, data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: params.toString(),
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to communicate with the server. Please check your connection.');
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || `Server returned error (${response.status})`);
  }
  return json;
}

// Validation helper for positive integer IDs (1 to 2147483647)
function validateIntegerId(value, fieldName) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return `${fieldName} is required.`;
  }
  const trimmed = value.trim();
  // Reject characters like e, E, +, -, decimal points, scientific notation
  if (!/^[0-9]+$/.test(trimmed)) {
    return `${fieldName} must contain digits only (no signs, decimals, or scientific notation).`;
  }
  // Reject 0 and values with only zeroes
  if (trimmed === '0' || /^0+$/.test(trimmed)) {
    return `${fieldName} must be a positive integer greater than 0.`;
  }
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num <= 0 || num > 2147483647) {
    return `${fieldName} must be a valid positive integer between 1 and 2147483647.`;
  }
  return null;
}

// Validation helper for member full name (supports international Unicode letters and spaces)
function validateMemberName(rawName) {
  if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
    return { valid: false, error: 'Member full name is required.' };
  }
  const trimmed = rawName.trim();
  // Explicitly reject numeric characters
  if (/\d/.test(trimmed)) {
    return { valid: false, error: 'Member name cannot contain numbers.' };
  }
  // Normalize repeated internal spaces to single spaces first
  const normalized = trimmed.replace(/\s+/g, ' ');
  // Validate Unicode letters, spaces, hyphens, and apostrophes
  if (!/^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u.test(normalized)) {
    return { valid: false, error: 'Member name must contain only alphabetic letters and spaces.' };
  }
  return { valid: true, normalized };
}

// Validation helper for book title
function validateBookTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
    return { valid: false, error: 'Book title is required and cannot be empty.' };
  }
  const trimmed = rawTitle.trim();
  const normalized = trimmed.replace(/\s+/g, ' ');
  // Reject numeric-only titles (project-specific restriction)
  if (/^[0-9]+$/.test(normalized)) {
    return { valid: false, error: 'Book title cannot be numeric-only.' };
  }
  // Must contain alphabetic characters (rejects @@@, !!!, etc.)
  if (!/\p{L}/u.test(normalized)) {
    return { valid: false, error: 'Book title must contain alphabetic characters.' };
  }
  // Allowed characters: letters, numbers, spaces, common punctuation (. , : ; ' " ( ) & ! ? + # / -)
  if (!/^[\p{L}0-9\s.,:;'"()&!?+#\/-]+$/u.test(normalized)) {
    return { valid: false, error: 'Book title contains invalid special characters.' };
  }
  return { valid: true, normalized };
}

// Validation helper for author name
function validateAuthorName(rawAuthor) {
  if (!rawAuthor || typeof rawAuthor !== 'string' || !rawAuthor.trim()) {
    return { valid: false, error: 'Author name is required and cannot be empty.' };
  }
  const trimmed = rawAuthor.trim();
  const normalized = trimmed.replace(/\s+/g, ' ');
  // Reject numeric characters
  if (/\d/.test(normalized)) {
    return { valid: false, error: 'Author name cannot contain numbers.' };
  }
  // Must contain alphabetic characters
  if (!/\p{L}/u.test(normalized)) {
    return { valid: false, error: 'Author name must contain alphabetic characters.' };
  }
  // Allowed: multi-word names starting with letters, periods, apostrophes, hyphens
  if (!/^[\p{L}][\p{L}.'-]*(?:\s+[\p{L}][\p{L}.'-]*)*$/u.test(normalized)) {
    return { valid: false, error: 'Author name must contain only alphabetic letters, spaces, and valid punctuation (., -, \').' };
  }
  return { valid: true, normalized };
}

export default function App() {
  // Navigation tab state: 'books' | 'members' | 'issue-return'
  const [activeTab, setActiveTab] = useState('books');

  // Core data states
  const [allBooks, setAllBooks] = useState([]);
  const [catalogBooks, setCatalogBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  // Books tab form and search states
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [titleError, setTitleError] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'available'
  const [bookFeedback, setBookFeedback] = useState(null);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  // Members tab form state
  const [newMemberName, setNewMemberName] = useState('');
  const [memberNameError, setMemberNameError] = useState('');
  const [memberFeedback, setMemberFeedback] = useState(null);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Issue / Return tab form states
  const [issueBookId, setIssueBookId] = useState('');
  const [issueMemberId, setIssueMemberId] = useState('');
  const [issueFeedback, setIssueFeedback] = useState(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const [returnBookId, setReturnBookId] = useState('');
  const [returnFeedback, setReturnFeedback] = useState(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Fetch all books (unfiltered) for total counters and quick selection chips
  const fetchAllBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error('Failed to load books');
      const data = await res.json();
      setAllBooks(data);
      setServerError('');
    } catch (err) {
      setServerError('Unable to connect to Core Java backend. Ensure LibraryServer is running on port 8080.');
    }
  };

  // Fetch catalog books with search and filter using URLSearchParams
  const fetchCatalogBooks = async (search = searchQuery, filter = filterMode) => {
    try {
      const params = new URLSearchParams();
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      if (filter === 'available') {
        params.append('filter', 'available');
      }
      const queryStr = params.toString();
      const url = queryStr ? `/api/books?${queryStr}` : '/api/books';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load catalog');
      const data = await res.json();
      setCatalogBooks(data);
      setServerError('');
    } catch (err) {
      setServerError('Unable to connect to Core Java backend. Ensure LibraryServer is running on port 8080.');
    }
  };

  // Fetch all members
  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      setMembers(data);
      setServerError('');
    } catch (err) {
      setServerError('Unable to connect to Core Java backend. Ensure LibraryServer is running on port 8080.');
    }
  };

  // Initial load
  useEffect(() => {
    Promise.all([fetchAllBooks(), fetchMembers()]).finally(() => setLoading(false));
  }, []);

  // Update catalog when search query or filter mode changes
  useEffect(() => {
    fetchCatalogBooks(searchQuery, filterMode);
  }, [searchQuery, filterMode]);

  // Handler: Add Book
  const handleAddBook = async (e) => {
    e.preventDefault();
    const titleVal = validateBookTitle(newTitle);
    if (!titleVal.valid) {
      setBookFeedback({ type: 'error', message: titleVal.error });
      setTitleError(titleVal.error);
      return;
    }
    const authorVal = validateAuthorName(newAuthor);
    if (!authorVal.valid) {
      setBookFeedback({ type: 'error', message: authorVal.error });
      setAuthorError(authorVal.error);
      return;
    }

    setIsSubmittingBook(true);
    try {
      const created = await postForm('/api/books', {
        title: titleVal.normalized,
        author: authorVal.normalized,
      });
      setBookFeedback({
        type: 'success',
        message: `Book "${created.title}" added successfully with ID #${created.id}.`,
      });
      setNewTitle('');
      setNewAuthor('');
      setTitleError('');
      setAuthorError('');
      await Promise.all([fetchAllBooks(), fetchCatalogBooks(searchQuery, filterMode)]);
    } catch (err) {
      setBookFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Handler: Register Member
  const handleRegisterMember = async (e) => {
    e.preventDefault();
    const validation = validateMemberName(newMemberName);
    if (!validation.valid) {
      setMemberFeedback({ type: 'error', message: validation.error });
      return;
    }

    setIsSubmittingMember(true);
    try {
      const created = await postForm('/api/members', {
        name: validation.normalized,
      });
      setMemberFeedback({
        type: 'success',
        message: `Member "${created.name}" registered successfully with ID #${created.id}.`,
      });
      setNewMemberName('');
      setMemberNameError('');
      await fetchMembers();
    } catch (err) {
      // Preserves newMemberName on failed registration (e.g. 409 Conflict)
      setMemberFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Handler: Issue Book
  const handleIssueBook = async (e) => {
    e.preventDefault();
    const bookIdErr = validateIntegerId(issueBookId, 'Book ID');
    if (bookIdErr) {
      setIssueFeedback({ type: 'error', message: bookIdErr });
      return;
    }
    const memberIdErr = validateIntegerId(issueMemberId, 'Member ID');
    if (memberIdErr) {
      setIssueFeedback({ type: 'error', message: memberIdErr });
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const res = await postForm('/api/issue', {
        bookId: issueBookId.trim(),
        memberId: issueMemberId.trim(),
      });
      setIssueFeedback({
        type: 'success',
        title: 'Book Issued Successfully',
        data: res,
      });
      setIssueBookId('');
      setIssueMemberId('');
      await Promise.all([fetchAllBooks(), fetchCatalogBooks(searchQuery, filterMode)]);
    } catch (err) {
      setIssueFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Handler: Return Book
  const handleReturnBook = async (e) => {
    e.preventDefault();
    const bookIdErr = validateIntegerId(returnBookId, 'Book ID');
    if (bookIdErr) {
      setReturnFeedback({ type: 'error', message: bookIdErr });
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const res = await postForm('/api/return', {
        bookId: returnBookId.trim(),
      });
      setReturnFeedback({
        type: 'success',
        title: 'Book Returned Successfully',
        data: res,
      });
      setReturnBookId('');
      await Promise.all([fetchAllBooks(), fetchCatalogBooks(searchQuery, filterMode)]);
    } catch (err) {
      setReturnFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Helper lists for Quick Selection
  const availableBooks = allBooks.filter((b) => b.available);
  const issuedBooks = allBooks.filter((b) => !b.available);

  return (
    <div className="app-container">
      {/* Header Banner */}
      <header className="library-header">
        <div className="brand-badge">
          <span className="brand-icon">📚</span>
          <span className="brand-name">SMART LIBRARY</span>
        </div>
        <h1 className="header-title">Smart Library Management System</h1>
        <p className="header-subtitle">
          Core Java HTTP Server · ArrayList DSA Traversal & Linear Search · React + Vite
        </p>

        {/* Navigation Tabs */}
        <nav className="tab-navigation" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'books'}
            className={`tab-button ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            📖 Book Catalog ({allBooks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'members'}
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 Members ({members.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'issue-return'}
            className={`tab-button ${activeTab === 'issue-return' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue-return')}
          >
            🔄 Issue / Return
          </button>
        </nav>
      </header>

      {/* Global Server Error Banner */}
      {serverError && (
        <div className="alert-banner alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Backend Offline:</strong> {serverError}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* ================= TAB 1: BOOKS ================= */}
        {activeTab === 'books' && (
          <div className="tab-content">
            {/* Add Book Card */}
            <section className="card card-teal-accent">
              <div className="card-header">
                <h2 className="card-title">
                  <span className="icon-wrapper">➕</span> Add New Book
                </h2>
                <span className="section-note">Enter title and author to expand catalog</span>
              </div>

              <form className="form-inline" onSubmit={handleAddBook}>
                <div className="form-group">
                  <label htmlFor="book-title">Book Title</label>
                  <input
                    id="book-title"
                    type="text"
                    className="cream-input"
                    placeholder="e.g. Clean Code"
                    value={newTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTitle(val);
                      if (val.trim()) {
                        const v = validateBookTitle(val);
                        setTitleError(v.valid ? '' : v.error);
                      } else {
                        setTitleError('');
                      }
                    }}
                    required
                  />
                  {titleError && <span className="inline-error">{titleError}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="book-author">Author</label>
                  <input
                    id="book-author"
                    type="text"
                    className="cream-input"
                    placeholder="e.g. Robert C. Martin"
                    value={newAuthor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewAuthor(val);
                      if (val.trim()) {
                        const v = validateAuthorName(val);
                        setAuthorError(v.valid ? '' : v.error);
                      } else {
                        setAuthorError('');
                      }
                    }}
                    required
                  />
                  {authorError && <span className="inline-error">{authorError}</span>}
                </div>

                <button type="submit" className="pill-button gold-cta" disabled={isSubmittingBook}>
                  {isSubmittingBook ? 'Adding...' : 'Add Book'}
                </button>
              </form>

              {bookFeedback && (
                <div className={`feedback-box feedback-${bookFeedback.type}`}>
                  {bookFeedback.message}
                </div>
              )}
            </section>

            {/* Catalog & Search Card */}
            <section className="card card-teal-accent">
              <div className="card-header catalog-header">
                <div>
                  <h2 className="card-title">
                    <span className="icon-wrapper">📚</span> Book Catalog
                  </h2>
                  <span className="section-note">
                    Showing {catalogBooks.length} of {allBooks.length} items (Linear Search O(B))
                  </span>
                </div>

                {/* Filter Selector */}
                <div className="filter-group">
                  <button
                    type="button"
                    className={`filter-chip ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMode('all')}
                  >
                    All Books ({allBooks.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filterMode === 'available' ? 'active' : ''}`}
                    onClick={() => setFilterMode('available')}
                  >
                    Available Only ({availableBooks.length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="cream-input search-input"
                  placeholder="Search books by title or author (case-insensitive)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Books Table */}
              <div className="table-responsive">
                <table className="library-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th style={{ width: '130px' }}>Status</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogBooks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-cell">
                          {searchQuery
                            ? `No books matching "${searchQuery}".`
                            : 'No books found in the catalog.'}
                        </td>
                      </tr>
                    ) : (
                      catalogBooks.map((book) => (
                        <tr key={book.id}>
                          <td className="id-cell">#{book.id}</td>
                          <td className="title-cell font-bold">{book.title}</td>
                          <td className="author-cell">{book.author}</td>
                          <td>
                            <span
                              className={`status-pill ${
                                book.available ? 'status-available' : 'status-issued'
                              }`}
                            >
                              <span className="status-dot"></span>
                              {book.available ? 'Available' : 'Issued'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {book.available ? (
                              <button
                                type="button"
                                className="action-link-btn"
                                onClick={() => {
                                  setIssueBookId(String(book.id));
                                  setActiveTab('issue-return');
                                }}
                              >
                                Issue →
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="action-link-btn action-return"
                                onClick={() => {
                                  setReturnBookId(String(book.id));
                                  setActiveTab('issue-return');
                                }}
                              >
                                Return ←
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB 2: MEMBERS ================= */}
        {activeTab === 'members' && (
          <div className="tab-content">
            {/* Register Member Card */}
            <section className="card card-lightteal-accent">
              <div className="card-header">
                <h2 className="card-title">
                  <span className="icon-wrapper">👤</span> Register Member
                </h2>
                <span className="section-note">Add a new library member with auto-generated ID</span>
              </div>

              <form className="form-inline" onSubmit={handleRegisterMember}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="member-name">Member Full Name</label>
                  <input
                    id="member-name"
                    type="text"
                    className="cream-input"
                    placeholder="e.g. Alice Sharma"
                    value={newMemberName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewMemberName(val);
                      if (/\d/.test(val)) {
                        setMemberNameError('Member name cannot contain numbers.');
                      } else {
                        setMemberNameError('');
                      }
                    }}
                    required
                  />
                  {memberNameError && <span className="inline-error">{memberNameError}</span>}
                </div>

                <button
                  type="submit"
                  className="pill-button gold-cta"
                  disabled={isSubmittingMember}
                >
                  {isSubmittingMember ? 'Registering...' : 'Register Member'}
                </button>
              </form>

              {memberFeedback && (
                <div className={`feedback-box feedback-${memberFeedback.type}`}>
                  {memberFeedback.message}
                </div>
              )}
            </section>

            {/* Members List Card */}
            <section className="card card-lightteal-accent">
              <div className="card-header">
                <div>
                  <h2 className="card-title">
                    <span className="icon-wrapper">👥</span> Registered Members
                  </h2>
                  <span className="section-note">Stored in Core Java ArrayList&lt;Member&gt;</span>
                </div>
                <span className="badge-count">{members.length} Members</span>
              </div>

              <div className="table-responsive">
                <table className="library-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Member ID</th>
                      <th>Full Name</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="empty-cell">
                          No members registered yet. Register a member above.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id}>
                          <td className="id-cell">#{m.id}</td>
                          <td className="font-bold">{m.name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="action-link-btn"
                              onClick={() => {
                                setIssueMemberId(String(m.id));
                                setActiveTab('issue-return');
                              }}
                            >
                              Select for Issue →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB 3: ISSUE / RETURN ================= */}
        {activeTab === 'issue-return' && (
          <div className="tab-content grid-two-columns">
            {/* Card 1: Issue Book */}
            <section className="card card-gold-accent">
              <div className="card-header">
                <div>
                  <h2 className="card-title">
                    <span className="icon-wrapper">📤</span> Issue Book
                  </h2>
                  <p className="policy-note">
                    ⏱️ Loan period: <strong>7 calendar days</strong> from issue date.
                  </p>
                </div>
              </div>

              <form onSubmit={handleIssueBook} className="form-stacked">
                <div className="form-group">
                  <label htmlFor="issue-book-id">
                    Book ID <span className="label-hint">(Digits only, positive integer)</span>
                  </label>
                  <input
                    id="issue-book-id"
                    type="text"
                    inputMode="numeric"
                    className="cream-input"
                    placeholder="Enter Book ID"
                    value={issueBookId}
                    onChange={(e) => setIssueBookId(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                  {/* Quick-fill chips */}
                  {availableBooks.length > 0 && (
                    <div className="quick-chips">
                      <span className="chips-label">Quick select available:</span>
                      {availableBooks.slice(0, 4).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="chip-btn"
                          onClick={() => setIssueBookId(String(b.id))}
                          title={b.title}
                        >
                          #{b.id} {b.title.length > 14 ? b.title.slice(0, 14) + '…' : b.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="issue-member-id">
                    Member ID <span className="label-hint">(Digits only, positive integer)</span>
                  </label>
                  <input
                    id="issue-member-id"
                    type="text"
                    inputMode="numeric"
                    className="cream-input"
                    placeholder="Enter Member ID"
                    value={issueMemberId}
                    onChange={(e) => setIssueMemberId(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                  {/* Quick-fill chips */}
                  {members.length > 0 && (
                    <div className="quick-chips">
                      <span className="chips-label">Quick select member:</span>
                      {members.slice(0, 4).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="chip-btn"
                          onClick={() => setIssueMemberId(String(m.id))}
                          title={m.name}
                        >
                          #{m.id} {m.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="pill-button gold-cta full-width"
                  disabled={isSubmittingIssue}
                >
                  {isSubmittingIssue ? 'Issuing...' : 'Issue Book'}
                </button>
              </form>

              {issueFeedback && (
                <div
                  className={`feedback-box ${
                    issueFeedback.type === 'success' ? 'feedback-success' : 'feedback-error'
                  }`}
                >
                  {issueFeedback.type === 'success' ? (
                    <div>
                      <div className="feedback-headline">✅ {issueFeedback.title}</div>
                      <div className="feedback-details">
                        <p>
                          Book: <strong>"{issueFeedback.data.bookTitle}"</strong> (ID #{issueFeedback.data.bookId})
                        </p>
                        <p>
                          Issued to: <strong>{issueFeedback.data.memberName}</strong> (ID #{issueFeedback.data.memberId})
                        </p>
                        <p className="due-date-highlight">
                          📅 Due Date: <strong>{issueFeedback.data.dueDate}</strong>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>⚠️ {issueFeedback.message}</div>
                  )}
                </div>
              )}
            </section>

            {/* Card 2: Return Book */}
            <section className="card card-coral-accent">
              <div className="card-header">
                <div>
                  <h2 className="card-title">
                    <span className="icon-wrapper">📥</span> Return Book
                  </h2>
                  <p className="policy-note">
                    💰 Overdue fine: <strong>₹5 per calendar day</strong> past due date.
                  </p>
                </div>
              </div>

              <form onSubmit={handleReturnBook} className="form-stacked">
                <div className="form-group">
                  <label htmlFor="return-book-id">
                    Book ID <span className="label-hint">(Digits only, positive integer)</span>
                  </label>
                  <input
                    id="return-book-id"
                    type="text"
                    inputMode="numeric"
                    className="cream-input"
                    placeholder="Enter Book ID to Return"
                    value={returnBookId}
                    onChange={(e) => setReturnBookId(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                  {/* Quick-fill chips */}
                  {issuedBooks.length > 0 ? (
                    <div className="quick-chips">
                      <span className="chips-label">Currently issued books:</span>
                      {issuedBooks.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="chip-btn chip-coral"
                          onClick={() => setReturnBookId(String(b.id))}
                          title={b.title}
                        >
                          #{b.id} {b.title.length > 14 ? b.title.slice(0, 14) + '…' : b.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="hint-muted">No books are currently issued.</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="pill-button gold-cta full-width"
                  disabled={isSubmittingReturn}
                >
                  {isSubmittingReturn ? 'Returning...' : 'Return Book'}
                </button>
              </form>

              {returnFeedback && (
                <div
                  className={`feedback-box ${
                    returnFeedback.type === 'success' ? 'feedback-success' : 'feedback-error'
                  }`}
                >
                  {returnFeedback.type === 'success' ? (
                    <div>
                      <div className="feedback-headline">✅ {returnFeedback.title}</div>
                      <div className="feedback-details">
                        <p>
                          Book: <strong>"{returnFeedback.data.bookTitle}"</strong> (ID #{returnFeedback.data.bookId})
                        </p>
                        <p>Due Date: {returnFeedback.data.dueDate} · Returned: {returnFeedback.data.returnDate}</p>
                        <div
                          className={`fine-badge ${
                            returnFeedback.data.fine > 0 ? 'fine-due' : 'fine-zero'
                          }`}
                        >
                          {returnFeedback.data.lateDays > 0 ? (
                            <span>
                              ⚠️ Overdue by <strong>{returnFeedback.data.lateDays} days</strong> · Fine:{' '}
                              <strong>₹{returnFeedback.data.fine}</strong>
                            </span>
                          ) : (
                            <span>✨ Returned on time! Late days: 0 · Fine: ₹0</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>⚠️ {returnFeedback.message}</div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="library-footer">
        <p>
          Smart Library DSA Mini-Project · Memory State: <code>ArrayList&lt;Book&gt;</code>,{' '}
          <code>ArrayList&lt;Member&gt;</code>, <code>ArrayList&lt;IssueRecord&gt;</code>
        </p>
        <p className="footer-sub">
          * Note: Data resides in Java memory and resets upon server restart.
        </p>
      </footer>
    </div>
  );
}
