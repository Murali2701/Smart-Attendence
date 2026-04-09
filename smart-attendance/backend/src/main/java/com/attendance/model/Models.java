// backend/src/main/java/com/attendance/model/Models.java
package com.attendance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// ── User ─────────────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class UserModel {
    private String id;
    private String name;
    private String email;
    private String role;          // student | faculty | admin
    private String createdAt;
}

// ── Class ─────────────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ClassModel {
    private String id;
    private String subject;
    private String facultyId;
    private String facultyName;
    private String schedule;
    private int studentCount;
}

// ── Session ───────────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class SessionModel {
    private String id;
    private String classId;
    private String className;
    private String date;
    private String qrCode;        // Base64 PNG data URL
    private String expiresAt;     // ISO-8601
    private String status;        // active | closed
}

// ── Attendance Record ─────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AttendanceRecord {
    private String id;
    private String studentId;
    private String studentName;
    private String classId;
    private String className;
    private String sessionId;
    private String date;
    private String status;        // present | absent | late
}

// ── Attendance Stats ──────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AttendanceStats {
    private String classId;
    private String className;
    private int totalSessions;
    private int attended;
    private double percentage;
}

// ── AI Report ─────────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AIReport {
    private String studentName;
    private String summary;
    private List<String> suggestions;
    private String riskLevel;     // low | medium | high
    private String generatedAt;
}

// ── Analytics Summary ─────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AnalyticsSummary {
    private int totalStudents;
    private int totalFaculty;
    private int totalClasses;
    private double avgAttendance;
    private List<ClassAvg> classBreakdown;
    private List<TrendPoint> trend;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClassAvg {
        private String className;
        private double avg;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TrendPoint {
        private String date;
        private double percentage;
    }
}
