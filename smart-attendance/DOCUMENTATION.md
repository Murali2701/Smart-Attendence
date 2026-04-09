# Smart Attendance Management System
### Complete Project Documentation — Final Year CSE Project

---

## 1. Project Abstract

The Smart Attendance Management System is a full-stack web application designed to modernise the traditional, error-prone method of taking attendance in educational institutions. The system leverages QR code technology for frictionless, real-time attendance marking and integrates Google's Gemini AI to generate personalised student attendance summaries and improvement suggestions. Built on React 18 (frontend), Spring Boot (backend), and Firebase (auth + database), the platform supports three user roles — Student, Faculty, and Admin — each with a tailored dashboard. Students can view attendance history and receive AI-generated reports. Faculty can create classes, generate time-limited QR codes per session, and monitor attendance records. Administrators gain system-wide analytics with interactive charts and trend visualisations. The architecture prioritises scalability, security (Firebase Auth + token validation), and real-time data access through Firestore, making it a production-ready solution for any college or university.

---

## 2. Problem Statement

Manual attendance in colleges suffers from multiple systemic failures:

- **Time Inefficiency**: Calling roll for 60+ students wastes 5–10 minutes per class.
- **Proxy Attendance**: Students sign for absent peers — a widespread and hard-to-detect fraud.
- **Data Silos**: Paper registers make it impossible to compute running totals or identify at-risk students in real time.
- **No Early Warning**: Faculty only notice chronic absentees at semester-end, too late for intervention.
- **Administrative Overhead**: Generating attendance reports for exams or scholarships is a manual, error-prone process.
- **Lack of Analytics**: No institution-wide visibility into attendance trends across departments or courses.

---

## 3. Proposed Solution

The Smart Attendance Management System addresses every pain point above through four pillars:

1. **QR-Based Marking**: Faculty generates a time-limited QR code (15-minute expiry) per session. Students scan it to self-mark attendance — no proxies possible since the QR changes every session and expires quickly.
2. **Role-Based Dashboards**: Tailored interfaces for Students (personal history + AI report), Faculty (session management + attendance lists), and Admin (system analytics + user management).
3. **AI-Powered Insights**: Gemini API analyses each student's per-subject attendance and produces a natural-language summary, risk level (low / medium / high), and five concrete improvement suggestions.
4. **Real-Time Firestore Backend**: Attendance records sync instantly across all devices without page reloads, ensuring faculty see up-to-date attendance as students scan.

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                        │
│                                                                       │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│   │  Student UI  │  │  Faculty UI  │  │       Admin UI           │  │
│   │  (React 18)  │  │  (React 18)  │  │      (React 18)          │  │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│          │                 │                       │                  │
│          └─────────────────┼───────────────────────┘                 │
│                            │  Axios (REST + Bearer Token)            │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                    HTTPS / REST API
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                   BACKEND LAYER (Spring Boot 3)                       │
│                                                                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ FirebaseAuth     │  │  REST        │  │  Business Services     │  │
│  │ Filter           │→ │  Controllers │→ │  FirestoreService      │  │
│  │ (Token Verify)   │  │  /classes    │  │  QRCodeService (ZXing) │  │
│  └─────────────────┘  │  /sessions   │  │  GeminiService         │  │
│                        │  /attendance │  └────────────┬───────────┘  │
│                        │  /ai         │               │              │
│                        │  /admin      │               │              │
│                        └──────────────┘               │              │
└───────────────────────────────────────────────────────┼──────────────┘
                                                        │
                    ┌───────────────────────────────────┘
                    │
       ┌────────────▼──────────────────────────────────────────┐
       │               FIREBASE PLATFORM                         │
       │                                                         │
       │  ┌───────────────────┐   ┌─────────────────────────┐  │
       │  │  Firebase Auth     │   │   Cloud Firestore        │  │
       │  │  (Google + Email)  │   │   Collections:           │  │
       │  └───────────────────┘   │   users / classes /      │  │
       │                          │   students / sessions /  │  │
       │                          │   attendance             │  │
       │                          └─────────────────────────┘  │
       └───────────────────────────────────────────────────────┘
                    │
       ┌────────────▼──────────────────────────────────────────┐
       │               EXTERNAL AI SERVICE                       │
       │         Google Gemini Pro API (REST / HTTP)            │
       └───────────────────────────────────────────────────────┘
