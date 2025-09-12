// src/app/dashboard/(nonDashboard)/customer/[id]/CustomerQRCode.jsx
"use client";

export default function CustomerQRCode({ customerUrl, qrCodeImage, customerCode }) {
  if (!qrCodeImage) return <p className="text-sm text-gray-500">QR code unavailable.</p>;

  return (
    <div>
      <img src={qrCodeImage} alt="QR Code" className="w-40 h-40" />
      <div className="mt-4 flex gap-3">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={async () => {
            await navigator.clipboard.writeText(customerUrl);
            alert("URL copied to clipboard!");
          }}
        >
          Copy URL
        </button>

        <a
          href={qrCodeImage}
          download={`${customerCode || "customer"}-QR.png`}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Download QR
        </a>
      </div>
    </div>
  );
}
