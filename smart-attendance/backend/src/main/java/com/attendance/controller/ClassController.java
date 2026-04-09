// backend/src/main/java/com/attendance/controller/ClassController.java
package com.attendance.controller;

import com.attendance.service.FirestoreService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {

    private final FirestoreService firestore;

    /** GET /api/classes — admin: all classes */
    @GetMapping
    public ResponseEntity<?> getAllClasses() {
        try {
            return ResponseEntity.ok(firestore.findAll("classes"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/classes/faculty/{facultyId} */
    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<?> getByFaculty(@PathVariable String facultyId) {
        try {
            return ResponseEntity.ok(firestore.findWhere("classes", "facultyId", facultyId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/classes/student/{studentId} — classes the student is enrolled in */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getByStudent(@PathVariable String studentId) {
        try {
            List<Map<String, Object>> enrollments = firestore.findWhere("students", "userId", studentId);
            List<Map<String, Object>> classes = new ArrayList<>();
            for (Map<String, Object> e : enrollments) {
                String classId = (String) e.get("classId");
                firestore.findById("classes", classId).ifPresent(classes::add);
            }
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/classes — faculty creates a class */
    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            String uid = (String) request.getAttribute("uid");
            String email = (String) request.getAttribute("email");

            // Fetch faculty name from users collection
            Optional<Map<String, Object>> user = firestore.findById("users", uid);
            String facultyName = user.map(u -> (String) u.get("name")).orElse(email);

            Map<String, Object> classData = new HashMap<>(body);
            classData.put("facultyId", uid);
            classData.put("facultyName", facultyName);
            classData.put("studentCount", 0);
            classData.put("createdAt", new Date().toInstant().toString());

            String id = firestore.save("classes", null, classData);
            classData.put("id", id);
            return ResponseEntity.ok(classData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/classes/{classId}/enroll */
    @PostMapping("/{classId}/enroll")
    public ResponseEntity<?> enroll(@PathVariable String classId,
            @RequestBody Map<String, Object> body) {
        try {
            String studentId = (String) body.get("studentId");
            Map<String, Object> enrollment = Map.of(
                    "classId", classId,
                    "userId", studentId,
                    "enrolledAt", new Date().toInstant().toString());
            firestore.save("students", null, new HashMap<>(enrollment));

            // Increment studentCount
            Optional<Map<String, Object>> cls = firestore.findById("classes", classId);
            cls.ifPresent(c -> {
                int count = ((Number) c.getOrDefault("studentCount", 0)).intValue() + 1;
                try {
                    firestore.update("classes", classId, Map.of("studentCount", count));
                } catch (Exception ignored) {
                }
            });
            return ResponseEntity.ok(Map.of("message", "Enrolled successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/classes/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable String id) {
        try {
            firestore.delete("classes", id);
            return ResponseEntity.ok(Map.of("message", "Class deleted"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
