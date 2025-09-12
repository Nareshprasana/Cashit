"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let stream = null;
    let animationId = null;

    async function startCamera() {
      try {
        const permission = await navigator.permissions.query({ name: "camera" }).catch(() => null);

        if (permission && permission.state === "denied") {
          setPermissionDenied(true);
          onError?.("Camera permission is denied in browser settings.");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true);
          await videoRef.current.play();
          scanFrame();
        }
      } catch (err) {
        setPermissionDenied(true);
        onError?.("Camera access denied or unavailable.");
      }
    }

    function scanFrame() {
      if (videoRef.current && videoRef.current.readyState >= 2 && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          stopCamera();
          onScan?.(code.data);
          return;
        }
      }
      animationId = requestAnimationFrame(scanFrame);
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    startCamera();
    return () => stopCamera();
  }, [onScan, onError]);

  return (
    <div className="p-4 text-center">
      <video ref={videoRef} className="w-full rounded" playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {permissionDenied && (
        <div className="mt-4">
          <p className="text-red-500 mb-2">
            Camera access denied. Please allow camera permissions in your browser settings.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry Camera Access
          </button>
        </div>
      )}
    </div>
  );
}
