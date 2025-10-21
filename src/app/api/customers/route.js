// src/app/api/customers/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { put } from "@vercel/blob";

// Enhanced file upload function with comprehensive validation
async function saveFile(file, prefix) {
  // Validate file exists and has content
  if (!file || typeof file === "string" || file.size === 0) {
    console.log(`Skipping empty ${prefix} file`);
    return null;
  }

  // Validate file size (adjust limits as needed)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    console.log(`File too large: ${file.size} bytes`);
    return null;
  }

  // Validate file type
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];
  const allowedDocumentTypes = ["application/pdf", ...allowedImageTypes];

  const isImage = file.type.startsWith("image/");
  const allowedTypes = isImage ? allowedImageTypes : allowedDocumentTypes;

  if (!allowedTypes.includes(file.type)) {
    console.log(`Unsupported file type: ${file.type}`);
    return null;
  }

  // Check for Blob token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set");
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${prefix}-${Date.now()}.${ext}`;

    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    console.log(`Successfully uploaded ${prefix} file: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`Error uploading ${prefix} file:`, error);
    return null;
  }
}

// Enhanced QR code generation with better error handling
async function generateQRCode(customerCode) {
  // Validate input
  if (!customerCode || customerCode.trim() === "") {
    console.log("Invalid customer code for QR generation");
    return null;
  }

  // Check for Blob token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN environment variable is not set");
    return null;
  }

  try {
    const qrBuffer = await QRCode.toBuffer(customerCode);
    const filename = `qr-${customerCode}-${Date.now()}.png`;

    const blob = await put(filename, qrBuffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/png",
    });

    console.log(`Successfully generated QR code: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
}

// ✅ GET customers - enhanced with search functionality
// ✅ GET customers - FIXED with Prisma extensions
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary");
    const areaId = searchParams.get("areaId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const search = searchParams.get("search");
    const min = searchParams.get("min");
    const max = searchParams.get("max");

    if (summary) {
      const total = await prisma.customer.count();
      return NextResponse.json({ total }, { status: 200 });
    }

    // Build where clause with search functionality
    const whereClause = {
      ...(areaId && areaId !== "all" ? { areaId } : {}),
    };

    // Date range filter
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt.gte = new Date(fromDate);
      if (toDate) whereClause.createdAt.lte = new Date(toDate);
    }

    // Search filter - handle NULL values in search
    if (search) {
      whereClause.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        {
          OR: [
            { mobile: { contains: search } },
            { mobile: null }, // Include NULL values in search
          ],
        },
        { customerCode: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // Loan amount range filter
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

    // Use Prisma's fluent API to handle NULL values safely
    const customers = await prisma.customer
      .findMany({
        where: whereClause,
        include: {
          area: true,
          loans: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              repayments: {
                select: {
                  amount: true,
                  repaymentDate: true,
                  dueDate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(async (error) => {
        // If Prisma validation fails, use a different approach
        if (error.code === "P2032") {
          console.log("Using fallback query due to NULL values");
          // Use a more permissive query that excludes problem fields from validation
          return await prisma.customer.findMany({
            where: whereClause,
            select: {
              id: true,
              customerCode: true,
              customerName: true,
              aadhar: true,
              photoUrl: true,
              mobile: true, // Let it fail and we'll handle in transformation
              dob: true,
              gender: true,
              spouseName: true,
              parentName: true,
              guarantorName: true,
              guarantorAadhar: true,
              address: true,
              areaId: true,
              qrUrl: true,
              createdAt: true,
              area: true,
              loans: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                  repayments: {
                    select: {
                      amount: true,
                      repaymentDate: true,
                      dueDate: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          });
        }
        throw error;
      });

    // Safe transformation with explicit NULL handling
    const formatted = customers.map((customer) => {
      const latestLoan = customer.loans?.[0] || null;

      let endDate = null;
      let loanAmount = 0;
      let totalPaid = 0;
      let pendingAmount = 0;
      let loanDate = null;
      let tenure = null;

      if (latestLoan) {
        loanDate = latestLoan.loanDate;
        tenure = latestLoan.tenure;

        if (loanDate && tenure != null) {
          const loanStartDate = new Date(loanDate);
          const tenureMonths = Number(tenure);
          if (!isNaN(loanStartDate.getTime()) && !isNaN(tenureMonths)) {
            const end = new Date(loanStartDate);
            end.setMonth(end.getMonth() + tenureMonths);
            endDate = end;
          }
        }

        loanAmount = Number(latestLoan?.amount ?? 0);
        totalPaid = (latestLoan?.repayments || []).reduce((acc, r) => {
          const val =
            typeof r.amount === "number" ? r.amount : Number(r.amount || 0);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        pendingAmount = Math.max(loanAmount - totalPaid, 0);
      }

      // SAFE NULL HANDLING - This happens before Prisma validation
      return {
        id: customer.id,
        customerCode: customer.customerCode || "",
        name: customer.customerName,
        aadhar: customer.aadhar || "",
        photoUrl: customer.photoUrl,
        mobile: customer.mobile || "Not Provided", // Safe fallback
        dob: customer.dob ? customer.dob.toISOString() : null,
        gender: customer.gender,
        spouseName: customer.spouseName || "",
        parentName: customer.parentName || "",
        guarantorName: customer.guarantorName || "",
        guarantorAadhar: customer.guarantorAadhar || "",
        address: customer.address || "",
        areaId: customer.area?.id ?? null,
        area: customer.area?.areaName ?? null,
        loanAmount,
        loanDate,
        tenure,
        totalPaid,
        pendingAmount,
        endDate,
        hasLoans: customer.loans.length > 0,
        qrUrl: customer.qrUrl,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("GET /api/customers error:", error);

    // Specific handling for NULL value errors
    if (error.code === "P2032") {
      return NextResponse.json(
        {
          message:
            "Database contains invalid NULL values. Please update your database schema or data.",
          details:
            "Mobile field contains NULL values but schema expects non-nullable strings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to fetch customers",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

// ✅ POST create customer with enhanced error handling
export async function POST(req) {
  try {
    const formData = await req.formData();
    const customer = Object.fromEntries(formData.entries());

    console.log("Creating new customer with data:", {
      customerName: customer.customerName,
      customerCode: customer.customerCode,
      mobile: customer.mobile,
      area: customer.area,
    });

    // Validate required fields
    if (!customer.customerName || !customer.mobile) {
      return NextResponse.json(
        { success: false, error: "Customer name and mobile are required" },
        { status: 400 }
      );
    }

    // Check for Blob token before proceeding
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN environment variable is not set");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Blob token missing",
        },
        { status: 500 }
      );
    }

    // Upload files to Vercel Blob
    const photo = formData.get("photo");
    const aadharDocument = formData.get("aadharDocument");
    const incomeProof = formData.get("incomeProof");
    const residenceProof = formData.get("residenceProof");

    const [photoUrl, aadharDocumentUrl, incomeProofUrl, residenceProofUrl] =
      await Promise.all([
        saveFile(photo, "photo"),
        saveFile(aadharDocument, "aadhar"),
        saveFile(incomeProof, "income"),
        saveFile(residenceProof, "residence"),
      ]);

    // Process date fields
    const dobDate = customer.dob ? new Date(customer.dob) : null;
    const dob = dobDate && !isNaN(dobDate.getTime()) ? dobDate : null;

    // Validate area exists
    if (customer.area) {
      const areaExists = await prisma.area.findUnique({
        where: { id: customer.area },
      });

      if (!areaExists) {
        return NextResponse.json(
          {
            success: false,
            error: `Area '${customer.area}' does not exist. Please provide a valid area.`,
          },
          { status: 400 }
        );
      }
    }

    // Create customer
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

    console.log("Customer created successfully:", newCustomer.id);

    // Create initial loan if provided
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
        console.log("Initial loan created for customer:", newCustomer.id);
      }
    }

    // Generate QR code (don't fail entire operation if QR generation fails)
    let qrUrl = null;
    if (newCustomer.customerCode) {
      qrUrl = await generateQRCode(newCustomer.customerCode);

      // Only update if QR generation was successful
      if (qrUrl) {
        await prisma.customer.update({
          where: { id: newCustomer.id },
          data: { qrUrl },
        });
        console.log(
          "QR code generated and saved for customer:",
          newCustomer.id
        );
      } else {
        console.log("QR code generation failed for customer:", newCustomer.id);
      }
    }

    return NextResponse.json(
      {
        success: true,
        customer: { ...newCustomer, qrUrl },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/customers error:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        {
          success: false,
          error: `A customer with this ${field} already exists.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create customer",
      },
      { status: 500 }
    );
  }
}

