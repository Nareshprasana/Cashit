// src/app/api/customers/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { put } from "@vercel/blob";

async function saveFile(file, prefix) {
  if (!file || typeof file === "string") return null;

  // 🔧 Check for empty files before processing
  if (file.size === 0) {
    console.log(`Skipping empty ${prefix} file`);
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = String(file.name || "").split(".").pop() || "bin";
  const filename = `${prefix}-${Date.now()}.${ext}`;

  try {
    // 🔧 Check if Blob token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set");
    }

    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentLength: buffer.length,
    });

    return blob.url;
  } catch (error) {
    console.error(`Error uploading ${prefix} file:`, error);
    return null;
  }
}

async function generateQRCode(customerCode) {
  try {
    const qrBuffer = await QRCode.toBuffer(customerCode);
    const filename = `${customerCode}.png`;

    // 🔧 Check if Blob token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set");
    }

    const blob = await put(filename, qrBuffer, {
      access: "public",
      contentLength: qrBuffer.length,
    });

    return blob.url;
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
}

// ✅ GET customers - enhanced with loanDate and tenure
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

    const whereClause = {
      ...(areaId ? { areaId } : {}),
    };

    if (min || max) {
      whereClause.loans = {
        some: {
          amount: {
            ...(min ? { gte: parseFloat(min) } : {}),
            ...(max ? { lte: parseFloat(max) } : {}),
          },
        },
      };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
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

    const formatted = customers.map((customer) => {
      const latestLoan = customer.loans?.[0] || null;

      let endDate = null;
      let loanAmount = 0;
      let totalPaid = 0;
      let pendingAmount = 0;

      if (latestLoan) {
        if (latestLoan?.loanDate && latestLoan?.tenure != null) {
          const loanDate = new Date(latestLoan.loanDate);
          const tenureMonths = Number(latestLoan.tenure);
          if (!isNaN(loanDate.getTime()) && !isNaN(tenureMonths)) {
            const end = new Date(loanDate);
            end.setMonth(end.getMonth() + tenureMonths);
            endDate = end;
          }
        }

        loanAmount = Number(latestLoan?.amount ?? 0);
        totalPaid = (latestLoan?.repayments || []).reduce((acc, r) => {
          const val = typeof r.amount === "number" ? r.amount : Number(r.amount || 0);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        pendingAmount = Math.max(loanAmount - totalPaid, 0);
      }

      return {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.customerName,
        aadhar: customer.aadhar,
        photoUrl: customer.photoUrl,
        mobile: customer.mobile,
        dob: customer.dob,
        gender: customer.gender,
        spouseName: customer.spouseName || "",
        parentName: customer.parentName || "",
        guarantorName: customer.guarantorName || "",
        guarantorAadhar: customer.guarantorAadhar || "",
        address: customer.address || "",
        areaId: customer.area?.id ?? null,
        area: customer.area?.areaName ?? null,
        loanAmount,
        loanDate: latestLoan?.loanDate || null,
        tenure: latestLoan?.tenure || null,
        totalPaid,
        pendingAmount,
        endDate,
        hasLoans: customer.loans.length > 0,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/customers error:", error);
    return NextResponse.json(
      { 
        message: "Failed to fetch customers", 
        details: error?.message ?? String(error) 
      },
      { status: 500 }
    );
  }
}

// ✅ POST create customer with Vercel Blob
export async function POST(req) {
  try {
    const formData = await req.formData();
    const customer = Object.fromEntries(formData.entries());

    const photo = formData.get("photo");
    const aadharDocument = formData.get("aadharDocument");
    const incomeProof = formData.get("incomeProof");
    const residenceProof = formData.get("residenceProof");

    // Upload files to Vercel Blob
    const photoUrl = await saveFile(photo, "photo");
    const aadharDocumentUrl = await saveFile(aadharDocument, "aadhar");
    const incomeProofUrl = await saveFile(incomeProof, "income");
    const residenceProofUrl = await saveFile(residenceProof, "residence");

    const dobDate = customer.dob ? new Date(customer.dob) : null;
    const dob = dobDate && !isNaN(dobDate.getTime()) ? dobDate : null;

    const newCustomer = await prisma.customer.create({
      data: {
        customerName: customer.customerName || null,
        spouseName: customer.spouseName || null,
        parentName: customer.parentName || null,
        mobile: customer.mobile || null,
        dob,
        aadhar: customer.aadhar || null,
        gender: customer.gender || null,
        address: customer.address || null,
        guarantorName: customer.guarantorName || null,
        guarantorAadhar: customer.guarantorAadhar || null,
        customerCode: customer.customerCode || null,
        areaId: customer.area || null,
        photoUrl,
        aadharDocumentUrl,
        incomeProofUrl,
        residenceProofUrl,
      },
    });

    // Optional: create initial loan if provided
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

    // Generate QR code using Vercel Blob
    let qrUrl = null;
    if (newCustomer.customerCode) {
      qrUrl = await generateQRCode(newCustomer.customerCode);
      await prisma.customer.update({
        where: { id: newCustomer.id },
        data: { qrUrl },
      });
    }

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

// ✅ PUT update customer with Vercel Blob - OPTIMIZED MERGED VERSION
export async function PUT(req) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    console.log("📝 Update data received:", data);

    // 🔧 Check if Blob token is available at the start
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN environment variable is not set");
      return NextResponse.json(
        { success: false, error: "Server configuration error: Blob token missing" },
        { status: 500 }
      );
    }

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const customerId = data.id;

    // First, get the existing customer to preserve current document URLs
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: `Customer with ID ${customerId} not found`,
        },
        { status: 404 }
      );
    }

    const documentField = data.documentField;
    const deleteDocument = data.deleteDocument === "true";

    // 🔧 Validate area exists before proceeding
    if (data.area) {
      const areaExists = await prisma.area.findUnique({
        where: { id: data.area },
      });

      if (!areaExists) {
        return NextResponse.json(
          { success: false, error: `Area '${data.area}' does not exist. Please provide a valid area.` },
          { status: 400 }
        );
      }
    }

    const dobDate = data.dob ? new Date(data.dob) : null;
    const dob = dobDate && !isNaN(dobDate.getTime()) ? dobDate : undefined;

    // Start with existing data to preserve ALL document URLs
    const updateData = {
      customerName: data.customerName || existingCustomer.customerName,
      spouseName: data.spouseName || existingCustomer.spouseName,
      parentName: data.parentName || existingCustomer.parentName,
      mobile: data.mobile || existingCustomer.mobile,
      dob: dob !== undefined ? dob : existingCustomer.dob,
      aadhar: data.aadhar || existingCustomer.aadhar,
      gender: data.gender || existingCustomer.gender,
      address: data.address || existingCustomer.address,
      guarantorName: data.guarantorName || existingCustomer.guarantorName,
      guarantorAadhar: data.guarantorAadhar || existingCustomer.guarantorAadhar,
      areaId: data.area || existingCustomer.areaId,
      customerCode: data.customerCode || existingCustomer.customerCode,
      // PRESERVE ALL existing document URLs by default
      photoUrl: existingCustomer.photoUrl,
      aadharDocumentUrl: existingCustomer.aadharDocumentUrl,
      incomeProofUrl: existingCustomer.incomeProofUrl,
      residenceProofUrl: existingCustomer.residenceProofUrl,
      qrUrl: existingCustomer.qrUrl,
    };

    // CASE 1: Handle specific document operations (from Documents tab)
    if (documentField) {
      if (deleteDocument) {
        // Delete specific document
        updateData[documentField] = null;
      } else {
        // Upload/update specific document
        const file = formData.get("file");
        if (file && typeof file !== "string" && file.size > 0) {
          updateData[documentField] = await saveFile(file, documentField);
        }
      }
    }
    // CASE 2: Handle profile update (from Edit Profile form)
    else {
      // Only process files that were actually provided in the form
      const filesToProcess = [];

      // Check which files were actually uploaded
      if (formData.has("photo") && typeof formData.get("photo") !== "string") {
        filesToProcess.push({ field: "photoUrl", file: formData.get("photo") });
      }
      if (
        formData.has("aadharDocument") &&
        typeof formData.get("aadharDocument") !== "string"
      ) {
        filesToProcess.push({
          field: "aadharDocumentUrl",
          file: formData.get("aadharDocument"),
        });
      }
      if (
        formData.has("incomeProof") &&
        typeof formData.get("incomeProof") !== "string"
      ) {
        filesToProcess.push({
          field: "incomeProofUrl",
          file: formData.get("incomeProof"),
        });
      }
      if (
        formData.has("residenceProof") &&
        typeof formData.get("residenceProof") !== "string"
      ) {
        filesToProcess.push({
          field: "residenceProofUrl",
          file: formData.get("residenceProof"),
        });
      }

      // Only upload files that were actually provided
      for (const { field, file } of filesToProcess) {
        if (file && file.size > 0) {
          updateData[field] = await saveFile(file, field);
        }
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    // Regenerate QR code using Vercel Blob if customerCode changed
    if (
      data.customerCode &&
      data.customerCode !== existingCustomer.customerCode
    ) {
      const qrUrl = await generateQRCode(data.customerCode);
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

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Database constraint violation. Please check if the referenced area exists.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

// ✅ DELETE customer
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

    const customerId = id;

    await prisma.customer.delete({ where: { id: customerId } });

    return NextResponse.json(
      { success: true, message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ DELETE /api/customers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}