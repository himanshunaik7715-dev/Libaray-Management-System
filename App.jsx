import React, { useState, useEffect, useMemo } from 'react';

// Form-encoded POST helper as required by PRD and ARCHITECTURE
async function postForm(url, data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: params.toString(),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || `HTTP error ${response.status}`);
  }
  return json;
}

export default function App() {
  // Navigation tab state: 'books' | 'members' | 'issue-return'
  const [activeTab, setActiveTab] = useState('books');

  // Core data states
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  // Books tab form and search states
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'available'
  const [bookFeedback, setBookFeedback] = useState(null);

  // Members tab form state
  const [newMemberName, setNewMemberName] = useState('');
  const [memberFeedback, setMemberFeedback] = useState(null);

  // Issue / Return tab form states
  const [issueBookId, setIssueBookId] = useState('');
  const [issueMemberId, setIssueMemberId] = useState('');
  const [issueFeedback, setIssueFeedback] = useState(null);

  const [returnBookId, setReturnBookId] = useState('');
  const [returnFeedback, setReturnFeedback] = useState(null);

  // Fetch all books
  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error('Failed to load books');
      const data = await res.json();
      setBooks(data);
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
    Promise.all([fetchBooks(), fetchMembers()]).finally(() => setLoading(false));
  }, []);

  // Filtered books (Search title or author, case-insensitive + Available filter)
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      if (filterMode === 'available' && !b.available) return false;
      if (!q) return true;
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchAuthor = b.author.toLowerCase().includes(q);
      return matchTitle || matchAuthor;
    });
  }, [books, searchQuery, filterMode]);

  // Handler: Add Book
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) {
      setBookFeedback({ type: 'error', message: 'Title and author are required.' });
      return;
    }
    try {
      const created = await postForm('/api/books', {
        title: newTitle.trim(),
        author: newAuthor.trim(),
      });
      setBookFeedback({
        type: 'success',
        message: `Book "${created.title}" added successfully with ID #${created.id}.`,
      });
      setNewTitle('');
      setNewAuthor('');
      fetchBooks();
    } catch (err) {
      setBookFeedback({ type: 'error', message: err.message });
    }
  };

  // Handler: Register Member
  const handleRegisterMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMemberFeedback({ type: 'error', message: 'Member name is required.' });
      return;
    }
    try {
      const created = await postForm('/api/members', {
        name: newMemberName.trim(),
      });
      setMemberFeedback({
        type: 'success',
        message: `Member "${created.name}" registered successfully with ID #${created.id}.`,
      });
      setNewMemberName('');
      fetchMembers();
    } catch (err) {
      setMemberFeedback({ type: 'error', message: err.message });
    }
  };

  // Handler: Issue Book
  const handleIssueBook = async (e) => {
    e.preventDefault();
    if (!issueBookId || !issueMemberId) {
      setIssueFeedback({ type: 'error', message: 'Please enter both Book ID and Member ID.' });
      return;
    }
    try {
      const res = await postForm('/api/issue', {
        bookId: issueBookId,
        memberId: issueMemberId,
      });
      setIssueFeedback({
        type: 'success',
        title: 'Book Issued Successfully',
        data: res,
      });
      setIssueBookId('');
      setIssueMemberId('');
      fetchBooks();
    } catch (err) {
      setIssueFeedback({ type: 'error', message: err.message });
    }
  };

  // Handler: Return Book
  const handleReturnBook = async (e) => {
    e.preventDefault();
    if (!returnBookId) {
      setReturnFeedback({ type: 'error', message: 'Please enter the Book ID to return.' });
      return;
    }
    try {
      const res = await postForm('/api/return', {
        bookId: returnBookId,
      });
      setReturnFeedback({
        type: 'success',
        title: 'Book Returned Successfully',
        data: res,
      });
      setReturnBookId('');
      fetchBooks();
    } catch (err) {
      setReturnFeedback({ type: 'error', message: err.message });
    }
  };

  // Helper lists for Quick Selection
  const availableBooks = books.filter((b) => b.available);
  const issuedBooks = books.filter((b) => !b.available);

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
            📖 Book Catalog ({books.length})
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
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="book-author">Author</label>
                  <input
                    id="book-author"
                    type="text"
                    className="cream-input"
                    placeholder="e.g. Robert C. Martin"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="pill-button gold-cta">
                  Add Book
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
                    Showing {filteredBooks.length} of {books.length} items (Linear Search O(B))
                  </span>
                </div>

                {/* Filter Selector */}
                <div className="filter-group">
                  <button
                    type="button"
                    className={`filter-chip ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMode('all')}
                  >
                    All Books ({books.length})
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
                    {filteredBooks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-cell">
                          {searchQuery
                            ? `No books matching "${searchQuery}".`
                            : 'No books found in the catalog.'}
                        </td>
                      </tr>
                    ) : (
                      filteredBooks.map((book) => (
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
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="pill-button gold-cta">
                  Register Member
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
                    Book ID <span className="label-hint">(Available books only)</span>
                  </label>
                  <input
                    id="issue-book-id"
                    type="number"
                    min="1"
                    className="cream-input"
                    placeholder="Enter Book ID"
                    value={issueBookId}
                    onChange={(e) => setIssueBookId(e.target.value)}
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
                    Member ID <span className="label-hint">(Registered member)</span>
                  </label>
                  <input
                    id="issue-member-id"
                    type="number"
                    min="1"
                    className="cream-input"
                    placeholder="Enter Member ID"
                    value={issueMemberId}
                    onChange={(e) => setIssueMemberId(e.target.value)}
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

                <button type="submit" className="pill-button gold-cta full-width">
                  Issue Book
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
                    Book ID <span className="label-hint">(Currently issued book)</span>
                  </label>
                  <input
                    id="return-book-id"
                    type="number"
                    min="1"
                    className="cream-input"
                    placeholder="Enter Book ID to Return"
                    value={returnBookId}
                    onChange={(e) => setReturnBookId(e.target.value)}
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

                <button type="submit" className="pill-button gold-cta full-width">
                  Return Book
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
