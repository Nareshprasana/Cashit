import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ GET repayments (all or by customerId)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    let repayments;

    if (customerId) {
      // Fetch repayments for a specific customer
      repayments = await prisma.repayment.findMany({
        where: { loan: { customerId } },
        orderBy: { createdAt: "desc" },
        include: { loan: true }, // optional: include loan details
      });
    } else {
      // Fetch all repayments
      repayments = await prisma.repayment.findMany({
        orderBy: { createdAt: "desc" },
        include: { loan: true },
      });
    }

    return NextResponse.json(repayments);
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
    const {
      loanId,
      amount,
      loanAmount,
      pendingAmount,
      dueDate,
      paymentMethod,
    } = body;

    // Basic validation
    if (
      !loanId ||
      amount === undefined ||
      loanAmount === undefined ||
      pendingAmount === undefined ||
      !dueDate ||
      !paymentMethod
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      isNaN(amount) ||
      isNaN(loanAmount) ||
      isNaN(pendingAmount) ||
      isNaN(Date.parse(dueDate)) ||
      typeof paymentMethod !== "string"
    ) {
      return NextResponse.json(
        { message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Check if loan exists
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 400 });
    }

    // Create repayment
    const repayment = await prisma.repayment.create({
      data: {
        loan: { connect: { id: loanId } },
        amount: parseFloat(amount),
        loanAmount: parseFloat(loanAmount),
        pendingAmount: parseFloat(pendingAmount),
        dueDate: new Date(dueDate),
        paymentMethod,
      },
    });

    return NextResponse.json(repayment, { status: 201 });
  } catch (error) {
    console.error("Repayment POST error:", error);
    return NextResponse.json(
      { message: "Failed to create repayment" },
      { status: 500 }
    );
  }
}
