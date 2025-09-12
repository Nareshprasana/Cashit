// File: src/app/api/customers/areas/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch all areas
export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      select: { id: true, areaName: true, shortCode: true },
    });
    return NextResponse.json(areas);
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Add new area (optional, for your Add Area modal)
export async function POST(req) {
  const { areaName, shortCode = "", pincode = "" } = await req.json();
  if (!areaName || areaName.trim() === "") {
    return NextResponse.json({ error: "Area name is required" }, { status: 400 });
  }
  const created = await prisma.area.create({ data: { areaName, shortCode, pincode } });
  return NextResponse.json(created, { status: 201 });
}
