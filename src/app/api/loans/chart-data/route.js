import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper: generate month ranges
function getMonths(range) {
  const months = [];
  const now = new Date();
  let count;

  switch (range) {
    case "3m":
      count = 3;
      break;
    case "6m":
      count = 6;
      break;
    case "1y":
      count = 12;
      break;
    case "all":
      count = now.getFullYear() * 12 + now.getMonth() + 1; // from year 0 to now
      break;
    default:
      count = 6; // fallback
  }

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });
    months.push({ date: d, month: monthName });
  }

  return months;
}

export async function GET(req) {
  try {
    // Read query param
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "6m";

    const months = getMonths(range);

    const chartData = await Promise.all(
      months.map(async ({ date, month }) => {
        // Count distinct customers
        const uniqueCustomers = await prisma.loan.groupBy({
          by: ["customerId"],
          where: {
            loanDate: {
              gte: new Date(date.getFullYear(), date.getMonth(), 1),
              lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
            },
          },
        });

        const customers = uniqueCustomers.length;

        // Total loan amount
        const loansAggregate = await prisma.loan.aggregate({
          _sum: { amount: true },
          where: {
            loanDate: {
              gte: new Date(date.getFullYear(), date.getMonth(), 1),
              lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
            },
          },
        });
        const loans = loansAggregate._sum.amount || 0;

        // Total repayments
        const repaymentsAggregate = await prisma.repayment.aggregate({
          _sum: { amount: true },
          where: {
            createdAt: {
              gte: new Date(date.getFullYear(), date.getMonth(), 1),
              lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
            },
          },
        });
        const repayments = repaymentsAggregate._sum.amount || 0;

        return { month, customers, loans, repayments };
      })
    );

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
