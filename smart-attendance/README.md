# 🎓 Smart Attendance Management System

> QR-based, AI-powered attendance for modern colleges — Final Year CSE Project

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?logo=springboot) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase) ![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | Firebase Auth — Google OAuth + Email/Password |
| 📱 QR Attendance | Time-limited per-session QR codes (ZXing) |
| 🤖 AI Reports | Gemini Pro attendance summaries + suggestions |
| 📊 Dashboards | Role-specific dashboards with Recharts visualisations |
| 👤 3 Roles | Student · Faculty · Admin |
| 🔒 Security | Firebase token validation on every backend request |
| ☁️ Deployed | Frontend → Vercel, Backend → Render, DB → Firestore |

---

## 🏗️ Project Structure

```
smart-attendance/
├── frontend/                  # React 18 + TypeScript
│   ├── src/
│   │   ├── App.tsx            # Router + AuthContext provider
│   │   ├── App.css            # Global dark-theme styles
│   │   ├── firebase.ts        # Firebase client config
│   │   ├── hooks/
│   │   │   └── useAuth.ts     # Auth context + all auth operations
│   │   ├── services/
│   │   │   └── api.ts         # Axios instance + all API calls
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       ├── StudentDashboard.tsx   # Overview + History + AI Report
│   │       ├── FacultyDashboard.tsx   # Classes + Sessions + QR Modal
│   │       └── AdminDashboard.tsx     # Analytics + Users + Reports
│   ├── public/index.html
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # Spring Boot 3 + Java 17
│   └── src/main/java/com/attendance/
│       ├── SmartAttendanceApplication.java
│       ├── config/
│       │   ├── FirebaseConfig.java    # Firebase Admin SDK init
│       │   └── CorsConfig.java        # CORS configuration
│       ├── security/
│       │   └── FirebaseAuthFilter.java  # JWT verification
│       ├── service/
│       │   ├── FirestoreService.java    # Generic CRUD layer
│       │   ├── QRCodeService.java       # ZXing QR generation
│       │   └── GeminiService.java       # Gemini AI integration
│       ├── controller/
│       │   ├── ClassController.java
│       │   ├── SessionController.java
│       │   ├── AttendanceController.java
│       │   ├── AIController.java
│       │   └── AdminController.java
│       └── model/
│           └── Models.java             # Lombok data classes
│
├── firebase/
│   ├── firestore.rules        # Firestore Security Rules
│   └── firestore.indexes.json # Composite indexes
│
├── DOCUMENTATION.md           # Full project docs + Viva Q&A
├── firebase.json              # Firebase hosting config
├── vercel.json                # Vercel deployment config
├── render.yaml                # Render backend deployment
├── docker-compose.yml         # Local dev environment
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Java 17 (JDK)
- Maven 3.8+
- Firebase CLI (`npm i -g firebase-tools`)
- A Firebase project with Firestore + Auth enabled

### 1. Firebase Setup

```bash
# Login and create project
firebase login
firebase projects:create smart-attendance-demo

# Enable Firestore and Authentication in Firebase Console
# Download serviceAccountKey.json from:
# Firebase Console → Project Settings → Service Accounts → Generate new private key
cp path/to/serviceAccountKey.json backend/src/main/resources/serviceAccountKey.json

# Deploy Firestore rules and indexes
firebase use smart-attendance-demo
firebase deploy --only firestore:rules,firestore:indexes
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your Firebase project values

npm install
npm start
# → http://localhost:3000
```

### 3. Backend Setup

```bash
cd backend
# Edit src/main/resources/application.properties
# Set gemini.api.key = your key from https://aistudio.google.com

mvn clean install
mvn spring-boot:run
# → http://localhost:8080
```

### 4. Using Docker Compose

```bash
# From repo root
cp frontend/.env.example .env
# Fill in all values in .env

docker compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
```

---

## 🌐 Deployment

### Frontend → Vercel
1. Push to GitHub.
2. Import in [vercel.com](https://vercel.com) → set root to `frontend`.
3. Add all `REACT_APP_*` environment variables.
4. Deploy.

### Backend → Render
1. Create Web Service in [render.com](https://render.com) → link GitHub.
2. Build: `cd backend && mvn clean package -DskipTests`
3. Start: `java -jar backend/target/smart-attendance-1.0.0.jar`
4. Set `GEMINI_API_KEY` env var in Render dashboard.

### Frontend → Firebase Hosting (alternative)
```bash
cd frontend && npm run build
firebase deploy --only hosting
```

---

## 🔑 Environment Variables

### Frontend (`frontend/.env`)
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_BACKEND_URL=https://your-backend.onrender.com/api
```

### Backend (`application.properties`)
```
firebase.service-account-path=classpath:serviceAccountKey.json
gemini.api.key=YOUR_GEMINI_API_KEY
cors.allowed-origins=https://your-frontend.vercel.app
```

---

## 📋 API Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/classes` | Faculty | Create a class |
| GET | `/api/classes/faculty/{id}` | Faculty | Get faculty's classes |
| GET | `/api/classes/student/{id}` | Student | Get enrolled classes |
| POST | `/api/sessions` | Faculty | Start session + generate QR |
| GET | `/api/sessions/class/{id}` | Faculty | Get class sessions |
| PUT | `/api/sessions/{id}/close` | Faculty | Close a session |
| POST | `/api/attendance/qr` | Student | Mark attendance via QR |
| POST | `/api/attendance/manual` | Faculty | Manual attendance marking |
| GET | `/api/attendance/stats/{id}` | Student | Attendance stats per class |
| POST | `/api/ai/report/{id}` | Student | Generate AI report |
| GET | `/api/admin/analytics` | Admin | System-wide analytics |
| GET | `/api/admin/users` | Admin | All users |

---

## 👥 User Roles

### Student
- View per-subject attendance percentages with progress bars
- Full session-by-session attendance history
- Generate AI-powered report (summary + suggestions + risk level)

### Faculty
- Create and manage classes
- Start attendance sessions with generated QR codes
- View real-time attendance for each session
- Manual attendance marking

### Admin
- System-wide analytics dashboard
- User management (view, change role, delete)
- At-risk student identification
- Attendance trend charts

---

## 📄 License

MIT — Free to use for academic and personal projects.

---

*Built as a Final Year CSE Project · React 18 · Spring Boot 3 · Firebase · Gemini AI*
