// backend/src/main/java/com/attendance/service/GeminiService.java
package com.attendance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final OkHttpClient http = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Calls Gemini Pro to generate an attendance summary and suggestions.
     *
     * @param studentName    student's full name
     * @param attendanceData list of maps with classId, className, pct, attended, total
     * @return map with keys: summary, suggestions (List<String>), riskLevel
     */
    public Map<String, Object> generateAttendanceReport(
            String studentName, List<Map<String, Object>> attendanceData) throws IOException {

        String prompt = buildPrompt(studentName, attendanceData);

        String requestBody = mapper.writeValueAsString(Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 600
                )
        ));

        Request request = new Request.Builder()
                .url(apiUrl + "?key=" + apiKey)
                .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                .build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.error("Gemini API error: {}", response.code());
                return fallbackReport(studentName, attendanceData);
            }

            String body = response.body().string();
            JsonNode root = mapper.readTree(body);
            String text = root
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            return parseGeminiResponse(text, attendanceData);
        } catch (Exception e) {
            log.error("Gemini call failed: {}", e.getMessage());
            return fallbackReport(studentName, attendanceData);
        }
    }

    private String buildPrompt(String studentName, List<Map<String, Object>> data) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an academic advisor AI. Analyze the following student attendance data and provide:\n");
        sb.append("1. A 3-sentence summary of attendance performance.\n");
        sb.append("2. Exactly 5 specific, actionable improvement suggestions.\n");
        sb.append("3. A risk level: 'low' (>=75%), 'medium' (60-74%), or 'high' (<60%).\n\n");
        sb.append("Format your response EXACTLY as:\n");
        sb.append("SUMMARY: <summary text>\n");
        sb.append("SUGGESTIONS:\n- <suggestion 1>\n- <suggestion 2>\n- <suggestion 3>\n- <suggestion 4>\n- <suggestion 5>\n");
        sb.append("RISK: <low|medium|high>\n\n");
        sb.append("Student: ").append(studentName).append("\n");
        sb.append("Attendance Data:\n");
        for (Map<String, Object> d : data) {
            sb.append("- ").append(d.get("className"))
              .append(": ").append(d.get("attended")).append("/").append(d.get("total"))
              .append(" (").append(d.get("pct")).append("%)\n");
        }
        return sb.toString();
    }

    private Map<String, Object> parseGeminiResponse(String text, List<Map<String, Object>> data) {
        Map<String, Object> result = new HashMap<>();
        List<String> suggestions = new ArrayList<>();
        String summary = "", riskLevel = "medium";

        try {
            String[] lines = text.split("\n");
            boolean inSuggestions = false;
            for (String line : lines) {
                if (line.startsWith("SUMMARY:")) {
                    summary = line.replace("SUMMARY:", "").trim();
                    inSuggestions = false;
                } else if (line.startsWith("SUGGESTIONS:")) {
                    inSuggestions = true;
                } else if (line.startsWith("RISK:")) {
                    riskLevel = line.replace("RISK:", "").trim().toLowerCase();
                    inSuggestions = false;
                } else if (inSuggestions && line.trim().startsWith("-")) {
                    suggestions.add(line.trim().substring(1).trim());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse Gemini response structure");
        }

        if (summary.isEmpty()) summary = "AI analysis complete. Please review individual subject attendance.";
        if (suggestions.isEmpty()) suggestions = List.of("Attend all remaining classes.", "Contact your faculty for guidance.");

        result.put("summary", summary);
        result.put("suggestions", suggestions);
        result.put("riskLevel", riskLevel);
        return result;
    }

    /** Used when Gemini API is unavailable (demo mode). */
    private Map<String, Object> fallbackReport(String studentName, List<Map<String, Object>> data) {
        double avg = data.stream()
                .mapToDouble(d -> ((Number) d.getOrDefault("pct", 0)).doubleValue())
                .average().orElse(0);
        String risk = avg >= 75 ? "low" : avg >= 60 ? "medium" : "high";
        return Map.of(
                "summary", studentName + " has an overall attendance of " + String.format("%.1f", avg)
                        + "%. Performance varies across subjects. Consistent attendance is essential for academic success.",
                "suggestions", List.of(
                        "Review your weakest subject and create a dedicated attendance plan.",
                        "Set daily reminders for early-morning lectures.",
                        "Inform faculty in advance when absences are unavoidable.",
                        "Form a study group with classmates to stay accountable.",
                        "Meet with your academic advisor to discuss attendance requirements."
                ),
                "riskLevel", risk
        );
    }
}
