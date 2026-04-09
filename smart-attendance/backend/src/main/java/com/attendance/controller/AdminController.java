// backend/src/main/java/com/attendance/controller/AdminController.java
package com.attendance.controller;

import com.attendance.service.FirestoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final FirestoreService firestore;

    /** GET /api/admin/users */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(firestore.findAll("users"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /api/admin/users/{id}/role */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id,
                                         @RequestBody Map<String, Object> body) {
        try {
            firestore.update("users", id, Map.of("role", body.get("role")));
            return ResponseEntity.ok(Map.of("message", "Role updated"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/admin/users/{id} */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            firestore.delete("users", id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/analytics */
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        try {
            List<Map<String, Object>> users = firestore.findAll("users");
            List<Map<String, Object>> classes = firestore.findAll("classes");
            List<Map<String, Object>> attendance = firestore.findAll("attendance");

            long students = users.stream().filter(u -> "student".equals(u.get("role"))).count();
            long faculty = users.stream().filter(u -> "faculty".equals(u.get("role"))).count();

            // Per-class average
            Map<String, int[]> classAgg = new LinkedHashMap<>();
            Map<String, String> classNameMap = new HashMap<>();
            for (Map<String, Object> cls : classes) {
                classNameMap.put((String) cls.get("id"), (String) cls.get("subject"));
            }

            for (Map<String, Object> r : attendance) {
                String classId = (String) r.get("classId");
                String status = (String) r.getOrDefault("status", "absent");
                classAgg.putIfAbsent(classId, new int[]{0, 0});
                classAgg.get(classId)[0]++;
                if ("present".equals(status) || "late".equals(status)) classAgg.get(classId)[1]++;
            }

            List<Map<String, Object>> breakdown = new ArrayList<>();
            for (Map.Entry<String, int[]> e : classAgg.entrySet()) {
                int total = e.getValue()[0];
                double avg = total > 0 ? Math.round(e.getValue()[1] * 100.0 / total) : 0;
                breakdown.add(Map.of(
                        "className", classNameMap.getOrDefault(e.getKey(), "Unknown"),
                        "avg", avg
                ));
            }

            double overall = breakdown.isEmpty() ? 0 :
                    breakdown.stream().mapToDouble(b -> ((Number) b.get("avg")).doubleValue()).average().orElse(0);

            // Mock weekly trend (real implementation would query by date range)
            List<Map<String, Object>> trend = List.of(
                    Map.of("date", "Week 1", "percentage", 81.0),
                    Map.of("date", "Week 2", "percentage", 79.0),
                    Map.of("date", "Week 3", "percentage", 75.0),
                    Map.of("date", "Week 4", "percentage", Math.round(overall * 10.0) / 10.0)
            );

            return ResponseEntity.ok(Map.of(
                    "totalStudents", students,
                    "totalFaculty", faculty,
                    "totalClasses", classes.size(),
                    "avgAttendance", Math.round(overall * 10.0) / 10.0,
                    "classBreakdown", breakdown,
                    "trend", trend
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