```

### Request Flow (QR Attendance)

```
Student opens camera
        │
        ▼
Scans QR code → extracts sessionId
        │
        ▼
Frontend sends POST /api/attendance/qr  {sessionId, studentId}
   + Authorization: Bearer <Firebase ID Token>
        │
        ▼
FirebaseAuthFilter validates token → extracts uid
        │
        ▼
AttendanceController validates session (active? not expired?)
        │
        ▼
Checks for duplicate attendance
        │
        ▼
Saves record to Firestore  attendance/{auto-id}
        │
        ▼
Returns 200 OK → Frontend shows success toast
```

---

## 5. Tech Stack Used (with Justification)

| Layer | Technology | Justification |
|---|---|---|
| Frontend Framework | React 18 | Industry-standard SPA framework; hooks + context eliminate prop drilling; strong ecosystem |
| Language | TypeScript | Compile-time type safety; prevents runtime errors in complex data flows |
| Routing | React Router v6 | Declarative nested routes; ideal for role-based multi-page dashboards |
| Charts | Recharts | Lightweight, composable React charting; built on D3; responsive by default |
| HTTP Client | Axios | Interceptors make JWT token injection seamless across all API calls |
| QR Generation (Frontend) | qrcode (npm) | Zero-dependency Canvas/PNG QR generator; works entirely client-side |
| Backend Framework | Spring Boot 3 | Production-grade Java framework; mature ecosystem; easy REST API construction |
| Build Tool | Maven | Standard Java build tool; reliable dependency management |
| Database | Cloud Firestore | NoSQL real-time database; scales automatically; no server provisioning |
| Authentication | Firebase Auth | Managed auth with Google OAuth; provides signed JWT tokens out of the box |
| QR Generation (Backend) | ZXing | Industry-standard QR library for Java; supports custom colours and error correction |
| AI Integration | Google Gemini Pro | State-of-the-art generative AI; free tier available; same ecosystem as Firebase |
| Frontend Deploy | Vercel / Firebase Hosting | Zero-config React deployment; global CDN; automatic HTTPS |
| Backend Deploy | Render | Free tier for Spring Boot; automatic deploys from Git; built-in SSL |
| Containerisation | Docker + Docker Compose | Consistent local dev environment; matches production setup |

---

## 6. Database Design (Firestore Collections)

### Collection: `users`
```
users/{uid}
  ├── id         : string   (Firebase Auth UID)
  ├── name       : string
  ├── email      : string
  ├── role       : "student" | "faculty" | "admin"
  └── createdAt  : ISO-8601 timestamp
```

### Collection: `classes`
```
classes/{classId}
  ├── id           : string   (auto-generated)
  ├── subject      : string   (e.g. "Data Structures")
  ├── facultyId    : string   (ref → users/{uid})
  ├── facultyName  : string
  ├── schedule     : string   (e.g. "Mon/Wed 9–10 AM")
  ├── studentCount : number
  └── createdAt    : ISO-8601
```

### Collection: `students` (Enrollment records)
```
students/{enrollmentId}
  ├── id         : string
  ├── userId     : string   (ref → users/{uid})
  ├── classId    : string   (ref → classes/{classId})
  └── enrolledAt : ISO-8601
```

### Collection: `sessions`
```
sessions/{sessionId}
  ├── id          : string
  ├── classId     : string   (ref → classes/{classId})
  ├── className   : string   (denormalised for query efficiency)
  ├── date        : "YYYY-MM-DD"
  ├── qrCode      : string   (Base64 PNG data URL)
  ├── qrPayload   : string   ("ATTEND_{sessionId}_{timestamp}")
  ├── expiresAt   : ISO-8601 (15 minutes after creation)
  ├── status      : "active" | "closed"
  └── createdAt   : ISO-8601
```

### Collection: `attendance`
```
attendance/{recordId}
  ├── id          : string
  ├── studentId   : string   (ref → users/{uid})
  ├── studentName : string   (denormalised)
  ├── sessionId   : string   (ref → sessions/{sessionId})
  ├── classId     : string
  ├── className   : string
  ├── date        : "YYYY-MM-DD"
  ├── status      : "present" | "absent" | "late"
  └── markedAt    : ISO-8601
