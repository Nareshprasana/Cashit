// File: src/app/api/customers/by-area/[areaId]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch customers by areaId
export async function GET(req, context) {
  const { params } = context;
  const { areaId } = await params; // Needed for Next.js 15+

  if (!areaId) {
    return NextResponse.json({ error: "Area ID is required" }, { status: 400 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { areaId: areaId },
      select: { id: true, customerName: true, customerCode: true }, // Adjust fields as needed
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers by area:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
