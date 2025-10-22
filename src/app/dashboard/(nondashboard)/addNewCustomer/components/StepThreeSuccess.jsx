"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  CheckCircle2,
  QrCode,
  Download,
  PlusCircle,
  FileText,
  Loader2,
} from "lucide-react";

const StepThreeSuccess = ({ setStep, customer }) => {
  const [qrWithIdUrl, setQrWithIdUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (customer?.customerCode) {
      const generateQRWithId = async () => {
        try {
          const customerUrl = `${window.location.origin}/customer/${customer.customerCode}`;
          const qrUrl = await QRCode.toDataURL(customerUrl);

          // Draw QR with customer code below
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const qrImg = new Image();
          qrImg.src = qrUrl;
          qrImg.onload = () => {
            const qrSize = 200;
            const textHeight = 30;
            canvas.width = qrSize;
            canvas.height = qrSize + textHeight;

            ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);
            ctx.font = "16px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              `${customer.customerCode}`,
              qrSize / 2,
              qrSize + textHeight / 2
            );

            setQrWithIdUrl(canvas.toDataURL("image/png"));
            // Dispatch event so other components (like AllCustomerTable) can pick up the QR
            try {
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("customer:created", {
                    detail: {
                      customer,
                      qr: canvas.toDataURL("image/png"),
                    },
                  })
                );
              }
            } catch (err) {
              console.error("Failed to dispatch customer:created event", err);
            }
          };
        } catch (err) {
          console.error("Failed to generate QR Code with ID:", err);
        }
      };
      generateQRWithId();
    }
  }, [customer]);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);

    if (!customer?.customerCode) {
      alert("Customer data is incomplete. Cannot generate PDF.");
      setIsGenerating(false);
      return;
    }

    let finalQrDataUrl = qrWithIdUrl;
    if (!finalQrDataUrl) {
      try {
        const customerUrl = `${window.location.origin}/customer/${customer.customerCode}`;
        finalQrDataUrl = await QRCode.toDataURL(customerUrl);
      } catch (err) {
        console.error("Failed to generate QR Code for PDF:", err);
        setIsGenerating(false);
        return;
      }
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 20, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const fields = [
      ["Customer Code", customer?.customerCode || "N/A"],
      ["Customer Name", customer?.customerName || "N/A"],
      ["Mobile", customer?.mobile || "N/A"],
      [
        "DOB",
        customer?.dob ? new Date(customer.dob).toLocaleDateString() : "N/A",
      ],
      ["Gender", customer?.gender || "N/A"],
      ["Parent Name", customer?.parentName || "N/A"],
      ["Spouse Name", customer?.spouseName || "N/A"],
      ["Guarantor Name", customer?.guarantorName || "N/A"],
      ["Guarantor Aadhar", customer?.guarantorAadhar || "N/A"],
      ["Aadhar", customer?.aadhar || "N/A"],
      ["Area", customer?.areaName || "N/A"],
      ["Address", customer?.address || "N/A"],
      [
        "Created At",
        customer?.createdAt
          ? new Date(customer.createdAt).toLocaleString()
          : "N/A",
      ],
    ];

    let y = 35;
    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 8;
    });

    if (finalQrDataUrl) {
      doc.addImage(finalQrDataUrl, "PNG", 150, 20, 40, 45);
    }

    doc.save(`Customer_${customer.customerCode}.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="text-center space-y-6">
      {/* Success Header */}
      <div className="flex flex-col items-center gap-2">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h3 className="text-2xl font-bold text-green-600">Success!</h3>
        <p className="text-gray-700">Customer form submitted successfully.</p>
      </div>

      {/* QR Section */}
      {qrWithIdUrl && (
        <div className="my-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-gray-600" />
            <strong>Customer QR Code</strong>
          </div>
          <img
            src={qrWithIdUrl}
            alt="Customer QR"
            width={200}
            height={230}
            className="mx-auto border rounded bg-white shadow"
          />
          <a
            href={qrWithIdUrl}
            download={`QRCode_${customer?.customerCode || "customer"}.png`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" /> Download QR Code
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center flex-wrap gap-4">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          <PlusCircle className="h-4 w-4" /> Add Another
        </button>

        <Link href="/dashboard/newloanform">
          <button className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700 transition">
            <FileText className="h-4 w-4" /> Loan New
          </button>
        </Link>

        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-6 py-2 rounded text-white shadow transition ${
            isGenerating
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Download Details PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepThreeSuccess;
