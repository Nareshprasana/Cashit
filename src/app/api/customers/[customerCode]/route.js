import prisma from "@/lib/prisma"; // ✅ correct

import { NextResponse } from "next/server";

// ✅ GET /api/customers/[customerCode]
export async function GET(req, { params }) {
  try {
    const { customerCode } = await params;

    if (!customerCode) {
      return NextResponse.json(
        { error: "Customer code missing" },
        { status: 400 }
      );
    }

    // ✅ Fetch customer with loans + repayments + area
    const customer = await prisma.customer.findUnique({
      where: { customerCode },
      include: {
        loans: {
          include: { repayments: true },
          orderBy: { createdAt: "desc" },
        },
        area: true,
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

    return NextResponse.json({
      ...customer,
      loans: loansWithPending,
      loanAmount: latestLoan.loanAmount || 0,
      pendingAmount: latestLoan.pendingAmount || 0,
    });
  } catch (error) {
    console.error("❌ Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
