import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get single expense
export async function GET(_, { params }) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
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

// Update expense
export async function PUT(req, { params }) {
  try {
    const body = await req.json();

    // Check if expense exists first
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        invoiceNumber: body.invoiceNumber,
        title: body.title,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        notes: body.notes || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/expense/[id] error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// Delete expense
export async function DELETE(_, { params }) {
  try {
    // Check if expense exists first
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/expense/[id] error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}