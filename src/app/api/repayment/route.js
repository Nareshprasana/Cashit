import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const repayments = await prisma.repayment.findMany({
      include: {
        loan: {
          include: {
            customer: true,
          },
        },
      },
    });

    const formatted = repayments.map((r) => ({
      id: r.id,
      customerName: r.loan?.customer?.customerName || "N/A",
      loanId: r.loan?.id || "N/A",
      amount: r.amount,
      dueDate: r.dueDate.toISOString().split("T")[0],
      repaymentDate: r.repaymentDate
        ? r.repaymentDate.toISOString().split("T")[0]
        : null,
      paymentMethod: r.paymentMethod,
      pendingAmount: r.pendingAmount,
      loanStatus: r.loan?.status,
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