```

### Entity Relationship Diagram
```
users ─────────────────┐
  │ (facultyId)         │ (studentId)
  ▼                     ▼
classes ──── sessions    attendance
  │              │           │
  │ (classId)    │(sessionId)│
  └──── students ┘           │
              │              │
              └── (userId) ──┘
```

---

## 7. Module Description

### 7.1 Authentication Module
Handles user registration (email/password + Google OAuth), login, and session management via Firebase Auth. On first Google sign-in, a user profile document is created in Firestore with the selected role. The `useAuth` React hook exposes auth state throughout the app via Context API.

### 7.2 Role-Based Access Control
Three distinct roles — Student, Faculty, Admin — each with route-level and API-level protection. The React `ProtectedRoute` component redirects unauthorised users. The Spring Boot `FirebaseAuthFilter` validates every API request's Bearer token server-side.

### 7.3 Class Management Module
Faculty can create classes (subject name + schedule), view enrolled student counts, and delete classes. Students are enrolled via the `students` collection. The Admin can view all classes system-wide.

### 7.4 Session & QR Code Module
Faculty creates a session for a class, triggering the backend to generate a unique QR code (via ZXing) encoded with `ATTEND_{sessionId}_{timestamp}`. The QR is displayed in a modal. Sessions expire after 15 minutes. Students scan the QR to trigger the `/api/attendance/qr` endpoint.

### 7.5 Attendance Tracking Module
Records every attendance event (QR-scan or manual marking) in Firestore. Duplicate detection prevents double-marking. The `/api/attendance/stats/{studentId}` endpoint aggregates per-class totals and computes percentage. Students below 75% are flagged.

### 7.6 AI Report Module
The `/api/ai/report/{studentId}` endpoint aggregates attendance data and sends a structured prompt to Gemini Pro. The response is parsed into: a 3-sentence summary, a risk level, and 5 improvement suggestions. A fallback heuristic response is used if the Gemini API is unavailable.

### 7.7 Admin Analytics Module
Provides system-wide aggregate views: total students/faculty/classes, institution-wide average attendance, per-class breakdown bar chart, student distribution pie chart (safe/warning/at-risk), and a weekly trend line chart. The at-risk students table enables targeted intervention.

---

## 8. AI Feature Explanation (Gemini Integration)

### Overview
The AI feature uses Google's Gemini Pro language model, accessed via the Gemini REST API (`generativelanguage.googleapis.com`), to generate natural-language attendance analysis for each student.

### Prompt Engineering
The Spring Boot `GeminiService` builds a structured prompt that:
1. Defines the AI's persona ("academic advisor AI")
2. Specifies exact output format (SUMMARY / SUGGESTIONS / RISK)
3. Injects real attendance data per subject

Example prompt fragment:
```
Student: Alice Johnson
Attendance Data:
- Data Structures: 27/30 (90%)
- Operating Systems: 19/28 (68%)
- Computer Networks: 12/20 (60%)
```

### Response Parsing
The Gemini response is parsed line-by-line. The parser extracts:
- `SUMMARY:` → summary string
- `SUGGESTIONS:` → bulleted list → `List<String>`
- `RISK:` → low | medium | high

### Fallback Strategy
If the Gemini API is unavailable (invalid key, rate limit, network error), a deterministic fallback function generates a report based on computed averages. This ensures the feature degrades gracefully in demo/offline scenarios.

### API Call Details
- Model: `gemini-pro`
- Temperature: 0.7 (balanced creativity vs. accuracy)
- Max output tokens: 600
- HTTP library: OkHttp (lightweight, no Spring WebFlux dependency needed)

---

## 9. Security Implementation

### 9.1 Firebase Authentication
- Email/password credentials are validated by Firebase Auth servers — passwords never reach the Spring Boot backend.
- Google OAuth is handled entirely by Firebase, which issues a signed ID token (JWT) on success.
- Tokens expire every 1 hour; the frontend automatically refreshes them via Firebase SDK.

### 9.2 Backend Token Validation
Every request to `/api/**` passes through `FirebaseAuthFilter`:
```
Request arrives → Extract "Authorization: Bearer <token>"
                → FirebaseAuth.getInstance().verifyIdToken(token)
                → Rejected (401) if invalid/expired
                → uid + email stored as request attributes
                → Downstream controllers use uid for authorisation
```

### 9.3 Firestore Security Rules
Server-side rules enforce data ownership:
- Users can only read/write their own `users/{uid}` document.
- Only faculty (role == "faculty") can create/update classes and sessions.
- Attendance records can only be created by the student themselves (QR scan) or faculty (manual).
- Admin has full read/write access across all collections.

### 9.4 CORS Policy
The Spring Boot `CorsConfig` restricts allowed origins to the configured frontend URL(s) only. `OPTIONS` pre-flight requests bypass the auth filter.

### 9.5 QR Code Security
- Each QR payload encodes the session ID + a server timestamp.
- Sessions expire after 15 minutes (`expiresAt` is validated server-side).
- The backend checks for duplicate attendance to prevent replaying the same QR.

---

## 10. Deployment Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      Production Deployment                     │
│                                                               │
│  User Browser                                                 │
│       │                                                       │
│       │ HTTPS                                                 │
│       ▼                                                       │
│  ┌──────────────────────────────────┐                        │
│  │  Vercel (or Firebase Hosting)    │                        │
│  │  React Build → CDN Edge Network  │                        │
│  │  Global POP (low latency)        │                        │
│  └──────────────┬───────────────────┘                        │
│                 │ API calls (HTTPS)                           │
│                 ▼                                             │
│  ┌──────────────────────────────────┐                        │
│  │  Render.com (Free Tier)          │                        │
│  │  Spring Boot JAR                 │                        │
│  │  Port 8080 → Render HTTPS proxy  │                        │
│  └──────────────┬───────────────────┘                        │
│                 │ Firebase Admin SDK                          │
│                 ▼                                             │
│  ┌──────────────────────────────────┐                        │
│  │  Google Firebase                 │                        │
│  │  • Auth (token issuance)         │                        │
│  │  • Firestore (database)          │                        │
│  └──────────────┬───────────────────┘                        │
│                 │ REST API                                    │
│                 ▼                                             │
│  ┌──────────────────────────────────┐                        │
│  │  Google Gemini Pro API           │                        │
│  │  (AI report generation)          │                        │
│  └──────────────────────────────────┘                        │
└───────────────────────────────────────────────────────────────┘
```

### Deployment Steps

**Frontend (Vercel):**
1. Push repo to GitHub.
2. Import project in Vercel dashboard.
3. Set root directory to `frontend`.
4. Add all `REACT_APP_*` environment variables.
5. Deploy — Vercel auto-builds on every push.

**Backend (Render):**
1. Create a new "Web Service" in Render, link GitHub repo.
2. Build command: `cd backend && mvn clean package -DskipTests`
3. Start command: `java -jar backend/target/smart-attendance-1.0.0.jar`
4. Add `GEMINI_API_KEY` environment variable in Render dashboard.
5. Place `serviceAccountKey.json` (from Firebase console) in `backend/src/main/resources/`.

**Firebase:**
1. `npm install -g firebase-tools && firebase login`
2. `firebase use --add` → select your project.
3. `firebase deploy --only firestore:rules,firestore:indexes`

---

## 11. Future Enhancements

1. **Biometric / Face Recognition Attendance**: Integrate a webcam-based facial recognition service (e.g., AWS Rekognition) as a secondary attendance method, eliminating even the need for students to open an app.

2. **Push Notification Alerts**: Use Firebase Cloud Messaging (FCM) to send real-time push notifications to students when their attendance falls below 75%, and to faculty when a session QR is about to expire.

3. **Leave Management Integration**: Allow students to apply for medical/emergency leave directly in the portal. Approved leaves would be excluded from attendance percentage calculations, ensuring fair treatment.

4. **Timetable Auto-Scheduling**: Integrate with the college ERP/timetable system so sessions are automatically created at scheduled class times — eliminating the need for faculty to manually start each session.

5. **Predictive Dropout Analytics**: Train an ML model on historical attendance + grade data to predict which students are at risk of dropping out, providing early intervention triggers for counsellors.

---

## 12. Viva Q&A (25 Detailed Questions & Answers)

---

**Q1. What is the core problem your project solves?**

Manual attendance is slow (wastes class time), fraud-prone (proxy attendance), and produces no real-time insights. Our system eliminates proxies via time-expiring QR codes unique to each session, automates percentage calculations, and uses AI to surface actionable insights — solving all three problems simultaneously.

---

**Q2. Why did you choose React over Angular or Vue?**

React's component model and hooks (useState, useEffect, useContext) make state management straightforward for our role-based dashboards without requiring Redux. Its massive ecosystem (React Router, Recharts, React Query) means every feature already has a mature library. TypeScript integration is first-class. Angular adds too much boilerplate for a project of this scope; Vue has a smaller job market in India.

---

**Q3. Why Firebase Firestore over a traditional SQL database like MySQL?**

Firestore offers automatic horizontal scaling, no server provisioning, and real-time listeners that push updates to connected clients instantly. Our attendance data is document-oriented (each record is self-contained), which maps naturally to Firestore's document model. Joins in Firestore are avoided by denormalising class names into attendance records. For a college with 5,000 students, Firestore scales effortlessly; a MySQL server would need infrastructure management.

---

**Q4. How does Firebase Authentication work in this system?**

Firebase Auth issues a signed JWT (JSON Web Token) upon successful login. The React frontend stores this token in memory via the Firebase SDK. Every Axios API call attaches the token as `Authorization: Bearer <token>`. The Spring Boot backend's `FirebaseAuthFilter` calls `FirebaseAuth.getInstance().verifyIdToken(token)` — which cryptographically validates the token signature using Google's public keys — and rejects any request with an invalid or expired token.

---

**Q5. Explain the QR code generation and validation flow.**

When faculty starts a session: (1) Spring Boot generates a UUID session ID and saves the session to Firestore with `status: "active"` and `expiresAt: now + 15 minutes`. (2) ZXing encodes the string `ATTEND_{sessionId}_{timestamp}` as a 300×300 QR PNG. (3) The PNG is Base64-encoded and returned to the frontend for display. When a student scans: (4) The frontend decodes the QR payload, extracts the sessionId, and sends `POST /api/attendance/qr {sessionId, studentId}`. (5) The backend validates the session is active and not expired, checks for duplicates, then saves the attendance record.

---

**Q6. How do you prevent proxy attendance?**

Three mechanisms work together: (a) **Time expiry** — QR codes expire after 15 minutes, so a student cannot photograph and share it for use in another period. (b) **Per-session uniqueness** — a new QR is generated for every single class session; the previous session's QR is immediately invalid. (c) **Duplicate detection** — the backend queries Firestore for an existing attendance record with the same `sessionId` + `studentId` combination before writing a new one, preventing a student from scanning twice.

---

**Q7. How does the Gemini AI integration work?**

The `GeminiService` aggregates the student's per-class attendance statistics from Firestore, then crafts a structured prompt instructing Gemini Pro to respond in a fixed format (SUMMARY / SUGGESTIONS / RISK). The formatted JSON request is sent to `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={apiKey}` via OkHttp. The response text is parsed line-by-line to extract the summary, bulleted suggestions, and risk level. If parsing fails or the API is down, a heuristic fallback produces a generic report.

---

**Q8. What are Firestore Security Rules and why are they important?**

Firestore Security Rules are server-side access control policies written in a custom DSL, deployed directly to Firebase. They ensure that even if someone bypasses your backend and calls Firestore directly, they cannot read or write unauthorised data. For example, our rules ensure a student can only read their own attendance records (`resource.data.studentId == request.auth.uid`) and only faculty can create sessions. Without rules, the database would be exposed to any authenticated user.

---

**Q9. Explain the role of Spring Boot's FirebaseAuthFilter.**

It's a `OncePerRequestFilter` — a Spring component that intercepts every HTTP request exactly once before it reaches any controller. It extracts the `Authorization` header, strips the `Bearer ` prefix, and calls the Firebase Admin SDK to verify the token. If verification succeeds, the decoded `uid` and `email` are stored as request attributes for use by controllers. If it fails, the filter short-circuits with `HTTP 401 Unauthorized` — no controller code ever runs.

---

**Q10. Why use ZXing for QR generation instead of a third-party API?**

ZXing (Zebra Crossing) is an open-source, battle-tested Java library that generates QR codes entirely in-process. Using it avoids: (a) external API latency, (b) API costs at scale, (c) a network dependency for a core feature. It gives us full control over size, colour scheme, and error correction level (we use Level H, the highest, for reliability in varying lighting conditions).

---

**Q11. What is the attendance percentage threshold and how is it computed?**

The standard threshold is 75% — the minimum required by most Indian universities for exam eligibility. Percentage is computed as: `(sessions attended / total sessions) × 100`. "Attended" counts both "present" and "late" statuses. The computation happens in `AttendanceController.getStats()` by grouping all records by `classId` and summing counts. The result is returned per class, and the frontend displays an aggregate average.

---

**Q12. How is CORS handled?**

The Spring Boot `CorsConfig` bean registers a `CorsFilter` that allows requests only from whitelisted origins (the React frontend URL). All HTTP methods (GET, POST, PUT, DELETE, OPTIONS) and all headers are permitted for those origins. `OPTIONS` pre-flight requests are handled by the CORS filter before reaching `FirebaseAuthFilter`, so they always return `200 OK` without requiring a Bearer token.

---

**Q13. How do you handle the student view of attendance from Firestore?**

The frontend calls `GET /api/attendance/stats/{studentId}`. The backend fetches all attendance documents where `studentId == uid` from Firestore using `whereEqualTo`. It then groups records by `classId` in a Java `LinkedHashMap`, accumulates `totalSessions` and `attended` counts per class, computes percentage, and returns an array. This server-side aggregation keeps frontend code simple and avoids downloading hundreds of raw records to the browser.

---

**Q14. What happens when a student scans an expired QR code?**

The backend reads `session.expiresAt` from Firestore and compares it to `Instant.now()`. If the session has expired, the controller returns `HTTP 400 Bad Request` with the message `"Session has expired"`. The frontend displays this error to the student. The session's `status` may still be "active" — expiry is enforced purely by timestamp comparison, which keeps the system stateless (no background job needed to flip statuses).

---

**Q15. How is the Admin analytics data aggregated?**

The `AdminController.getAnalytics()` method: (1) fetches all users and counts by role, (2) fetches all classes, (3) fetches all attendance records, (4) groups attendance by `classId` computing present/total per class, (5) computes institution-wide average. All of this happens in-memory in Java using streams and maps. For large datasets, this would be replaced by Firestore aggregation queries or a dedicated analytics service (BigQuery).

---

**Q16. What TypeScript types are defined and why?**

The `types/index.ts` file defines interfaces for `User`, `Class`, `Session`, `AttendanceRecord`, `AttendanceStats`, `AIReport`, and `AnalyticsSummary`. These provide: (a) IntelliSense autocompletion in VSCode, (b) compile-time errors if a component receives the wrong shape of data, (c) self-documenting code. The `UserRole` type (`"student" | "faculty" | "admin"`) is a union type that prevents any invalid role string from being assigned.

---

**Q17. How does React Context API manage authentication state?**

`useAuthProvider()` is a custom hook that encapsulates all Firebase Auth state and actions. It creates `currentUser`, `userProfile`, `loading`, `login`, `register`, `loginWithGoogle`, and `logout`. The `AuthContext` wraps the entire app in `App.tsx`, making auth state available anywhere via `useAuth()`. This avoids prop-drilling through every component tree. The `onAuthStateChanged` Firebase listener in `useEffect` keeps state in sync with token refresh.

---

**Q18. Why is the backend needed at all — couldn't the frontend call Firestore directly?**

Three reasons: (a) **Security**: Business logic like session expiry validation, duplicate detection, and role enforcement must run server-side where it cannot be tampered with. A savvy student could manipulate client-side code to bypass checks. (b) **AI Integration**: The Gemini API key must never be exposed in the browser (it would be visible in DevTools). The backend proxies AI calls and keeps the key server-side. (c) **QR Generation**: ZXing is a Java library; server-side generation produces consistent, high-quality QR images regardless of the student's device.

---

**Q19. Explain the denormalisation strategy used in Firestore.**

Firestore does not support server-side joins. To avoid multiple document reads when displaying attendance history, we denormalise: `className` is stored in every `attendance` document, and `studentName` is stored too. This means displaying a student's full attendance history requires only one collection query, not one query per record to look up class and student names. The trade-off is slightly larger documents and the need to update denormalised fields if a class name changes (acceptable since class names rarely change).

---

**Q20. How would the system scale to 10,000 concurrent users?**

- **Firestore**: Scales automatically to millions of reads/writes per second with no configuration.
- **Frontend (Vercel)**: Served from a global CDN — static files are edge-cached; effectively infinite scale.
- **Backend (Spring Boot on Render)**: Render's paid plans support multiple instances. Horizontally scaling Spring Boot is trivial since our service is stateless (all state is in Firestore). A load balancer distributes requests.
- **Bottleneck**: Gemini API has rate limits — mitigated by caching AI reports in Firestore (regenerate only if older than 24 hours).

---

**Q21. What is the difference between Firebase Admin SDK (backend) and Firebase JS SDK (frontend)?**

The **JS SDK** (frontend) uses API keys and Firestore Security Rules for access control — appropriate for untrusted browser environments. The **Admin SDK** (backend, Java) uses a Service Account private key, which grants unrestricted access to all Firebase services, bypassing Security Rules. This is why the service account key must never be exposed to clients — it's stored only on the backend server, referenced via an environment variable path.

---

**Q22. How does the system handle network failures during QR scanning?**

The frontend wraps every API call in a try/catch. If the QR scan POST request fails due to network issues, an error message is displayed. The student can retry immediately since the session is still active (15-minute window). No attendance is recorded until the server responds with `200 OK`, ensuring data integrity — partial writes are not possible with our request/response model.

---

**Q23. Describe the data flow when a faculty member generates a QR code.**

1. Faculty selects a class and clicks "Start New Session".
2. Frontend sends `POST /api/sessions { classId }` with Bearer token.
3. `FirebaseAuthFilter` validates the token.
4. `SessionController` fetches the class name from Firestore (one read).
5. Generates a UUID session ID and builds the QR payload string.
6. Calls `QRCodeService.generateQRDataUrl()` — ZXing encodes the string into a BitMatrix, `MatrixToImageWriter` converts it to a BufferedImage, which is Base64-encoded to a data URL.
7. Saves the session document to Firestore with `status: "active"`.
8. Returns the full session object (including the Base64 QR PNG) to the frontend.
9. Frontend displays the QR in a modal using a `<canvas>` element.

---

**Q24. What testing strategies would you apply to this project?**

- **Unit Tests** (JUnit 5 + Mockito): Test `GeminiService.parseGeminiResponse()`, `QRCodeService.buildQRPayload()`, and `AttendanceController.getStats()` in isolation by mocking Firestore and HTTP calls.
- **Integration Tests** (Spring Boot Test): Use `@SpringBootTest` with a Firebase emulator to test full request flows from controller to Firestore.
- **Frontend Tests** (React Testing Library): Test component rendering with mocked API responses — e.g., the student dashboard renders correct percentages.
- **E2E Tests** (Cypress): Simulate a full user journey: login → faculty starts session → QR generated → student scans → attendance marked → student views updated percentage.
- **Security Tests**: Verify that an unauthenticated request to `/api/attendance` returns `401`, and a student token cannot access `/api/admin/analytics`.

---

**Q25. What would you change if you were to rebuild this project?**

1. **React Query instead of raw Axios**: Automatic caching, background refetching, and loading/error states out of the box — eliminates boilerplate in every page component.
2. **Firestore Aggregation Queries**: Firebase now supports `count()` and `sum()` — replacing in-memory aggregation in the Admin controller with native queries that scale better.
3. **Separate Auth Service**: Extract token validation into a dedicated Spring Security filter chain configuration with role-based `@PreAuthorize` annotations on controllers, replacing manual attribute checks.
4. **WebSocket for Real-Time QR Updates**: Use Firestore's `onSnapshot` listener on the frontend to automatically show when new attendance records arrive during a live session — no manual refresh needed.
5. **Redis Caching for AI Reports**: Cache generated AI reports by studentId + date key in Redis with a 24-hour TTL, reducing Gemini API costs significantly.
