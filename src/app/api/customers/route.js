// src/app/api/customers/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */
async function saveFile(file, prefix) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${prefix}-${Date.now()}-${file.name}`;
  const blob = await put(filename, buffer, {
    access: "public",
  });
  return blob.url;
}

async function saveQRCode(data, filenamePrefix) {
  const qrBuffer = await QRCode.toBuffer(data);
  const filename = `${filenamePrefix}-${Date.now()}.png`;
  const blob = await put(filename, qrBuffer, {
    access: "public",
  });
  return blob.url;
}

/* ------------------------------------------------------------------
   GET – return **all** fields needed by the UI
------------------------------------------------------------------ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary");
    const areaId = searchParams.get("areaId");
    const min = searchParams.get("min");
    const max = searchParams.get("max");

    /* ---- SUMMARY ---- */
    if (summary) {
      const total = await prisma.customer.count();
      return NextResponse.json({ total }, { status: 200 });
    }

    /* ---- OPTIONAL loan filter ---- */
    const loanFilter =
      min || max
        ? {
            some: {
              amount: {
                gte: min ? parseFloat(min) : undefined,
                lte: max ? parseFloat(max) : undefined,
              },
            },
          }
        : undefined;

    /* ---- MAIN QUERY ---- */
    const customers = await prisma.customer.findMany({
      where: {
        ...(areaId ? { areaId: parseInt(areaId, 10) } : {}),
        ...(loanFilter ? { loans: loanFilter } : {}),
      },
      select: {
        id: true,
        customerCode: true,
        customerName: true,
        spouseName: true,
        parentName: true,
        mobile: true,
        dob: true,
        aadhar: true,
        gender: true,
        address: true,
        guarantorName: true,
        guarantorAadhar: true,
        areaId: true,
        photoUrl: true,
        aadharDocumentUrl: true,
        incomeProofUrl: true,
        residenceProofUrl: true,
        qrUrl: true,
        createdAt: true,
        // Latest loan
        loans: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            amount: true,
            loanDate: true,
            tenure: true,
            repayments: {
              select: { amount: true, repaymentDate: true },
            },
          },
        },
        // Area info
        area: {
          select: { areaName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    /* ---- FORMAT for UI ---- */
    const formatted = customers.map((c) => {
      const latestLoan = c.loans?.[0] ?? null;

      const loanAmount = latestLoan?.amount
        ? Number(latestLoan.amount)
        : 0;

      // totalPaid = sum of repayments
      const totalPaid = (latestLoan?.repayments ?? []).reduce(
        (sum, r) => sum + (Number(r.amount) || 0),
        0
      );

      const pendingAmount = Math.max(loanAmount - totalPaid, 0);

      // status: Active if pending > 0, Closed if fully paid, N/A otherwise
      let status = "N/A";
      if (loanAmount > 0) {
        status = pendingAmount > 0 ? "Active" : "Closed";
      }

      return {
        // Basic
        id: c.id,
        customerCode: c.customerCode,
        name: c.customerName,
        spouseName: c.spouseName,
        parentName: c.parentName,
        mobile: c.mobile,
        dob: c.dob ? new Date(c.dob).toISOString() : null,
        aadhar: c.aadhar,
        gender: c.gender,
        address: c.address,
        guarantorName: c.guarantorName,
        guarantorAadhar: c.guarantorAadhar,
        areaId: c.areaId,
        area: c.area?.areaName ?? null,
        createdAt: c.createdAt,

        // Docs
        photoUrl: c.photoUrl,
        aadharDocumentUrl: c.aadharDocumentUrl,
        incomeProofUrl: c.incomeProofUrl,
        residenceProofUrl: c.residenceProofUrl,
        qrUrl: c.qrUrl,

        // Loan related
        loanAmount,
        pendingAmount,
        status,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error("❌ GET /api/customers error:", err);
    return NextResponse.json(
      {
        message: "Failed to fetch customers",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------
   POST – unchanged (handles upload + QR)
------------------------------------------------------------------ */
export async function POST(req) {
  try {
    const formData = await req.formData();

    const customerCode = formData.get("customerCode");
    const customerName = formData.get("customerName");
    const spouseName = formData.get("spouseName");
    const parentName = formData.get("parentName");
    const mobile = formData.get("mobile");
    const dob = formData.get("dob");
    const aadhar = formData.get("aadhar");
    const gender = formData.get("gender");
    const address = formData.get("address");
    const guarantorName = formData.get("guarantorName");
    const guarantorAadhar = formData.get("guarantorAadhar");
    const areaId = formData.get("areaId");

    // Files
    const photo = formData.get("photo");
    const aadharDoc = formData.get("aadharDocument");
    const incomeProof = formData.get("incomeProof");
    const residenceProof = formData.get("residenceProof");

    let photoUrl = photo ? await saveFile(photo, "photo") : null;
    let aadharDocumentUrl = aadharDoc
      ? await saveFile(aadharDoc, "aadhar")
      : null;
    let incomeProofUrl = incomeProof
      ? await saveFile(incomeProof, "income")
      : null;
    let residenceProofUrl = residenceProof
      ? await saveFile(residenceProof, "residence")
      : null;

    // QR code
    const qrUrl = await saveQRCode(customerCode, "customer-qr");

    const newCustomer = await prisma.customer.create({
      data: {
        customerCode,
        customerName,
        spouseName,
        parentName,
        mobile,
        dob: dob ? new Date(dob) : null,
        aadhar,
        gender,
        address,
        guarantorName,
        guarantorAadhar,
        areaId: parseInt(areaId, 10),
        photoUrl,
        aadharDocumentUrl,
        incomeProofUrl,
        residenceProofUrl,
        qrUrl,
      },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (err) {
    console.error("❌ POST /api/customers error:", err);
    return NextResponse.json(
      { message: "Failed to create customer", details: err?.message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------
   PUT – update customer
------------------------------------------------------------------ */
export async function PUT(req) {
  try {
    const data = await req.json();
    const customerId = data.id; // keep as string if UUID

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data,
    });

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (err) {
    console.error("❌ PUT /api/customers error:", err);
    return NextResponse.json(
      { message: "Failed to update customer", details: err?.message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------
   DELETE – remove customer
------------------------------------------------------------------ */
export async function DELETE(req) {
  try {
    const data = await req.json();
    const customerId = data.id; // keep as string if UUID

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("❌ DELETE /api/customers error:", err);
    return NextResponse.json(
      { message: "Failed to delete customer", details: err?.message },
      { status: 500 }
    );
  }
}
