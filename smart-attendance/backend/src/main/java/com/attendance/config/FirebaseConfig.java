// backend/src/main/java/com/attendance/config/FirebaseConfig.java
package com.attendance.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-path}")
    private Resource serviceAccountResource;

    @PostConstruct
    public void initialize() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            GoogleCredentials credentials =
                    GoogleCredentials.fromStream(serviceAccountResource.getInputStream());

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            FirebaseApp.initializeApp(options);
        }
    }
}
