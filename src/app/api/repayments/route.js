import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ GET repayments (all or by customerId)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const repayments = await prisma.repayment.findMany({
      where: customerId ? { loan: { customerId } } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        loan: {
          include: {
            customer: true,
            repayments: {
              select: {
                amount: true
              }
            }
          },
        },
      },
    });

    // Calculate pending amount (loan amount - total repayments) - NO INTEREST
    const repaymentsWithPending = repayments.map(repayment => {
      const totalPaid = repayment.loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const pendingAmount = Math.max(0, Number(repayment.loan.amount) - totalPaid);
      
      return {
        ...repayment,
        pendingAmount: pendingAmount
      };
    });

    return NextResponse.json(repaymentsWithPending);
  } catch (error) {
    console.error("Repayment GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch repayments" },
      { status: 500 }
    );
  }
}

// ✅ POST to create repayment
export async function POST(req) {
  try {
    const body = await req.json();
    const { loanId, amount, dueDate, paymentMethod } = body;

    if (!loanId || amount === undefined || !dueDate || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || isNaN(Date.parse(dueDate))) {
      return NextResponse.json(
        { message: "Invalid data format" },
        { status: 400 }
      );
    }

    const pm = String(paymentMethod).toUpperCase().replace(/\s+/g, "_");

    const loan = await prisma.loan.findUnique({ 
      where: { id: loanId },
      include: {
        repayments: {
          select: { amount: true }
        }
      }
    });
    
    if (!loan)
      return NextResponse.json({ message: "Loan not found" }, { status: 400 });

    const repaymentAmount = parseFloat(amount);
    const totalPaid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
    
    // Simple calculation: Loan amount - total repayments (no interest)
    const newPending = Math.max(0, Number(loan.amount) - (totalPaid + repaymentAmount));

    const result = await prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: { pendingAmount: newPending },
      });

      const repayment = await tx.repayment.create({
        data: {
          loanId,
          amount: repaymentAmount,
          pendingAmount: newPending,
          dueDate: new Date(dueDate),
          paymentMethod: pm,
        },
        include: {
          loan: {
            include: {
              customer: true,
            },
          },
        },
      });

      return { repayment, updatedLoan };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Repayment POST error:", error);
    return NextResponse.json(
      { message: "Failed to create repayment", detail: error.message },
      { status: 500 }
    );
  }
}