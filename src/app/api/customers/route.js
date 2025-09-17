// src/app/api/customers/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { put } from "@vercel/blob";

// ✅ Force Node runtime so env vars work
export const runtime = "nodejs";

console.log(
  "BLOB_READ_WRITE_TOKEN exists:",
  !!process.env.BLOB_READ_WRITE_TOKEN
);

// 🔹 Helper to upload a file to Vercel Blob
async function saveFile(file, prefix) {
  if (!file || typeof file === "string") return null;

  const ext =
    String(file.name || "")
      .split(".")
      .pop() || "bin";
  const filename = `${prefix}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

// 🔹 Helper to generate QR and upload to Blob
async function saveQRCode(data, filenamePrefix) {
  const buffer = await QRCode.toBuffer(data, { type: "png" });
  const filename = `${filenamePrefix}-${Date.now()}.png`;

  const blob = await put(filename, buffer, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

// ✅ GET customers (with optional filters)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary");
    const areaId = searchParams.get("areaId");
    const min = searchParams.get("min");
    const max = searchParams.get("max");

    if (summary) {
      const total = await prisma.customer.count();
      return NextResponse.json({ total }, { status: 200 });
    }

    // Only apply loan filter if min or max is provided
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

    const customers = await prisma.customer.findMany({
      where: {
        ...(areaId ? { areaId: parseInt(areaId, 10) } : {}),
        ...(loanFilter ? { loans: loanFilter } : {}),
      },
      include: {
        area: true,
        loans: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            repayments: { select: { amount: true, repaymentDate: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Fetched customers raw:", customers);

    const formatted = customers.map((customer) => {
      const latestLoan = customer.loans?.[0] || null;
      let endDate = null;

      if (latestLoan?.loanDate && latestLoan?.tenure != null) {
        const loanDate = new Date(latestLoan.loanDate);
        const tenureMonths = Number(latestLoan.tenure);
        if (!isNaN(loanDate.getTime()) && !isNaN(tenureMonths)) {
          const end = new Date(loanDate);
          end.setMonth(end.getMonth() + tenureMonths);
          endDate = end;
        }
      }

      const loanAmount = Number(latestLoan?.amount ?? 0);
      const totalPaid = (latestLoan?.repayments || []).reduce((acc, r) => {
        const val =
          typeof r.amount === "number" ? r.amount : Number(r.amount || 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const pendingAmount = Math.max(loanAmount - totalPaid, 0);

      return {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.customerName,
        aadhar: customer.aadhar,
        photoUrl: customer.photoUrl,
        mobile: customer.mobile,
        address: customer.address || "",
        areaId: customer.area?.id ?? null,
        area: customer.area?.areaName ?? null,
        loanAmount,
        totalPaid,
        pendingAmount,
        endDate,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/customers error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch customers",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

// ✅ POST create customer
export async function POST(req) {
  try {
    const formData = await req.formData();
    const customer = Object.fromEntries(formData.entries());

    const photoUrl = await saveFile(formData.get("photo"), "photo");
    const aadharDocumentUrl = await saveFile(
      formData.get("aadharDocument"),
      "aadhar"
    );
    const incomeProofUrl = await saveFile(
      formData.get("incomeProof"),
      "income"
    );
    const residenceProofUrl = await saveFile(
      formData.get("residenceProof"),
      "residence"
    );

    const dobDate = customer.dob ? new Date(customer.dob) : null;
    const dob = dobDate && !isNaN(dobDate.getTime()) ? dobDate : null;

    if (
      !customer.area ||
      typeof customer.area !== "string" ||
      customer.area.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "area is required and must be a valid string",
        },
        { status: 400 }
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        customerName: customer.customerName,
        spouseName: customer.spouseName || null,
        parentName: customer.parentName || null,
        mobile: customer.mobile,
        dob,
        aadhar: customer.aadhar,
        gender: customer.gender,
        address: customer.address,
        guarantorName: customer.guarantorName || null,
        guarantorAadhar: customer.guarantorAadhar || null,
        customerCode: customer.customerCode || null,
        areaId: customer.area,
        photoUrl,
        aadharDocumentUrl,
        incomeProofUrl,
        residenceProofUrl,
      },
    });

    if (customer.loanAmount && customer.loanDate && customer.tenure) {
      const loanDateObj = new Date(customer.loanDate);
      if (!isNaN(loanDateObj.getTime())) {
        await prisma.loan.create({
          data: {
            customerId: newCustomer.id,
            amount: Number(customer.loanAmount),
            loanDate: loanDateObj,
            tenure: Number(customer.tenure),
          },
        });
      }
    }

    const qrUrl = await saveQRCode(newCustomer.customerCode, "qr");
    await prisma.customer.update({
      where: { id: newCustomer.id },
      data: { qrUrl },
    });

    return NextResponse.json(
      { success: true, customer: { ...newCustomer, qrUrl } },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/customers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}

// ✅ PUT update customer
export async function PUT(req) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const customerId = parseInt(data.id, 10);

    const updateData = {
      customerName: data.customerName,
      spouseName: data.spouseName || null,
      parentName: data.parentName || null,
      mobile: data.mobile,
      dob: data.dob ? new Date(data.dob) : null,
      aadhar: data.aadhar,
      gender: data.gender,
      address: data.address,
      guarantorName: data.guarantorName || null,
      guarantorAadhar: data.guarantorAadhar || null,
      areaId: data.area,
      customerCode: data.customerCode || null,
    };

    const photo = formData.get("photo");
    if (photo && typeof photo !== "string")
      updateData.photoUrl = await saveFile(photo, "photo");

    const aadharDocument = formData.get("aadharDocument");
    if (aadharDocument && typeof aadharDocument !== "string")
      updateData.aadharDocumentUrl = await saveFile(aadharDocument, "aadhar");

    const incomeProof = formData.get("incomeProof");
    if (incomeProof && typeof incomeProof !== "string")
      updateData.incomeProofUrl = await saveFile(incomeProof, "income");

    const residenceProof = formData.get("residenceProof");
    if (residenceProof && typeof residenceProof !== "string")
      updateData.residenceProofUrl = await saveFile(
        residenceProof,
        "residence"
      );

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    if (data.customerCode) {
      const qrUrl = await saveQRCode(data.customerCode, "qr");
      await prisma.customer.update({
        where: { id: customerId },
        data: { qrUrl },
      });
      updatedCustomer.qrUrl = qrUrl;
    }

    return NextResponse.json(
      { success: true, customer: updatedCustomer },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ PUT /api/customers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

// ✅ DELETE customer
// ✅ DELETE customer (improved version)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists first
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Delete customer (Prisma will handle related records based on your schema)
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer deleted successfully",
        deletedId: customerId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ DELETE /api/customers error:", error);

    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete customer",
      },
      { status: 500 }
    );
  }
}
