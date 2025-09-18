import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH → partial update (inline edits like amount change)
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.repayment.update({
      where: { id: Number(id) }, // use parseInt if id is Int in schema
      data: {
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH repayment error:", error);
    return NextResponse.json(
      { error: "Failed to update repayment" },
      { status: 500 }
    );
  }
}

// PUT → full update (dialog form)
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.repayment.update({
      where: { id: Number(id) },
      data: {
        amount: Number(body.amount),
        status: body.status,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PUT repayment error:", error);
    return NextResponse.json(
      { error: "Failed to update repayment" },
      { status: 500 }
    );
  }
}
