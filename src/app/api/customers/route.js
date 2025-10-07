// src/app/api/customers/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const qrDir = path.join(process.cwd(), "public", "qrcodes");

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {}
}

async function saveFile(file, prefix) {
  if (!file || typeof file === "string") return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = String(file.name || "").split(".").pop() || "bin";
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);
  return `/uploads/${filename}`;
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

    const customers = await prisma.customer.findMany({
      where: {
        ...(areaId ? { areaId } : {}),
        loans: {
          some: {
            amount: {
              gte: min ? parseFloat(min) : undefined,
              lte: max ? parseFloat(max) : undefined,
            },
          },
        },
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
        const val = typeof r.amount === "number" ? r.amount : Number(r.amount || 0);
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
      { message: "Failed to fetch customers", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

// ✅ POST create customer (all fields optional)
export async function POST(req) {
  await ensureDir(uploadDir);
  await ensureDir(qrDir);

  try {
    const formData = await req.formData();
    const customer = Object.fromEntries(formData.entries());

    const photo = formData.get("photo");
    const aadharDocument = formData.get("aadharDocument");
    const incomeProof = formData.get("incomeProof");
    const residenceProof = formData.get("residenceProof");

    const photoUrl = await saveFile(photo, "photo");
    const aadharDocumentUrl = await saveFile(aadharDocument, "aadhar");
    const incomeProofUrl = await saveFile(incomeProof, "income");
    const residenceProofUrl = await saveFile(residenceProof, "residence");

    const dobDate = customer.dob ? new Date(customer.dob) : null;
    const dob = dobDate && !isNaN(dobDate.getTime()) ? dobDate : null;

    // ✅ Create customer with all optional fields
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
        areaId: customer.area || null, // optional
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

    // Generate QR if customerCode exists
    let qrUrl = null;
    if (newCustomer.customerCode) {
      const filename = `${newCustomer.customerCode}.png`;
      const qrPath = path.join(qrDir, filename);
      await QRCode.toFile(qrPath, newCustomer.customerCode);
      qrUrl = `/qrcodes/${filename}`;
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

// ✅ PUT update customer (all fields optional)
export async function PUT(req) {
  await ensureDir(uploadDir);
  await ensureDir(qrDir);

  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    if (!data.id) {
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    const customerId = parseInt(data.id, 10);

    const photo = formData.get("photo");
    const aadharDocument = formData.get("aadharDocument");
    const incomeProof = formData.get("incomeProof");
    const residenceProof = formData.get("residenceProof");

    const updateData = {
      customerName: data.customerName || null,
      spouseName: data.spouseName || null,
      parentName: data.parentName || null,
      mobile: data.mobile || null,
      dob: data.dob ? new Date(data.dob) : null,
      aadhar: data.aadhar || null,
      gender: data.gender || null,
      address: data.address || null,
      guarantorName: data.guarantorName || null,
      guarantorAadhar: data.guarantorAadhar || null,
      areaId: data.area || null,
      customerCode: data.customerCode || null,
    };

    if (photo && typeof photo !== "string") updateData.photoUrl = await saveFile(photo, "photo");
    if (aadharDocument && typeof aadharDocument !== "string") updateData.aadharDocumentUrl = await saveFile(aadharDocument, "aadhar");
    if (incomeProof && typeof incomeProof !== "string") updateData.incomeProofUrl = await saveFile(incomeProof, "income");
    if (residenceProof && typeof residenceProof !== "string") updateData.residenceProofUrl = await saveFile(residenceProof, "residence");

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    // Regenerate QR if customerCode changed
    if (data.customerCode) {
      const filename = `${data.customerCode}.png`;
      const qrPath = path.join(qrDir, filename);
      await QRCode.toFile(qrPath, data.customerCode);

      const qrUrl = `/qrcodes/${filename}`;
      await prisma.customer.update({
        where: { id: customerId },
        data: { qrUrl },
      });

      updatedCustomer.qrUrl = qrUrl;
    }

    return NextResponse.json({ success: true, customer: updatedCustomer }, { status: 200 });
  } catch (error) {
    console.error("❌ PUT /api/customers error:", error);
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
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    await prisma.customer.delete({ where: { id: parseInt(id, 10) } });

    return NextResponse.json({ success: true, message: "Customer deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ DELETE /api/customers error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
