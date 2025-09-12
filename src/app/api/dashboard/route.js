// src/app/api/dashboard/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch counts from DB
    const totalCustomers = await prisma.customer.count();
    const totalLoans = await prisma.loan.count();

    // Example: calculate repayments
    const totalRepaidAgg = await prisma.repayment.aggregate({
      _sum: { amount: true },
    });

    const totalLoanAgg = await prisma.loan.aggregate({
      _sum: { amount: true },
    });

    const totalRepaid = totalRepaidAgg._sum.amount || 0;
    const totalLoanAmount = totalLoanAgg._sum.amount || 0;
    const totalPending = totalLoanAmount - totalRepaid;

    // Build dashboard response
    const dashboardData = {
      totalCustomers,
      totalLoans,
      totalRepaid,
      totalPending,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
