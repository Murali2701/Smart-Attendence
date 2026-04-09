// frontend/src/components/ScannerModal.tsx
import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { attendanceApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";

interface ScannerModalProps {
  onClose: () => void;
  onSuccess: (record: any) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    const onScanSuccess = async (decodedText: string) => {
      // Expected format: ATTEND_{sessionId}_{timestamp}
      if (!decodedText.startsWith("ATTEND_")) {
        setError("Invalid QR code for attendance.");
        return;
      }

      setIsScanning(false);
      scanner.clear(); // Stop scanning

      const parts = decodedText.split("_");
      const sessionId = parts[1];

      try {
        setSuccess("Processing attendance...");
        const res = await attendanceApi.markViaQR(sessionId, userProfile!.id);
        setSuccess("Attendance marked successfully!");
        
        // Short delay to show success before closing
        setTimeout(() => {
          onSuccess(res.data);
          onClose();
        }, 1500);
      } catch (err: any) {
        const msg = err.response?.data?.error || "Failed to mark attendance.";
        setError(msg);
        setIsScanning(true); // Allow retry if it failed (re-initialize happens below)
      }
    };

    const onScanFailure = (error: string) => {
      // We don't want to show every frame failure
      // console.warn(`Code scan error = ${error}`);
    };

    if (isScanning) {
      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onClose, onSuccess, userProfile, isScanning]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Scan QR Code</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="scanner-container">
          <div id="reader"></div>
          {isScanning && (
            <div className="scanner-overlay">
              <div className="scanner-frame"></div>
            </div>
          )}
        </div>

        {error && (
          <div className="scan-feedback error">
            {error}
            <button 
              className="btn btn-sm btn-outline" 
              style={{ marginLeft: '10px' }}
              onClick={() => { setError(""); setIsScanning(true); }}
            >
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className="scan-feedback success">
            ✨ {success}
          </div>
        )}

        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginTop: "1rem" }}>
          Point your camera at the QR code displayed by the faculty.
        </p>
      </div>
    </div>
  );
};

export default ScannerModal;
