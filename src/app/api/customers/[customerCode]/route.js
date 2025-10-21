import prisma from "@/lib/prisma"; // ✅ correct

import { NextResponse } from "next/server";

// ✅ GET /api/customers/[customerCode]
export async function GET(req, { params }) {
  try {
    // `params` is async in the App Router — await it before accessing properties
    const { customerCode } = await params;

    if (!customerCode) {
      return NextResponse.json(
        { error: "Customer code missing" },
        { status: 400 }
      );
    }

    // ✅ Fetch customer with loans + repayments + area
    // Use explicit `select` to avoid selecting nullable fields like `mobile`
    // that may contain NULL in the DB and cause Prisma conversion errors.
    const customer = await prisma.customer.findUnique({
      where: { customerCode },
      select: {
        id: true,
        customerCode: true,
        customerName: true,
        aadhar: true,
        photoUrl: true,
        // intentionally not selecting `mobile` here
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
          include: {
            repayments: {
              select: {
                id: true,
                amount: true,
                repaymentDate: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // ✅ Calculate pending amounts
    const loansWithPending = customer.loans.map((loan) => {
      const totalRepaid = loan.repayments.reduce(
        (sum, rep) => sum + (rep.amount || 0),
        0
      );
      return {
        ...loan,
        pendingAmount: loan.loanAmount - totalRepaid,
      };
    });

    // ✅ Get latest loan (most recent)
    const latestLoan = loansWithPending[0] || {};

    // Build a safe formatted response and coalesce missing mobile
    const formatted = {
      id: customer.id,
      customerCode: customer.customerCode,
      name: customer.customerName,
      aadhar: customer.aadhar || "",
      photoUrl: customer.photoUrl || null,
      mobile: (customer && typeof customer.mobile !== 'undefined' && customer.mobile) ? customer.mobile : "Not Provided",
      dob: customer.dob ? customer.dob.toISOString() : null,
      gender: customer.gender || null,
      spouseName: customer.spouseName || "",
      parentName: customer.parentName || "",
      guarantorName: customer.guarantorName || "",
      guarantorAadhar: customer.guarantorAadhar || "",
      address: customer.address || "",
      areaId: customer.areaId ?? null,
      area: customer.area?.areaName ?? null,
      qrUrl: customer.qrUrl || null,
      loans: loansWithPending,
      loanAmount: latestLoan.loanAmount || 0,
      pendingAmount: latestLoan.pendingAmount || 0,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
