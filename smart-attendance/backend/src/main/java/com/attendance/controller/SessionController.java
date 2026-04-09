// backend/src/main/java/com/attendance/controller/SessionController.java
package com.attendance.controller;

import com.attendance.service.FirestoreService;
import com.attendance.service.QRCodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private static final Logger log = LoggerFactory.getLogger(SessionController.class);
    private final FirestoreService firestore;
    private final QRCodeService qrCodeService;

    public SessionController(FirestoreService firestore, QRCodeService qrCodeService) {
        this.firestore = firestore;
        this.qrCodeService = qrCodeService;
    }

    /** POST /api/sessions — start a new attendance session with QR code */
    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody Map<String, Object> body) {
        try {
            String classId = (String) body.get("classId");

            // Fetch class name
            Optional<Map<String, Object>> cls = firestore.findById("classes", classId);
            String className = cls.map(c -> (String) c.get("subject")).orElse("Unknown Class");

            // Build session document
            String sessionRef = UUID.randomUUID().toString();
            String qrPayload = qrCodeService.buildQRPayload(sessionRef);
            String qrDataUrl = qrCodeService.generateQRDataUrl(qrPayload);
            String expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES).toString();

            Map<String, Object> session = new HashMap<>();
            session.put("classId", classId);
            session.put("className", className);
            session.put("date", Instant.now().toString().split("T")[0]);
            session.put("qrCode", qrDataUrl);      // Base64 PNG for display
            session.put("qrPayload", qrPayload);    // Raw text encoded in QR
            session.put("expiresAt", expiresAt);
            session.put("status", "active");
            session.put("createdAt", Instant.now().toString());

            String id = firestore.save("sessions", sessionRef, session);
            session.put("id", id);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            log.error("createSession error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/sessions/class/{classId} — all sessions for a class */
    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getByClass(@PathVariable String classId) {
        try {
            return ResponseEntity.ok(firestore.findWhere("sessions", "classId", classId));
        } catch (Exception e) {
            log.error("getByClass error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/sessions/class/{classId}/active */
    @GetMapping("/class/{classId}/active")
    public ResponseEntity<?> getActive(@PathVariable String classId) {
        try {
            List<Map<String, Object>> active =
                    firestore.findWhere2("sessions", "classId", classId, "status", "active");
            return ResponseEntity.ok(active.isEmpty() ? null : active.get(0));
        } catch (Exception e) {
            log.error("getActive error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /api/sessions/{id}/close */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeSession(@PathVariable String id) {
        try {
            firestore.update("sessions", id, Map.of("status", "closed"));
            return ResponseEntity.ok(Map.of("message", "Session closed"));
        } catch (Exception e) {
            log.error("closeSession error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
