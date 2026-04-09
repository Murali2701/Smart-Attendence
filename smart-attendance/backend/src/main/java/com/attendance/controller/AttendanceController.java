// backend/src/main/java/com/attendance/controller/AttendanceController.java
package com.attendance.controller;

import com.attendance.service.FirestoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private static final Logger log = LoggerFactory.getLogger(AttendanceController.class);
    private final FirestoreService firestore;

    public AttendanceController(FirestoreService firestore) {
        this.firestore = firestore;
    }

    /**
     * POST /api/attendance/qr
     * Body: { sessionId, studentId }
     * Marks attendance as "present" after validating the session is active and not expired.
     */
    @PostMapping("/qr")
    public ResponseEntity<?> markViaQR(@RequestBody Map<String, Object> body) {
        try {
            String sessionId = (String) body.get("sessionId");
            String studentId = (String) body.get("studentId");

            // Validate session
            Optional<Map<String, Object>> sessionOpt = firestore.findById("sessions", sessionId);
            if (sessionOpt.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Session not found"));

            Map<String, Object> session = sessionOpt.get();
            if (!"active".equals(session.get("status")))
                return ResponseEntity.badRequest().body(Map.of("error", "Session is not active"));

            String expiresAt = (String) session.get("expiresAt");
            if (expiresAt != null && Instant.parse(expiresAt).isBefore(Instant.now()))
                return ResponseEntity.badRequest().body(Map.of("error", "Session has expired"));

            // Check for duplicate
            List<Map<String, Object>> existing =
                    firestore.findWhere2("attendance", "sessionId", sessionId, "studentId", studentId);
            if (!existing.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Attendance already marked"));

            return saveAttendanceRecord(studentId, session, "present");
        } catch (Exception e) {
            log.error("markViaQR error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/attendance/manual
     * Body: { sessionId, studentId, status }
     * Faculty-initiated manual marking.
     */
    @PostMapping("/manual")
    public ResponseEntity<?> markManual(@RequestBody Map<String, Object> body) {
        try {
            String sessionId = (String) body.get("sessionId");
            String studentId = (String) body.get("studentId");
            String status = (String) body.getOrDefault("status", "present");

            Optional<Map<String, Object>> sessionOpt = firestore.findById("sessions", sessionId);
            if (sessionOpt.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Session not found"));

            return saveAttendanceRecord(studentId, sessionOpt.get(), status);
        } catch (Exception e) {
            log.error("markManual error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> saveAttendanceRecord(String studentId,
                                                     Map<String, Object> session,
                                                     String status) throws Exception {
        // Fetch student name
        Optional<Map<String, Object>> userOpt = firestore.findById("users", studentId);
        String studentName = userOpt.map(u -> (String) u.get("name")).orElse("Unknown");

        Map<String, Object> record = new HashMap<>();
        record.put("studentId", studentId);
        record.put("studentName", studentName);
        record.put("sessionId", session.get("id"));
        record.put("classId", session.get("classId"));
        record.put("className", session.get("className"));
        record.put("date", session.get("date"));
        record.put("status", status);
        record.put("markedAt", Instant.now().toString());

        String id = firestore.save("attendance", null, record);
        record.put("id", id);
        return ResponseEntity.ok(record);
    }

    /** GET /api/attendance/student/{studentId} — full history */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getByStudent(@PathVariable String studentId) {
        try {
            List<Map<String, Object>> records =
                    firestore.findWhere("attendance", "studentId", studentId);
            records.sort((a, b) ->
                    String.valueOf(b.get("date")).compareTo(String.valueOf(a.get("date"))));
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("getByStudent error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/attendance/session/{sessionId} */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getBySession(@PathVariable String sessionId) {
        try {
            return ResponseEntity.ok(firestore.findWhere("attendance", "sessionId", sessionId));
        } catch (Exception e) {
            log.error("getBySession error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/attendance/stats/{studentId}
     * Returns per-class attendance statistics.
     */
    @GetMapping("/stats/{studentId}")
    public ResponseEntity<?> getStats(@PathVariable String studentId) {
        try {
            List<Map<String, Object>> records =
                    firestore.findWhere("attendance", "studentId", studentId);

            // Group by classId
            Map<String, Map<String, Object>> statsMap = new LinkedHashMap<>();
            for (Map<String, Object> r : records) {
                String classId = (String) r.get("classId");
                String className = (String) r.getOrDefault("className", "Unknown");

                statsMap.putIfAbsent(classId, new HashMap<>(Map.of(
                        "classId", classId,
                        "className", className,
                        "totalSessions", 0,
                        "attended", 0
                )));

                Map<String, Object> stat = statsMap.get(classId);
                int total = ((Number) stat.get("totalSessions")).intValue() + 1;
                int attended = ((Number) stat.get("attended")).intValue();
                String status = (String) r.getOrDefault("status", "absent");
                if ("present".equals(status) || "late".equals(status)) attended++;

                stat.put("totalSessions", total);
                stat.put("attended", attended);
                stat.put("percentage", total == 0 ? 0 : Math.round(attended * 100.0 / total));
            }

            return ResponseEntity.ok(new ArrayList<>(statsMap.values()));
        } catch (Exception e) {
            log.error("getStats error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
