import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get all expenses
export async function GET(req) {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expense error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// Create new expense
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.invoiceNumber || !body.title || !body.amount || !body.date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        title: body.title,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        notes: body.notes || null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("POST /api/expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}