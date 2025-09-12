// src/app/dashboard/(nonDashboard)/customer/[id]/page.jsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import CustomerQRCode from "./CustomerQRCode"; // ✅ Client component

export const dynamicParams = true;

async function getCustomerRaw(id) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      area: true,
      loans: { orderBy: { createdAt: "desc" }, take: 1, include: { repayments: true } },
    },
  });
}

function toViewModel(customer) {
  const latestLoan = customer.loans?.[0] || null;
  return {
    id: customer.id,
    name: customer.customerName || customer.name || "",
    customerCode: customer.customerCode || "",
    mobile: customer.mobile || customer.phone || "",
    address: customer.address || "",
    area: customer.area?.areaName || null,
    loanAmount: Number(latestLoan?.amount || 0),
    totalPaid: (latestLoan?.repayments || []).reduce((sum, r) => sum + Number(r.amount || 0), 0),
  };
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://1smps9sr-3000.inc1.devtunnels.ms";
}

async function generateQRCode(url) {
  try {
    return await QRCode.toDataURL(url);
  } catch {
    return null;
  }
}

export default async function ViewCustomerPage({ params }) {
  const raw = await getCustomerRaw(params.id);
  const customer = toViewModel(raw);
  if (!customer) notFound();

  const customerUrl = `${getBaseUrl()}/dashboard/customer/${customer.id}`;
  const qrCodeImage = await generateQRCode(customerUrl);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Customer Details</h2>

      <div className="space-y-2 mb-6">
        <p><strong>Name:</strong> {customer.name || "N/A"}</p>
        <p><strong>Code:</strong> {customer.customerCode || "N/A"}</p>
        <p><strong>Mobile:</strong> {customer.mobile || "N/A"}</p>
        <p><strong>Address:</strong> {customer.address || "N/A"}</p>
        <p><strong>Area:</strong> {customer.area || "N/A"}</p>
        <p><strong>Loan:</strong> ₹{customer.loanAmount.toLocaleString()}</p>
        <p><strong>Paid:</strong> ₹{customer.totalPaid.toLocaleString()}</p>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Customer QR Code</h3>

        {/* ✅ Move interactive buttons to client component */}
        <CustomerQRCode
          customerUrl={customerUrl}
          qrCodeImage={qrCodeImage}
          customerCode={customer.customerCode}
        />
      </div>
    </div>
  );
}
