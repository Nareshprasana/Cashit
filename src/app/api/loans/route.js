// app/api/loans/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Function to calculate interest amount
const calculateInterestAmount = (loanAmount, rate, tenure) => {
  // Simple interest calculation: (Principal * Rate * Time) / 100
  return (loanAmount * rate * tenure) / 100;
};

// 🔹 GET handler (summary OR full list)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary");

    if (summary) {
      // Count active loans (pendingAmount > 0)
      const active = await prisma.loan.count({
        where: { pendingAmount: { gt: 0 } },
      });

      return NextResponse.json({ active }, { status: 200 });
    }

    // Otherwise return full loan list
    const loans = await prisma.loan.findMany({
      select: {
        id: true,
        amount: true,
        loanAmount: true,
        pendingAmount: true,
        loanDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(loans, { status: 200 });
  } catch (error) {
    console.error("Loan fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch loans", details: error.message },
      { status: 500 }
    );
  }
}

// 🔹 POST handler (for creating a loan)
export async function POST(req) {
  let rawData;

  try {
    rawData = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format" },
      { status: 400 }
    );
  }

  const data = rawData;

  if (!data.customerId) {
    return NextResponse.json(
      { error: "customerId is required" },
      { status: 400 }
    );
  }

  const amount = Number(data.amount);
  const rate = Number(data.rate);
  const tenure = Number(data.tenure);
  const loanAmount = Number(data.loanAmount || amount);
  const pendingAmount = Number(data.pendingAmount || loanAmount);

  if ([amount, rate, tenure, loanAmount, pendingAmount].some((val) => isNaN(val))) {
    return NextResponse.json(
      { error: "One or more numeric values are invalid" },
      { status: 400 }
    );
  }

  const loanDate = new Date(data.loanDate);
  if (isNaN(loanDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid loan date" },
      { status: 400 }
    );
  }

  const interestAmount = calculateInterestAmount(loanAmount, rate, tenure);
  const documentUrl = data.documentUrl || null;

  try {
    const existingActiveLoan = await prisma.loan.findFirst({
      where: {
        customerId: data.customerId,
        pendingAmount: { gt: 0 },
      },
    });

    if (existingActiveLoan) {
      return NextResponse.json(
        { error: "already loan is in active state" },
        { status: 409 }
      );
    }

    const loan = await prisma.loan.create({
      data: {
        area: data.area || null,
        customerId: data.customerId,
        amount,
        rate,
        tenure,
        loanDate,
        loanAmount,
        pendingAmount,
        interestAmount,
        documentUrl,
      },
    });

    return NextResponse.json({ success: true, loan }, { status: 201 });
  } catch (error) {
    console.error("Loan creation error:", error);
    return NextResponse.json(
      { error: "Failed to create loan", details: error.message },
      { status: 500 }
    );
  }
}
