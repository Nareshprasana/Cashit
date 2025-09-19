import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999); // :white_tick: include full day
    // Fetch all loans with repayments
    const loans = await prisma.loan.findMany({
      select: {
        id: true,
        amount: true,
        interestAmount: true,
        customerId: true,
        createdAt: true,
        repayments: {
          select: {
            amount: true,
            repaymentDate: true,
            createdAt: true,
          },
        },
      },
    });
    // ----- Customer-wise stats -----
    const statsMap = {};
    for (const loan of loans) {
      const { customerId, amount, repayments } = loan;
      if (!statsMap[customerId]) {
        statsMap[customerId] = {
          customerId,
          totalLoans: 0,
          totalRepaid: 0,
          totalPending: 0,
        };
      }
      const repaid = repayments.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
      );
      statsMap[customerId].totalLoans += 1;
      statsMap[customerId].totalRepaid += repaid;
      statsMap[customerId].totalPending += Number(amount || 0) - repaid;
    }
    // ----- Overall monthly totals -----
    const loanValueMonthly = loans
      .filter(
        (loan) => loan.createdAt >= startOfMonth && loan.createdAt <= endOfMonth
      )
      .reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
    const loanCountMonthly = loans.filter(
      (loan) => loan.createdAt >= startOfMonth && loan.createdAt <= endOfMonth
    ).length;
    const receivedAmountMonthly = loans.reduce(
      (sum, loan) =>
        sum +
        loan.repayments.reduce((innerSum, r) => {
          const date = r.repaymentDate || r.createdAt; // :white_tick: fallback
          if (date >= startOfMonth && date <= endOfMonth) {
            return innerSum + Number(r.amount || 0);
          }
          return innerSum;
        }, 0),
      0
    );
    return NextResponse.json({
      loanValueMonthly,
      loanCountMonthly,
      receivedAmountMonthly,
      customers: Object.values(statsMap),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
