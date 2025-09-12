// /app/api/customers/with-loan-info/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        area: true,
        loans: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Latest loan
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers with loans:", error);
    return NextResponse.json({ message: "Failed to fetch data" }, { status: 500 });
  }
}
