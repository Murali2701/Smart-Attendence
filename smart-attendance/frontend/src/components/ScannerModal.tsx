// frontend/src/components/ScannerModal.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isInitializing, setIsInitializing] = useState(true);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrcodeRegionId = "reader";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
  }, []);

  const startScanner = useCallback(async (mode: "user" | "environment") => {
    if (!scannerRef.current) return;
    
    setIsInitializing(true);
    setError("");

    try {
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await scannerRef.current.start(
        { facingMode: mode },
        config,
        async (decodedText: string) => {
          if (!decodedText.startsWith("ATTEND_")) {
            setError("Invalid QR code for attendance.");
            return;
          }

          // Success: stop scanner and process
          await scannerRef.current?.stop();
          
          const parts = decodedText.split("_");
          const sessionId = parts[1];

          try {
            setSuccess("Processing attendance...");
            const res = await attendanceApi.markViaQR(sessionId, userProfile!.id);
            setSuccess("Attendance marked successfully!");
            
            setTimeout(() => {
              onSuccess(res.data);
              onClose();
            }, 1500);
          } catch (err: any) {
            const msg = err.response?.data?.error || "Failed to mark attendance.";
            setError(msg);
            // Restart scanning if failed
            startScanner(mode);
          }
        },
        () => { /* subtle frame failure ignored */ }
      );
      setIsInitializing(false);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setError("Could not access camera. Make sure permissions are granted.");
      setIsInitializing(false);
    }
  }, [onClose, onSuccess, userProfile]);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode(qrcodeRegionId);
    startScanner(facingMode);

    return () => {
      stopScanner().then(() => {
        scannerRef.current = null;
      });
    };
  }, [facingMode, startScanner, stopScanner]);

  const handleToggleCamera = async () => {
    if (isInitializing) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    await stopScanner();
    setFacingMode(newMode);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Scan QR Code</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
              Using {facingMode === 'environment' ? 'Back' : 'Front'} Camera
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div 
          className="scanner-container" 
          onDoubleClick={handleToggleCamera}
          title="Double click to switch camera"
          style={{ cursor: 'pointer' }}
        >
          <div id={qrcodeRegionId}></div>
          {!isInitializing && !success && (
            <div className="scanner-overlay">
              <div className="scanner-frame"></div>
            </div>
          )}
          {isInitializing && (
            <div className="scanner-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div className="loader"></div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Point your camera at the QR code.
          </p>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={handleToggleCamera}
            style={{ marginTop: '0.5rem' }}
          >
            🔄 Switch to {facingMode === 'environment' ? 'Front' : 'Back'} Camera
          </button>
        </div>

        {error && (
          <div className="scan-feedback error">
            {error}
          </div>
        )}

        {success && (
          <div className="scan-feedback success">
            ✨ {success}
          </div>
        )}

        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center", marginTop: '0.75rem', opacity: 0.7 }}>
          Tip: Double-click the camera view to toggle cameras.
        </p>
      </div>
    </div>
  );
};

export default ScannerModal;
