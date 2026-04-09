// backend/src/main/java/com/attendance/security/FirebaseAuthFilter.java
package com.attendance.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Intercepts every request, extracts the Firebase Bearer token from
 * the Authorization header, and validates it.  The decoded token
 * (uid + claims) is stored as a request attribute for downstream use.
 */
@Component
public class FirebaseAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Skip token check for OPTIONS (CORS pre-flight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String idToken = authHeader.substring(7);

            try {
                FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
                request.setAttribute("uid", decoded.getUid());
                request.setAttribute("email", decoded.getEmail());
                // Store full token for role checks
                request.setAttribute("firebaseToken", decoded);
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Invalid or expired Firebase token\"}");
                return;
            }
        } 
else {
            // No token – reject (all /api/** routes require auth)
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Authorization header missing\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    /** Skip the filter for non-API paths (e.g. actuator, health) */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !path.startsWith("/api/");
    }
}
