import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ correct


// ✅ Get single expense by ID
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("GET /api/expense/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

// ✅ Update expense by ID
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        notes: body.notes || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/expense/[id] error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// ✅ Delete expense by ID
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/expense/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
