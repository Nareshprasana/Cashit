import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const repayments = await prisma.repayment.findMany({
      include: {
        customer: true,
        loan: true,
      },
    });

    const formatted = repayments.map((r) => ({
      id: r.id,
      customerName: r.customer?.name || "N/A",
      loanCode: r.loan?.loanCode || "N/A",
      amount: r.amount,
      date: r.date.toISOString().split("T")[0],
      status: r.status,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayments" },
      { status: 500 }
    );
  }
}
