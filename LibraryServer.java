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
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.name());
                    String value = (idx < pair.length() - 1)
                            ? URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8.name())
                            : "";
                    map.put(key, value);
                }
            }
        }
        return map;
    }

    private static Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            try {
                if (idx > 0) {
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.name());
                    String value = (idx < pair.length() - 1)
                            ? URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8.name())
                            : "";
                    map.put(key, value);
                } else if (idx == -1) {
                    map.put(URLDecoder.decode(pair, StandardCharsets.UTF_8.name()), "");
                }
            } catch (Exception ignored) {}
        }
        return map;
    }

    // --- HTTP Handlers ---

    /**
     * Handler for /books:
     * GET: Search and filter book catalog via ArrayList traversal O(B).
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
                Map<String, String> queryParams = parseQueryParams(exchange.getRequestURI().getQuery());
                String search = queryParams.getOrDefault("search", "").trim().toLowerCase();
                String filter = queryParams.getOrDefault("filter", "").trim().toLowerCase();
                boolean availableOnly = "available".equals(filter);

                StringBuilder jsonBuilder = new StringBuilder("[");
                boolean first = true;

                synchronized (books) {
                    // Linear traversal of ArrayList<Book>
                    for (Book book : books) {
                        // Availability filter
                        if (availableOnly && !book.isAvailable()) {
                            continue;
                        }

                        // Search by title or author (case-insensitive)
                        if (!search.isEmpty()) {
                            boolean matchesTitle = book.getTitle().toLowerCase().contains(search);
                            boolean matchesAuthor = book.getAuthor().toLowerCase().contains(search);
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
                String title = formData.get("title");
                String author = formData.get("author");

                if (title == null || title.trim().isEmpty() || author == null || author.trim().isEmpty()) {
                    sendError(exchange, 400, "Both 'title' and 'author' are required.");
                    return;
                }

                Book newBook;
                synchronized (books) {
                    newBook = new Book(nextBookId++, title.trim(), author.trim(), true);
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
     * POST: Register a new member.
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

                synchronized (members) {
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
                String name = formData.get("name");

                if (name == null || name.trim().isEmpty()) {
                    sendError(exchange, 400, "Member 'name' is required.");
                    return;
                }

                Member newMember;
                synchronized (members) {
                    newMember = new Member(nextMemberId++, name.trim());
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

            if (bookIdStr == null || memberIdStr == null || bookIdStr.trim().isEmpty() || memberIdStr.trim().isEmpty()) {
                sendError(exchange, 400, "Both 'bookId' and 'memberId' are required.");
                return;
            }

            int bookId;
            int memberId;
            try {
                bookId = Integer.parseInt(bookIdStr.trim());
                memberId = Integer.parseInt(memberIdStr.trim());
                if (bookId <= 0 || memberId <= 0) {
                    sendError(exchange, 400, "Book ID and Member ID must be positive integers.");
                    return;
                }
            } catch (NumberFormatException e) {
                sendError(exchange, 400, "Book ID and Member ID must be valid integers.");
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

            if (bookIdStr == null || bookIdStr.trim().isEmpty()) {
                sendError(exchange, 400, "'bookId' is required.");
                return;
            }

            int bookId;
            try {
                bookId = Integer.parseInt(bookIdStr.trim());
                if (bookId <= 0) {
                    sendError(exchange, 400, "Book ID must be a positive integer.");
                    return;
                }
            } catch (NumberFormatException e) {
                sendError(exchange, 400, "Book ID must be a valid integer.");
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
