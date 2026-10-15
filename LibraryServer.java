import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/**
 * Smart Library Management System - Core Java HTTP Server
 * Demonstrates Data Structures & Algorithms (DSA) concepts:
 * - ArrayList storage
 * - Linear search & traversal algorithms
 * No external dependencies, databases, or frameworks.
 */
public class LibraryServer {

    // --- Model Classes ---

    public static class Book {
        private final int id;
        private final String title;
        private final String author;
        private boolean available;

        public Book(int id, String title, String author, boolean available) {
            this.id = id;
            this.title = title;
            this.author = author;
            this.available = available;
        }

        public int getId() { return id; }
        public String getTitle() { return title; }
        public String getAuthor() { return author; }
        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }
    }

    public static class Member {
        private final int id;
        private final String name;

        public Member(int id, String name) {
            this.id = id;
            this.name = name;
        }

        public int getId() { return id; }
        public String getName() { return name; }
    }

    public static class IssueRecord {
        private final int bookId;
        private final int memberId;
        private final LocalDate issueDate;
        private final LocalDate dueDate;
        private boolean returned;

        public IssueRecord(int bookId, int memberId, LocalDate issueDate, LocalDate dueDate, boolean returned) {
            this.bookId = bookId;
            this.memberId = memberId;
            this.issueDate = issueDate;
            this.dueDate = dueDate;
            this.returned = returned;
        }

        public int getBookId() { return bookId; }
        public int getMemberId() { return memberId; }
        public LocalDate getIssueDate() { return issueDate; }
        public LocalDate getDueDate() { return dueDate; }
        public boolean isReturned() { return returned; }
        public void setReturned(boolean returned) { this.returned = returned; }
    }

    // --- In-Memory ArrayList Data Storage (DSA) ---

    private static final List<Book> books = new ArrayList<>();
    private static final List<Member> members = new ArrayList<>();
    private static final List<IssueRecord> issues = new ArrayList<>();

    private static int nextBookId = 1;
    private static int nextMemberId = 1;

    // --- Linear Search DSA Helper Methods ---

    /**
     * Linear search O(B) to find a Book by its ID in the ArrayList.
     */
    private static synchronized Book findBookById(int id) {
        for (Book book : books) {
            if (book.getId() == id) {
                return book;
            }
        }
        return null;
    }

    /**
     * Linear search O(M) to find a Member by their ID in the ArrayList.
     */
    private static synchronized Member findMemberById(int id) {
        for (Member member : members) {
            if (member.getId() == id) {
                return member;
            }
        }
        return null;
    }

    /**
     * Linear search O(M) through ArrayList<Member> to detect duplicate names.
     * Compares case-insensitively with whitespace normalized.
     * Treats "John Doe", "john doe", " JOHN DOE ", and "John  Doe" as identical.
     */
    private static synchronized Member findMemberByName(String normalizedName) {
        for (Member member : members) {
            String existingNormalized = member.getName().trim().replaceAll("\\s+", " ");
            if (existingNormalized.equalsIgnoreCase(normalizedName)) {
                return member;
            }
        }
        return null;
    }

    /**
     * Linear search O(I) to find the active (unreturned) IssueRecord for a Book.
     */
    private static synchronized IssueRecord findActiveIssueByBookId(int bookId) {
        for (IssueRecord issue : issues) {
            if (issue.getBookId() == bookId && !issue.isReturned()) {
                return issue;
            }
        }
        return null;
    }

    // --- Validation Helper Methods ---

    /**
     * Validates that an ID string consists strictly of digits,
     * represents a positive integer greater than 0, and fits within Java int range (1 to 2147483647).
     * Rejects zero, negative numbers, decimals, empty values, '+' signs, scientific notation, and non-digits.
     */
    private static int parsePositiveId(String idStr, String fieldName) {
        if (idStr == null || idStr.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        String trimmed = idStr.trim();
        if (!trimmed.matches("^[0-9]+$")) {
            throw new IllegalArgumentException(fieldName + " must contain digits only (no signs, decimals, or scientific notation).");
        }
        if (trimmed.equals("0") || trimmed.matches("^0+$")) {
            throw new IllegalArgumentException(fieldName + " must be a positive integer greater than 0.");
        }
        try {
            long val = Long.parseLong(trimmed);
            if (val <= 0) {
                throw new IllegalArgumentException(fieldName + " must be a positive integer greater than 0.");
            }
            if (val > Integer.MAX_VALUE) {
                throw new IllegalArgumentException(fieldName + " exceeds maximum allowable integer limit (" + Integer.MAX_VALUE + ").");
            }
            return (int) val;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " exceeds maximum allowable integer limit (" + Integer.MAX_VALUE + ").");
        }
    }

    /**
     * Validates and normalizes a member's full name.
     * Requirements:
     * - Alphabetic names containing spaces (supports multiple words like "John Doe")
     * - Unicode-aware letter validation (\p{L})
     * - Reject numeric characters
     * - Reject empty or whitespace-only
     * - Trim leading and trailing spaces
     * - Normalize repeated whitespace (multiple spaces -> single space)
     * - Do not silently strip numbers or invalid characters; reject them explicitly
     */
    private static String validateAndNormalizeMemberName(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            throw new IllegalArgumentException("Member name is required and cannot be empty.");
        }
        String trimmed = rawName.trim();
        if (trimmed.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Member name cannot contain numbers.");
        }
        String normalized = trimmed.replaceAll("\\s+", " ");
        if (!normalized.matches("^[\\p{L}]+(?:[\\s'-][\\p{L}]+)*$")) {
            throw new IllegalArgumentException("Member name must contain only alphabetic letters and spaces.");
        }
        return normalized;
    }

    /**
     * Validates and normalizes a book's title.
     * Requirements:
     * - Trim leading and trailing whitespace, normalize multiple internal spaces.
     * - Reject empty or whitespace-only.
     * - Reject numeric-only titles (e.g. "12345") - project-specific restriction.
     * - Reject meaningless punctuation/symbols (must contain alphabetic characters).
     * - Allow Unicode letters, numbers, spaces, and standard punctuation (. , : ; ' " ( ) & ! ? + # / -).
     */
    private static String validateAndNormalizeBookTitle(String rawTitle) {
        if (rawTitle == null || rawTitle.trim().isEmpty()) {
            throw new IllegalArgumentException("Book title is required and cannot be empty.");
        }
        String trimmed = rawTitle.trim();
        String normalized = trimmed.replaceAll("\\s+", " ");

        // Reject numeric-only input (project-specific restriction)
        if (normalized.matches("^[0-9]+$")) {
            throw new IllegalArgumentException("Book title cannot be numeric-only.");
        }

        // Must contain at least one alphabetic letter (rejects punctuation-only like @@@ or !!!)
        if (!normalized.matches(".*\\p{L}.*")) {
            throw new IllegalArgumentException("Book title must contain alphabetic characters.");
        }

        // Must consist of letters, digits, spaces, and allowed punctuation
        if (!normalized.matches("^[\\p{L}0-9\\s.,:;\'\"()&!?+#/-]+$")) {
            throw new IllegalArgumentException("Book title contains invalid special characters.");
        }

        return normalized;
    }

    /**
     * Validates and normalizes an author's name.
     * Requirements:
     * - Trim leading and trailing whitespace, normalize multiple internal spaces.
     * - Reject numeric characters and numeric-only values.
     * - Reject empty or whitespace-only.
     * - Must contain alphabetic characters.
     * - Supports multi-word names, Unicode letters, and standard name punctuation (., -, ').
     */
    private static String validateAndNormalizeAuthorName(String rawAuthor) {
        if (rawAuthor == null || rawAuthor.trim().isEmpty()) {
            throw new IllegalArgumentException("Author name is required and cannot be empty.");
        }
        String trimmed = rawAuthor.trim();
        String normalized = trimmed.replaceAll("\\s+", " ");

        // Reject numeric characters
        if (normalized.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Author name cannot contain numbers.");
        }

        // Must contain at least one alphabetic letter
        if (!normalized.matches(".*\\p{L}.*")) {
            throw new IllegalArgumentException("Author name must contain alphabetic characters.");
        }

        // Must contain only Unicode letters, spaces, and valid name punctuation (., -, ')
        if (!normalized.matches("^[\\p{L}][\\p{L}.'-]*(?:\\s+[\\p{L}][\\p{L}.'-]*)*$")) {
            throw new IllegalArgumentException("Author name must contain only alphabetic letters, spaces, and valid punctuation (., -, ').");
        }

        return normalized;
    }

    // --- JSON & HTTP Helpers ---

    private static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        String hex = Integer.toHexString(c);
                        sb.append("\\u");
                        for (int k = 0; k < 4 - hex.length(); k++) sb.append('0');
                        sb.append(hex);
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    private static String bookToJson(Book b) {
        return "{\"id\":" + b.getId() +
                ",\"title\":\"" + escapeJson(b.getTitle()) + "\"" +
                ",\"author\":\"" + escapeJson(b.getAuthor()) + "\"" +
                ",\"available\":" + b.isAvailable() + "}";
    }

    private static String memberToJson(Member m) {
        return "{\"id\":" + m.getId() +
                ",\"name\":\"" + escapeJson(m.getName()) + "\"}";
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendError(HttpExchange exchange, int statusCode, String errorMessage) throws IOException {
        String json = "{\"error\":\"" + escapeJson(errorMessage) + "\"}";
        sendResponse(exchange, statusCode, json);
    }

    private static Map<String, String> parseFormData(HttpExchange exchange) throws IOException {
        Map<String, String> map = new HashMap<>();
        try (InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
             BufferedReader br = new BufferedReader(isr)) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            String body = sb.toString();
            if (body.isEmpty()) return map;

            String[] pairs = body.split("&");
            for (String pair : pairs) {
                int idx = pair.indexOf("=");
                if (idx > 0) {
                    try {
                        String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                        String value = (idx < pair.length() - 1)
                                ? URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8)
                                : "";
                        map.put(key, value);
                    } catch (IllegalArgumentException ignored) {}
                }
            }
        }
        return map;
    }

    private static Map<String, String> parseQueryParams(String rawQuery) {
        Map<String, String> map = new HashMap<>();
        if (rawQuery == null || rawQuery.isEmpty()) return map;
        String[] pairs = rawQuery.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            try {
                if (idx > 0) {
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                    String value = (idx < pair.length() - 1)
                            ? URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8)
                            : "";
                    map.put(key, value);
                } else if (idx == -1) {
                    map.put(URLDecoder.decode(pair, StandardCharsets.UTF_8), "");
                }
            } catch (Exception ignored) {}
        }
        return map;
    }

    // --- HTTP Handlers ---

    /**
     * Handler for /books:
     * GET: Search and filter book catalog via ArrayList traversal O(B).
     *      Uses case-insensitive and Unicode-aware regex matching with literal Pattern.quote().
     * POST: Add a new book to catalog.
     */
    static class BooksHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if ("GET".equalsIgnoreCase(method)) {
                String rawQuery = exchange.getRequestURI().getRawQuery();
                Map<String, String> queryParams = parseQueryParams(rawQuery);
                String search = queryParams.getOrDefault("search", "").trim();
                String filter = queryParams.getOrDefault("filter", "").trim();
                boolean availableOnly = "available".equalsIgnoreCase(filter);

                // Compile regex once per search request, not once per book
                Pattern pattern = null;
                if (!search.isEmpty()) {
                    pattern = Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
                }

                StringBuilder jsonBuilder = new StringBuilder("[");
                boolean first = true;

                synchronized (LibraryServer.class) {
                    // Linear traversal of ArrayList<Book>
                    for (Book book : books) {
                        // Availability filter
                        if (availableOnly && !book.isAvailable()) {
                            continue;
                        }

                        // Search by title or author (case-insensitive literal regex)
                        if (pattern != null) {
                            boolean matchesTitle = pattern.matcher(book.getTitle()).find();
                            boolean matchesAuthor = pattern.matcher(book.getAuthor()).find();
                            if (!matchesTitle && !matchesAuthor) {
                                continue;
                            }
                        }

                        if (!first) jsonBuilder.append(",");
                        jsonBuilder.append(bookToJson(book));
                        first = false;
                    }
                }

                jsonBuilder.append("]");
                sendResponse(exchange, 200, jsonBuilder.toString());
                return;
            }

            if ("POST".equalsIgnoreCase(method)) {
                Map<String, String> formData = parseFormData(exchange);
                String rawTitle = formData.get("title");
                String rawAuthor = formData.get("author");

                String normalizedTitle;
                String normalizedAuthor;
                try {
                    normalizedTitle = validateAndNormalizeBookTitle(rawTitle);
                    normalizedAuthor = validateAndNormalizeAuthorName(rawAuthor);
                } catch (IllegalArgumentException e) {
                    sendError(exchange, 400, e.getMessage());
                    return;
                }

                Book newBook;
                synchronized (LibraryServer.class) {
                    newBook = new Book(nextBookId++, normalizedTitle, normalizedAuthor, true);
                    books.add(newBook);
                }

                sendResponse(exchange, 201, bookToJson(newBook));
                return;
            }

            sendError(exchange, 405, "Method not allowed.");
        }
    }

    /**
     * Handler for /members:
     * GET: List all registered members via ArrayList traversal O(M).
     * POST: Register a new member with duplicate-name prevention and input validation.
     */
    static class MembersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if ("GET".equalsIgnoreCase(method)) {
                StringBuilder jsonBuilder = new StringBuilder("[");
                boolean first = true;

                synchronized (LibraryServer.class) {
                    // Linear traversal of ArrayList<Member>
                    for (Member member : members) {
                        if (!first) jsonBuilder.append(",");
                        jsonBuilder.append(memberToJson(member));
                        first = false;
                    }
                }

                jsonBuilder.append("]");
                sendResponse(exchange, 200, jsonBuilder.toString());
                return;
            }

            if ("POST".equalsIgnoreCase(method)) {
                Map<String, String> formData = parseFormData(exchange);
                String rawName = formData.get("name");

                String normalizedName;
                try {
                    normalizedName = validateAndNormalizeMemberName(rawName);
                } catch (IllegalArgumentException e) {
                    sendError(exchange, 400, e.getMessage());
                    return;
                }

                Member newMember;
                synchronized (LibraryServer.class) {
                    // Linear search O(M) for duplicate member name (case-insensitive, normalized spaces)
                    Member existing = findMemberByName(normalizedName);
                    if (existing != null) {
                        sendError(exchange, 409, "Member with name '" + normalizedName + "' is already registered (Member ID #" + existing.getId() + ").");
                        return;
                    }

                    newMember = new Member(nextMemberId++, normalizedName);
                    members.add(newMember);
                }

                sendResponse(exchange, 201, memberToJson(newMember));
                return;
            }

            sendError(exchange, 405, "Method not allowed.");
        }
    }

    /**
     * Handler for /issue:
     * POST: Issue an available book to a registered member.
     * Sets 7-calendar-day loan period.
     */
    static class IssueHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if (!"POST".equalsIgnoreCase(method)) {
                sendError(exchange, 405, "Method not allowed.");
                return;
            }

            Map<String, String> formData = parseFormData(exchange);
            String bookIdStr = formData.get("bookId");
            String memberIdStr = formData.get("memberId");

            int bookId;
            int memberId;
            try {
                bookId = parsePositiveId(bookIdStr, "Book ID");
                memberId = parsePositiveId(memberIdStr, "Member ID");
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, e.getMessage());
                return;
            }

            synchronized (LibraryServer.class) {
                // Linear search for Book O(B)
                Book book = findBookById(bookId);
                if (book == null) {
                    sendError(exchange, 400, "Book with ID " + bookId + " does not exist.");
                    return;
                }

                // Linear search for Member O(M)
                Member member = findMemberById(memberId);
                if (member == null) {
                    sendError(exchange, 400, "Member with ID " + memberId + " does not exist.");
                    return;
                }

                // Availability check
                if (!book.isAvailable()) {
                    sendError(exchange, 400, "Book '" + book.getTitle() + "' (ID " + bookId + ") is already issued.");
                    return;
                }

                LocalDate issueDate = LocalDate.now();
                LocalDate dueDate = issueDate.plusDays(7);

                book.setAvailable(false);
                IssueRecord record = new IssueRecord(bookId, memberId, issueDate, dueDate, false);
                issues.add(record);

                String response = "{" +
                        "\"message\":\"Book issued successfully.\"," +
                        "\"bookId\":" + bookId + "," +
                        "\"bookTitle\":\"" + escapeJson(book.getTitle()) + "\"," +
                        "\"memberId\":" + memberId + "," +
                        "\"memberName\":\"" + escapeJson(member.getName()) + "\"," +
                        "\"issueDate\":\"" + issueDate + "\"," +
                        "\"dueDate\":\"" + dueDate + "\"" +
                        "}";
                sendResponse(exchange, 200, response);
            }
        }
    }

    /**
     * Handler for /return:
     * POST: Return an issued book and calculate overdue fine (₹5 per late day).
     */
    static class ReturnHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendResponse(exchange, 204, "");
                return;
            }

            if (!"POST".equalsIgnoreCase(method)) {
                sendError(exchange, 405, "Method not allowed.");
                return;
            }

            Map<String, String> formData = parseFormData(exchange);
            String bookIdStr = formData.get("bookId");

            int bookId;
            try {
                bookId = parsePositiveId(bookIdStr, "Book ID");
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, e.getMessage());
                return;
            }

            synchronized (LibraryServer.class) {
                // Linear search for Book O(B)
                Book book = findBookById(bookId);
                if (book == null) {
                    sendError(exchange, 400, "Book with ID " + bookId + " does not exist.");
                    return;
                }

                // Linear search for active IssueRecord O(I)
                IssueRecord activeIssue = findActiveIssueByBookId(bookId);
                if (activeIssue == null) {
                    sendError(exchange, 400, "No active issue record found for book ID " + bookId + ". Book is not currently issued.");
                    return;
                }

                LocalDate returnDate = LocalDate.now();
                long daysBetween = ChronoUnit.DAYS.between(activeIssue.getDueDate(), returnDate);
                long lateDays = Math.max(0, daysBetween);
                long fine = lateDays * 5; // ₹5 per late day

                activeIssue.setReturned(true);
                book.setAvailable(true);

                String response = "{" +
                        "\"message\":\"Book returned successfully.\"," +
                        "\"bookId\":" + bookId + "," +
                        "\"bookTitle\":\"" + escapeJson(book.getTitle()) + "\"," +
                        "\"dueDate\":\"" + activeIssue.getDueDate() + "\"," +
                        "\"returnDate\":\"" + returnDate + "\"," +
                        "\"lateDays\":" + lateDays + "," +
                        "\"fine\":" + fine +
                        "}";
                sendResponse(exchange, 200, response);
            }
        }
    }

    // --- Server Bootstrap & Seed Data ---

    public static void main(String[] args) throws IOException {
        // Seed two initial demo books per PRD
        books.add(new Book(nextBookId++, "Java Basics", "James Gosling", true));
        books.add(new Book(nextBookId++, "DSA Fundamentals", "Robert Sedgewick", true));

        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/books", new BooksHandler());
        server.createContext("/members", new MembersHandler());
        server.createContext("/issue", new IssueHandler());
        server.createContext("/return", new ReturnHandler());

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        System.out.println("Smart Library Core Java HTTP Server is running on port " + port);
        System.out.println("Endpoints available: /books, /members, /issue, /return");
    }
}
