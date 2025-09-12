import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ correct

export async function GET() {
  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    // Get repayments made this month
    const repayments = await prisma.repayment.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        amount: true,
      },
    });

    // Get loans given this month
    const loans = await prisma.loan.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        amount: true,
      },
    });

    // Calculate totals
    const loanValue = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const loanCount = loans.length;
    const receivedAmount = repayments.reduce((sum, rep) => sum + rep.amount, 0);
    const interestAmount = Math.max(receivedAmount - loanValue, 0);

    return NextResponse.json({
      loanValueMonthly: loanValue,
      loanCountMonthly: loanCount,
      receivedAmountMonthly: receivedAmount,
      interestAmountMonthly: interestAmount,
    });
  } catch (error) {
    console.error("Error in summary API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