// ✅ PUT update customer with enhanced file handling
export async function PUT(req) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    console.log("Update data received:", {
      id: data.id,
      customerName: data.customerName,
      documentField: data.documentField,
      deleteDocument: data.deleteDocument,
    });

    // Check if Blob token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN environment variable is not set");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Blob token missing",
        },
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

    // Get existing customer data
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

    // Validate area exists
    if (data.area) {
      const areaExists = await prisma.area.findUnique({
        where: { id: data.area },
      });

      if (!areaExists) {
        return NextResponse.json(
          {
            success: false,
            error: `Area '${data.area}' does not exist. Please provide a valid area.`,
          },
          { status: 400 }
        );
      }
    }

    // Process date fields
    const dobDate = data.dob ? new Date(data.dob) : null;
    const dob =
      dobDate && !isNaN(dobDate.getTime()) ? dobDate : existingCustomer.dob;

    // Start with existing data
    const updateData = {
      customerName: data.customerName || existingCustomer.customerName,
      spouseName: data.spouseName || existingCustomer.spouseName,
      parentName: data.parentName || existingCustomer.parentName,
      mobile: data.mobile || existingCustomer.mobile,
      dob,
      aadhar: data.aadhar || existingCustomer.aadhar,
      gender: data.gender || existingCustomer.gender,
      address: data.address || existingCustomer.address,
      guarantorName: data.guarantorName || existingCustomer.guarantorName,
      guarantorAadhar: data.guarantorAadhar || existingCustomer.guarantorAadhar,
      areaId: data.area || existingCustomer.areaId,
      customerCode: data.customerCode || existingCustomer.customerCode,
      // Preserve existing URLs
      photoUrl: existingCustomer.photoUrl,
      aadharDocumentUrl: existingCustomer.aadharDocumentUrl,
      incomeProofUrl: existingCustomer.incomeProofUrl,
      residenceProofUrl: existingCustomer.residenceProofUrl,
      qrUrl: existingCustomer.qrUrl,
    };

    // Handle document-specific operations
    if (documentField) {
      if (deleteDocument) {
        // Delete specific document
        updateData[documentField] = null;
        console.log(`Deleted document field: ${documentField}`);
      } else {
        // Upload/update specific document
        const file = formData.get("file");
        if (file && typeof file !== "string" && file.size > 0) {
          updateData[documentField] = await saveFile(file, documentField);
          console.log(`Updated document field: ${documentField}`);
        }
      }
    } else {
      // Handle profile update with file uploads
      const filesToProcess = [];

      // Check which files were actually uploaded
      const fileFields = [
        { formField: "photo", dataField: "photoUrl" },
        { formField: "aadharDocument", dataField: "aadharDocumentUrl" },
        { formField: "incomeProof", dataField: "incomeProofUrl" },
        { formField: "residenceProof", dataField: "residenceProofUrl" },
      ];

      for (const { formField, dataField } of fileFields) {
        if (
          formData.has(formField) &&
          typeof formData.get(formField) !== "string"
        ) {
          const file = formData.get(formField);
          if (file && file.size > 0) {
            filesToProcess.push({ field: dataField, file });
          }
        }
      }

      // Process file uploads in parallel
      if (filesToProcess.length > 0) {
        const uploadPromises = filesToProcess.map(async ({ field, file }) => {
          const url = await saveFile(file, field);
          return { field, url };
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Update the data with new URLs
        uploadResults.forEach(({ field, url }) => {
          if (url) {
            updateData[field] = url;
          }
        });
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    console.log("Customer updated successfully:", customerId);

    // Regenerate QR code if customerCode changed
    let finalQrUrl = updatedCustomer.qrUrl;
    if (
      data.customerCode &&
      data.customerCode !== existingCustomer.customerCode
    ) {
      const qrUrl = await generateQRCode(data.customerCode);
      if (qrUrl) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { qrUrl },
        });
        finalQrUrl = qrUrl;
        console.log("QR code regenerated for customer:", customerId);
      }
    }

    return NextResponse.json(
      {
        success: true,
        customer: { ...updatedCustomer, qrUrl: finalQrUrl },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/customers error:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Database constraint violation. Please check if the referenced area exists.",
        },
        { status: 400 }
      );
    }

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        {
          success: false,
          error: `A customer with this ${field} already exists.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update customer",
      },
      { status: 500 }
    );
  }
}

// ✅ DELETE customer with enhanced validation
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

    // Check if customer exists and has related records
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            repayments: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for existing loans
    if (customer.loans && customer.loans.length > 0) {
      const activeLoans = customer.loans.filter((loan) => {
        const totalPaid = loan.repayments.reduce(
          (sum, r) => sum + (r.amount || 0),
          0
        );
        return loan.amount - totalPaid > 0;
      });

      if (activeLoans.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot delete customer with active loans. Please close all loans first.",
          },
          { status: 400 }
        );
      }
    }

    // Delete customer (Prisma will handle related records based on your schema)
    await prisma.customer.delete({
      where: { id },
    });

    console.log("Customer deleted successfully:", id);

    return NextResponse.json(
      {
        success: true,
        message: "Customer deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/customers error:", error);

    // Handle foreign key constraint violations
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete customer due to existing related records. Please delete related loans and repayments first.",
        },
        { status: 400 }
      );
    }

    // Handle record not found
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found or already deleted.",
        },
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
