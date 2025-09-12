"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export default function QRScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const constraints = { video: { facingMode: "environment" } };
    let stream;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true); // iOS
        await videoRef.current.play();
        scan();
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Camera access denied or not available.");
      }
    };

    const scan = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      const tick = () => {
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);

          if (code) {
            setResult(code.data);
            return; // Stop scanning once QR is found
          }
        }
        requestAnimationFrame(tick);
      };

      tick();
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📷 QR Code Scanner</h2>

      <div className="relative w-full max-w-sm aspect-square border rounded-lg overflow-hidden shadow">
        <video ref={videoRef} className="absolute w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {result && (
        <p className="mt-4 text-green-600 font-medium">
          ✅ QR Code Detected: <br />
          <code className="bg-gray-100 p-1 rounded text-sm">{result}</code>
        </p>
      )}

      {error && (
        <p className="mt-4 text-red-500 font-medium">⚠️ {error}</p>
      )}
    </div>
  );
}
