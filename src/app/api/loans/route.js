import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { put, del } from '@vercel/blob';

// Configuration
const USE_VERCEL_BLOB = process.env.USE_VERCEL_BLOB === 'true';
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Function to calculate interest amount
const calculateInterestAmount = (loanAmount, rate, tenure) => {
  return (loanAmount * rate * tenure) / 100;
};

// Enhanced file handling with Vercel Blob support
const saveFile = async (file) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  // Sanitize filename
  const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const fileName = `${Date.now()}-${originalName}`;

  if (USE_VERCEL_BLOB && BLOB_READ_WRITE_TOKEN) {
    // Upload to Vercel Blob
    const bytes = await file.arrayBuffer();
    const blob = await put(fileName, bytes, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  } else {
    // Local file system storage (fallback)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(process.cwd(), "public/uploads", fileName);
    await writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  }
};

// Delete old file if exists (supports both local and Vercel Blob)
const deleteOldFile = async (fileUrl) => {
  if (!fileUrl) return;
  
  try {
    if (fileUrl.includes('blob.vercel-storage.com')) {
      // Delete from Vercel Blob
      await del(fileUrl, {
        token: BLOB_READ_WRITE_TOKEN,
      });
    } else {
      // Delete from local file system
      const fileName = fileUrl.split('/').pop();
      const filePath = path.join(process.cwd(), "public/uploads", fileName);
      await unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting old file:', error);
    // Don't throw error for file deletion failures
  }
};

// 🔹 GET handler (summary OR full list)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary");
    const customerId = searchParams.get("customerId");
    const debugId = searchParams.get("debugId");

    // Add debug endpoint to check loan status
    if (debugId) {
      console.log(`🔍 Debug request for loan ID: ${debugId}`);
      const loan = await prisma.loan.findUnique({
        where: { id: debugId },
        include: {
          repayments: {
            select: {
              id: true,
              amount: true,
              repaymentDate: true,
            }
          },
          customer: {
            select: {
              customerName: true,
              customerCode: true,
            }
          }
        },
      });
      
      if (!loan) {
        return NextResponse.json({
          exists: false,
          message: "Loan not found"
        }, { status: 404 });
      }

      return NextResponse.json({
        exists: true,
        loan: {
          id: loan.id,
          customer: loan.customer,
          amount: loan.amount,
          pendingAmount: loan.pendingAmount,
          repaymentCount: loan.repayments?.length,
          repayments: loan.repayments,
          canBeDeleted: loan.repayments?.length === 0 && loan.pendingAmount === 0
        }
      });
    }

    if (summary) {
      const active = await prisma.loan.count({
        where: { pendingAmount: { gt: 0 } },
      });

      return NextResponse.json({ active }, { status: 200 });
    }

    const loans = await prisma.loan.findMany({
      where: customerId ? { customerId } : {},
      include: {
        customer: {
          // Do not select `mobile` directly — some rows in the DB contain NULL which
          // can cause Prisma to throw a conversion error if the schema expects a
          // non-nullable string. We'll omit it here and coalesce safely when
          // formatting the response below.
          select: {
            id: true,
            customerCode: true,
            customerName: true,
            aadhar: true,
            photoUrl: true,
          },
        },
        repayments: {
          select: {
            id: true,
            amount: true,
            repaymentDate: true,
            createdAt: true,
          },
          orderBy: { repaymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedLoans = loans.map((loan) => {
      const totalPaid = loan.repayments.reduce((sum, repayment) => {
        return sum + Number(repayment.amount || 0);
      }, 0);

      const pendingAmount = Math.max(Number(loan.amount || 0) - totalPaid, 0);

      return {
        id: loan.id,
        customerId: loan.customerId,
        customer: {
          id: loan.customer.id,
          name: loan.customer.customerName,
          customerCode: loan.customer.customerCode,
          aadhar: loan.customer.aadhar,
          // Coalesce mobile to empty string if missing/null to avoid leaking nulls.
          mobile: (loan.customer && loan.customer.mobile) ? loan.customer.mobile : "",
          photoUrl: loan.customer.photoUrl,
        },
        amount: Number(loan.amount),
        loanAmount: Number(loan.amount),
        pendingAmount,
        totalPaid,
        rate: loan.rate || 0,
        loanDate: loan.loanDate,
        tenure: loan.tenure,
        status: pendingAmount > 0 ? "ACTIVE" : "CLOSED",
        repayments: loan.repayments,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
        documentUrl: loan.documentUrl,
        interestAmount: loan.interestAmount || 0,
        area: loan.area,
        // Add storage info for debugging
        storageType: loan.documentUrl?.includes('blob.vercel-storage.com') ? 'vercel-blob' : 'local',
      };
    });

    return NextResponse.json(formattedLoans, { status: 200 });
  } catch (error) {
    console.error("Loan fetch error:", error);
    
    // Handle Prisma database connection errors
    if (error.code === 'P5010') {
      return NextResponse.json(
        { error: "Database connection failed. Please check if the database server is running." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}

// 🔹 POST handler (for creating a loan)
export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type");
    let data = {};

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      data = Object.fromEntries(formData.entries());
      
      if (formData.get("file")) {
        data.documentUrl = await saveFile(formData.get("file"));
      }
    } else {
      data = await req.json();
    }

    // Validate required fields
    const requiredFields = ['customerId', 'amount', 'rate', 'tenure', 'loanDate'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const amount = Number(data.amount);
    const rate = Number(data.rate);
    const tenure = Number(data.tenure);
    const loanDate = new Date(data.loanDate);

    // Validate numeric values
    if ([amount, rate, tenure].some(val => isNaN(val) || val <= 0)) {
      return NextResponse.json(
        { error: "Amount, rate, and tenure must be positive numbers" },
        { status: 400 }
      );
    }

    if (isNaN(loanDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid loan date" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for existing active loan
    const existingActiveLoan = await prisma.loan.findFirst({
      where: {
        customerId: data.customerId,
        pendingAmount: { gt: 0 },
      },
    });

    if (existingActiveLoan) {
      return NextResponse.json(
        { error: "Customer already has an active loan" },
        { status: 409 }
      );
    }

    const interestAmount = calculateInterestAmount(amount, rate, tenure);
    const documentUrl = data.documentUrl || null;

    const loan = await prisma.loan.create({
      data: {
        area: data.area || null,
        customerId: data.customerId,
        amount: amount,
        rate,
        tenure,
        loanDate,
        loanAmount: amount,
        pendingAmount: amount,
        interestAmount,
        documentUrl,
      },
      include: {
        customer: {
          // Avoid selecting `mobile` directly (can be NULL in DB). We'll coalesce when formatting.
          select: {
            id: true,
            customerCode: true,
            customerName: true,
            aadhar: true,
            photoUrl: true,
          },
        },
        repayments: {
          select: {
            id: true,
            amount: true,
            repaymentDate: true,
            createdAt: true,
          },
          orderBy: { repaymentDate: "desc" },
        },
      },
    });

    const totalPaid = loan.repayments.reduce((sum, repayment) => {
      return sum + Number(repayment.amount || 0);
    }, 0);

    const formattedLoan = {
      id: loan.id,
      customerId: loan.customerId,
      customer: {
        id: loan.customer.id,
        name: loan.customer.customerName,
        customerCode: loan.customer.customerCode,
        aadhar: loan.customer.aadhar,
        mobile: (loan.customer && loan.customer.mobile) ? loan.customer.mobile : "",
        photoUrl: loan.customer.photoUrl,
      },
      amount: Number(loan.amount),
      loanAmount: Number(loan.amount),
      pendingAmount: Number(loan.pendingAmount),
      totalPaid,
      rate: loan.rate || 0,
      loanDate: loan.loanDate,
      tenure: loan.tenure,
      status: loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED",
      repayments: loan.repayments,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      documentUrl: loan.documentUrl,
      interestAmount: loan.interestAmount || 0,
      area: loan.area,
      storageType: loan.documentUrl?.includes('blob.vercel-storage.com') ? 'vercel-blob' : 'local',
    };

    return NextResponse.json({ success: true, loan: formattedLoan }, { status: 201 });
  } catch (error) {
    console.error("Loan creation error:", error);
    
    // Handle Prisma known errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A loan with similar unique constraints already exists" },
        { status: 409 }
      );
    }
    
    if (error.code === 'P5010') {
      return NextResponse.json(
        { error: "Database connection failed. Cannot create loan." },
        { status: 503 }
      );
    }
    
    if (error.message.includes('Invalid file type') || error.message.includes('File size too large')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Handle Vercel Blob errors
    if (error.message.includes('Vercel Blob')) {
      return NextResponse.json(
        { error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create loan" },
      { status: 500 }
    );
  }
}

// 🔹 PUT handler (for updating a loan)
export async function PUT(req) {
  try {
    const contentType = req.headers.get("content-type");
    let updateData = {};

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const loanId = formData.get("loanId");

      if (!loanId) {
        return NextResponse.json({ error: "Loan ID is required" }, { status: 400 });
      }

      const existingLoan = await prisma.loan.findUnique({
        where: { id: loanId },
      });

      if (!existingLoan) {
        return NextResponse.json({ error: "Loan not found" }, { status: 404 });
      }

      if (file) {
        // Delete old file if exists
        if (existingLoan.documentUrl) {
          await deleteOldFile(existingLoan.documentUrl);
        }
        
        updateData.documentUrl = await saveFile(file);
      }

      const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: updateData,
        include: {
          customer: {
            // Avoid selecting `mobile` directly here for the same reason as GET/POST
            select: {
              id: true,
              customerCode: true,
              customerName: true,
              aadhar: true,
              photoUrl: true,
            },
          },
          repayments: {
            select: {
              id: true,
              amount: true,
              repaymentDate: true,
              createdAt: true,
            },
            orderBy: { repaymentDate: "desc" },
          },
        },
      });

      const totalPaid = updatedLoan.repayments.reduce((sum, repayment) => {
        return sum + Number(repayment.amount || 0);
      }, 0);

      const formattedLoan = {
        id: updatedLoan.id,
        customerId: updatedLoan.customerId,
        customer: {
          id: updatedLoan.customer.id,
          name: updatedLoan.customer.customerName,
          customerCode: updatedLoan.customer.customerCode,
          aadhar: updatedLoan.customer.aadhar,
          mobile: (updatedLoan.customer && updatedLoan.customer.mobile) ? updatedLoan.customer.mobile : "",
          photoUrl: updatedLoan.customer.photoUrl,
        },
        amount: Number(updatedLoan.amount),
        loanAmount: Number(updatedLoan.amount),
        pendingAmount: Number(updatedLoan.pendingAmount),
        totalPaid,
        rate: updatedLoan.rate || 0,
        loanDate: updatedLoan.loanDate,
        tenure: updatedLoan.tenure,
        status: updatedLoan.pendingAmount > 0 ? "ACTIVE" : "CLOSED",
        repayments: updatedLoan.repayments,
        createdAt: updatedLoan.createdAt,
        updatedAt: updatedLoan.updatedAt,
        documentUrl: updatedLoan.documentUrl,
        interestAmount: updatedLoan.interestAmount || 0,
        area: updatedLoan.area,
        storageType: updatedLoan.documentUrl?.includes('blob.vercel-storage.com') ? 'vercel-blob' : 'local',
      };

      return NextResponse.json({ success: true, loan: formattedLoan }, { status: 200 });
    } else {
      const data = await req.json();

      if (!data.id) {
        return NextResponse.json({ error: "Loan ID is required" }, { status: 400 });
      }

      const existingLoan = await prisma.loan.findUnique({
        where: { id: data.id },
      });

      if (!existingLoan) {
        return NextResponse.json({ error: "Loan not found" }, { status: 404 });
      }

      // Validate numeric values if provided
      if (data.amount !== undefined && (isNaN(Number(data.amount)) || Number(data.amount) <= 0)) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      if (data.rate !== undefined && (isNaN(Number(data.rate)) || Number(data.rate) <= 0)) {
        return NextResponse.json({ error: "Rate must be a positive number" }, { status: 400 });
      }
      if (data.tenure !== undefined && (isNaN(Number(data.tenure)) || Number(data.tenure) <= 0)) {
        return NextResponse.json({ error: "Tenure must be a positive number" }, { status: 400 });
      }

      // Prepare update data
      const updateData = {};
      if (data.amount !== undefined) updateData.amount = Number(data.amount);
      if (data.rate !== undefined) updateData.rate = Number(data.rate);
      if (data.tenure !== undefined) updateData.tenure = Number(data.tenure);
      if (data.loanDate !== undefined) {
        const loanDate = new Date(data.loanDate);
        if (isNaN(loanDate.getTime())) {
          return NextResponse.json({ error: "Invalid loan date" }, { status: 400 });
        }
        updateData.loanDate = loanDate;
      }
      if (data.area !== undefined) updateData.area = data.area;

      // Recalculate interest if relevant fields change
      if (data.amount !== undefined || data.rate !== undefined || data.tenure !== undefined) {
        const loanAmount = data.amount !== undefined ? Number(data.amount) : existingLoan.amount;
        const rate = data.rate !== undefined ? Number(data.rate) : existingLoan.rate;
        const tenure = data.tenure !== undefined ? Number(data.tenure) : existingLoan.tenure;
        updateData.interestAmount = calculateInterestAmount(loanAmount, rate, tenure);
        updateData.loanAmount = loanAmount;
      }

      const updatedLoan = await prisma.loan.update({
        where: { id: data.id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              customerName: true,
              aadhar: true,
              mobile: true,
              photoUrl: true,
            },
          },
          repayments: {
            select: {
              id: true,
              amount: true,
              repaymentDate: true,
              createdAt: true,
            },
            orderBy: { repaymentDate: "desc" },
          },
        },
      });

      const totalPaid = updatedLoan.repayments.reduce((sum, repayment) => {
        return sum + Number(repayment.amount || 0);
      }, 0);

      const formattedLoan = {
        id: updatedLoan.id,
        customerId: updatedLoan.customerId,
        customer: {
          id: updatedLoan.customer.id,
          name: updatedLoan.customer.customerName,
          customerCode: updatedLoan.customer.customerCode,
          aadhar: updatedLoan.customer.aadhar,
          mobile: updatedLoan.customer.mobile,
          photoUrl: updatedLoan.customer.photoUrl,
        },
        amount: Number(updatedLoan.amount),
        loanAmount: Number(updatedLoan.amount),
        pendingAmount: Number(updatedLoan.pendingAmount),
        totalPaid,
        rate: updatedLoan.rate || 0,
        loanDate: updatedLoan.loanDate,
        tenure: updatedLoan.tenure,
        status: updatedLoan.pendingAmount > 0 ? "ACTIVE" : "CLOSED",
        repayments: updatedLoan.repayments,
        createdAt: updatedLoan.createdAt,
        updatedAt: updatedLoan.updatedAt,
        documentUrl: updatedLoan.documentUrl,
        interestAmount: updatedLoan.interestAmount || 0,
        area: updatedLoan.area,
        storageType: updatedLoan.documentUrl?.includes('blob.vercel-storage.com') ? 'vercel-blob' : 'local',
      };

      return NextResponse.json({ success: true, loan: formattedLoan }, { status: 200 });
    }
  } catch (error) {
    console.error("Loan update error:", error);
    
    // Handle Prisma known errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Loan not found or cannot be updated" },
        { status: 404 }
      );
    }
    
    if (error.code === 'P5010') {
      return NextResponse.json(
        { error: "Database connection failed. Cannot update loan." },
        { status: 503 }
      );
    }
    
    if (error.message.includes('Invalid file type') || error.message.includes('File size too large')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Handle Vercel Blob errors
    if (error.message.includes('Vercel Blob')) {
      return NextResponse.json(
        { error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update loan" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE handler (for deleting a loan)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log(`🔍 DELETE request for loan ID: ${id}`);

    if (!id) {
      console.log("❌ No loan ID provided");
      return NextResponse.json(
        { error: "Loan ID is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log("❌ Invalid UUID format:", id);
      return NextResponse.json(
        { error: "Invalid loan ID format" },
        { status: 400 }
      );
    }

    console.log(`📊 Searching for loan with ID: ${id}`);

    const existingLoan = await prisma.loan.findUnique({
      where: { id },
      include: {
        repayments: {
          select: {
            id: true,
            amount: true,
            repaymentDate: true,
          },
        },
      },
    });

    if (!existingLoan) {
      console.log("❌ Loan not found in database");
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    console.log("✅ Loan found:", {
      id: existingLoan.id,
      amount: existingLoan.amount,
      pendingAmount: existingLoan.pendingAmount,
      status: existingLoan.status,
      repaymentCount: existingLoan.repayments?.length,
      documentUrl: existingLoan.documentUrl,
    });

    // ✅ Delete ALL repayment records (both paid and unpaid)
    if (existingLoan.repayments.length > 0) {
      console.log("🧹 Deleting all repayment records...");
      await prisma.repayment.deleteMany({ where: { loanId: id } });
    }

    // ✅ Delete associated document file if exists
    if (existingLoan.documentUrl) {
      console.log("🗑️ Deleting associated document:", existingLoan.documentUrl);
      await deleteOldFile(existingLoan.documentUrl);
    }

    // ✅ Delete the loan record
    console.log("🚀 Deleting loan from database...");
    await prisma.loan.delete({ where: { id } });

    console.log("✅ Loan deleted successfully:", id);

    return NextResponse.json(
      {
        success: true,
        message: "Loan deleted successfully",
        deletedLoanId: id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 Loan deletion error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Loan not found or already deleted" },
        { status: 404 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete loan due to existing related records" },
        { status: 400 }
      );
    }

    if (error.code === "P2014") {
      return NextResponse.json(
        { error: "Cannot delete loan due to relationship constraints" },
        { status: 400 }
      );
    }

    if (error.code === "P5010") {
      return NextResponse.json(
        { error: "Database connection failed. Cannot delete loan." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete loan: " + error.message },
      { status: 500 }
    );
  }
}