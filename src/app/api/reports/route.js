// src/app/api/reports/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function monthKeyFromDate(date) {
  if (!(date instanceof Date)) return null;
  if (isNaN(date)) return null;
  return date.toLocaleString("en-US", { month: "short" });
}

export async function GET() {
  try {
    // Fetch minimal fields
    const loans = await prisma.loan.findMany({
      select: { amount: true, createdAt: true },
    });

    const repayments = await prisma.repayment.findMany({
      select: { amount: true, createdAt: true },
    });

    // Build month -> totals
    const monthlyData = {};

    for (const l of loans) {
      const m = monthKeyFromDate(l.createdAt);
      if (!m) continue;
      if (!monthlyData[m]) monthlyData[m] = { loans: 0, repayments: 0 };
      monthlyData[m].loans += Number(l.amount ?? 0);
    }

    for (const r of repayments) {
      const m = monthKeyFromDate(r.createdAt);
      if (!m) continue;
      if (!monthlyData[m]) monthlyData[m] = { loans: 0, repayments: 0 };
      monthlyData[m].repayments += Number(r.amount ?? 0);
    }

    // Create chart-ready array in fixed order
    const monthOrder = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const chartData = monthOrder
      .filter((m) => monthlyData[m])
      .map((m) => ({
        month: m,
        loans: monthlyData[m].loans,
        repayments: monthlyData[m].repayments,
      }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Failed to load reports", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
