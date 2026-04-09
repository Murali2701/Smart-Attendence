// backend/src/main/java/com/attendance/controller/AIController.java
package com.attendance.controller;

import com.attendance.service.FirestoreService;
import com.attendance.service.GeminiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger log = LoggerFactory.getLogger(AIController.class);
    private final FirestoreService firestore;
    private final GeminiService gemini;

    public AIController(FirestoreService firestore, GeminiService gemini) {
        this.firestore = firestore;
        this.gemini = gemini;
    }

    /**
     * POST /api/ai/report/{studentId}
     * Fetches the student's attendance records, aggregates per-class stats,
     * calls Gemini to produce a report, and returns it.
     */
    @PostMapping("/report/{studentId}")
    public ResponseEntity<?> generateReport(@PathVariable String studentId) {
        try {
            // 1. Fetch student profile
            Optional<Map<String, Object>> userOpt = firestore.findById("users", studentId);
            String studentName = userOpt.map(u -> (String) u.get("name")).orElse("Student");

            // 2. Fetch all attendance records for the student
            List<Map<String, Object>> records =
                    firestore.findWhere("attendance", "studentId", studentId);

            // 3. Aggregate per class
            Map<String, int[]> aggMap = new LinkedHashMap<>();   // classId -> [total, attended]
            Map<String, String> classNames = new HashMap<>();

            for (Map<String, Object> r : records) {
                String classId = (String) r.get("classId");
                String className = (String) r.getOrDefault("className", "Unknown");
                classNames.put(classId, className);
                aggMap.putIfAbsent(classId, new int[]{0, 0});
                aggMap.get(classId)[0]++;
                String status = (String) r.getOrDefault("status", "absent");
                if ("present".equals(status) || "late".equals(status)) aggMap.get(classId)[1]++;
            }

            List<Map<String, Object>> attendanceData = new ArrayList<>();
            for (Map.Entry<String, int[]> e : aggMap.entrySet()) {
                int total = e.getValue()[0];
                int attended = e.getValue()[1];
                double pct = total > 0 ? Math.round(attended * 100.0 / total) : 0;
                attendanceData.add(Map.of(
                        "classId", e.getKey(),
                        "className", classNames.getOrDefault(e.getKey(), "Unknown"),
                        "total", total,
                        "attended", attended,
                        "pct", pct
                ));
            }

            // 4. Call Gemini
            Map<String, Object> aiResult = gemini.generateAttendanceReport(studentName, attendanceData);

            // 5. Build final response
            Map<String, Object> report = new HashMap<>(aiResult);
            report.put("studentName", studentName);
            report.put("generatedAt", Instant.now().toString());

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("AI report generation failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
