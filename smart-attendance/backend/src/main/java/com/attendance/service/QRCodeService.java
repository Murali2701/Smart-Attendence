// backend/src/main/java/com/attendance/service/QRCodeService.java
package com.attendance.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageConfig;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QRCodeService {

    private static final int QR_SIZE = 300;

    /**
     * Generates a QR code PNG and returns it as a Base64-encoded data URL.
     *
     * @param content  the text to encode (e.g. "ATTEND_{sessionId}_{timestamp}")
     * @return         "data:image/png;base64,..." string ready for <img src=...>
     */
    public String generateQRDataUrl(String content) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 2);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);

        // Dark = #161b22, Light = #e6edf3 (matches the app theme)
        MatrixToImageConfig config = new MatrixToImageConfig(0xFF161b22, 0xFFe6edf3);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix, config);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
        return "data:image/png;base64," + base64;
    }

    /**
     * Creates the canonical payload string for a session QR code.
     */
    public String buildQRPayload(String sessionId) {
        return "ATTEND_" + sessionId + "_" + System.currentTimeMillis();
    }
}
