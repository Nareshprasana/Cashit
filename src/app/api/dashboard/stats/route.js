// src/app/api/dashboard/stats/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch all loans (with repayments) created this month
    const loans = await prisma.loan.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: {
        id: true,
        amount: true,
        interestAmount: true,
        customerId: true,
        repayments: {
          select: {
            amount: true,
            repaymentDate: true,
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

      statsMap[customerId].totalLoans += 1;
      statsMap[customerId].totalRepaid += repayments.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
      );
      statsMap[customerId].totalPending += Number(amount || 0);
    }

    Object.values(statsMap).forEach(stat => {
      stat.totalPending = stat.totalPending - stat.totalRepaid;
    });

    // ----- Overall monthly totals -----
    const loanValueMonthly = loans.reduce(
      (sum, loan) => sum + Number(loan.amount || 0),
      0
    );

    const loanCountMonthly = loans.length;

    const receivedAmountMonthly = loans.reduce(
      (sum, loan) =>
        sum +
        loan.repayments.reduce(
          (innerSum, r) =>
            r.repaymentDate >= startOfMonth
              ? innerSum + Number(r.amount || 0)
              : innerSum,
          0
        ),
      0
    );

    const interestAmountMonthly = loans.reduce(
      (sum, loan) => sum + Number(loan.interestAmount || 0),
      0
    );

    return NextResponse.json({
      loanValueMonthly,
      loanCountMonthly,
      receivedAmountMonthly,
      interestAmountMonthly,
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
