// backend/src/main/java/com/attendance/service/FirestoreService.java
package com.attendance.service;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Generic Firestore helper – wraps all CRUD operations.
 * Controllers call domain-specific methods; this class handles
 * the low-level Firestore SDK calls and exception translation.
 */
@Service
public class FirestoreService {

    private Firestore db() {
        return FirestoreClient.getFirestore();
    }

    // ── Generic CRUD ──────────────────────────────────────────────────────────

    public String save(String collection, String docId, Map<String, Object> data)
            throws ExecutionException, InterruptedException {
        DocumentReference ref = docId != null
                ? db().collection(Objects.requireNonNull(collection)).document(Objects.requireNonNull(docId))
                : db().collection(Objects.requireNonNull(collection)).document();
        data.put("id", ref.getId());
        ref.set(data).get();
        return ref.getId();
    }

    public Optional<Map<String, Object>> findById(String collection, String id)
            throws ExecutionException, InterruptedException {
        DocumentSnapshot snap = db().collection(Objects.requireNonNull(collection)).document(Objects.requireNonNull(id)).get().get();
        return snap.exists() ? Optional.of(snap.getData()) : Optional.empty();
    }

    public List<Map<String, Object>> findAll(String collection)
            throws ExecutionException, InterruptedException {
        QuerySnapshot qs = db().collection(Objects.requireNonNull(collection)).get().get();
        List<Map<String, Object>> result = new ArrayList<>();
        for (DocumentSnapshot doc : qs.getDocuments()) result.add(doc.getData());
        return result;
    }

    public List<Map<String, Object>> findWhere(String collection, String field, Object value)
            throws ExecutionException, InterruptedException {
        QuerySnapshot qs = db().collection(Objects.requireNonNull(collection))
                .whereEqualTo(Objects.requireNonNull(field), value).get().get();
        List<Map<String, Object>> result = new ArrayList<>();
        for (DocumentSnapshot doc : qs.getDocuments()) result.add(doc.getData());
        return result;
    }

    public List<Map<String, Object>> findWhere2(String collection,
                                                  String f1, Object v1,
                                                  String f2, Object v2)
            throws ExecutionException, InterruptedException {
        QuerySnapshot qs = db().collection(Objects.requireNonNull(collection))
                .whereEqualTo(Objects.requireNonNull(f1), v1).whereEqualTo(Objects.requireNonNull(f2), v2).get().get();
        List<Map<String, Object>> result = new ArrayList<>();
        for (DocumentSnapshot doc : qs.getDocuments()) result.add(doc.getData());
        return result;
    }

    public void update(String collection, String id, Map<String, Object> fields)
            throws ExecutionException, InterruptedException {
        db().collection(Objects.requireNonNull(collection)).document(Objects.requireNonNull(id)).update(Objects.requireNonNull(fields)).get();
    }

    public void delete(String collection, String id)
            throws ExecutionException, InterruptedException {
        db().collection(Objects.requireNonNull(collection)).document(Objects.requireNonNull(id)).delete().get();
    }
}
