import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single repayment
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const repayment = await prisma.repayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        loan: {
          include: {
            customer: {
              include: {
                area: true
              }
            },
            repayments: {
              select: { 
                id: true,
                amount: true,
                dueDate: true,
                repaymentDate: true,
                paymentMethod: true
              },
            },
          },
        },
      },
    });

    if (!repayment) {
      return NextResponse.json({ error: "Repayment not found" }, { status: 404 });
    }

    // Calculate total paid and pending amount
    const totalPaid = repayment.loan.repayments.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const loanAmount = Number(repayment.loan.loanAmount);
    const pendingAmount = Math.max(0, loanAmount - totalPaid);

    // Calculate status
    let status = "PENDING";
    const today = new Date();
    const dueDate = new Date(repayment.dueDate);
    
    if (repayment.repaymentDate) {
      status = "PAID";
    } else if (dueDate < today) {
      status = "OVERDUE";
    }

    const loan = repayment.loan;
    const customer = loan.customer;

    const response = {
      id: repayment.id.toString(),
      loanId: repayment.loanId,
      amount: repayment.amount,
      dueDate: repayment.dueDate.toISOString(),
      repaymentDate: repayment.repaymentDate?.toISOString() || null,
      paymentMethod: repayment.paymentMethod,
      createdAt: repayment.createdAt.toISOString(),
      status: status,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area
      },
      loan: {
        id: loan.id,
        amount: loan.amount,
        loanAmount: loan.loanAmount,
        pendingAmount: pendingAmount,
        interestAmount: loan.interestAmount,
        status: loan.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loan.loanAmount,
      pendingAmount: pendingAmount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET repayment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repayment", detail: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (mainly for amount)
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    // First get the current repayment to calculate updates
    const currentRepayment = await prisma.repayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        loan: {
          include: {
            customer: {
              include: {
                area: true
              }
            },
            repayments: {
              select: { 
                id: true,
                amount: true,
                dueDate: true,
                repaymentDate: true
              },
            },
          },
        },
      },
    });

    if (!currentRepayment) {
      return NextResponse.json({ error: "Repayment not found" }, { status: 404 });
    }

    const updateData = {};
    
    if (body.amount !== undefined) {
      updateData.amount = Number(body.amount);
    }
    
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }

    // If amount changed, update loan pending amount
    if (body.amount !== undefined) {
      const loan = currentRepayment.loan;
      const otherRepayments = loan.repayments.filter(r => r.id !== parseInt(id));
      const otherRepaymentsTotal = otherRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const newPending = Math.max(0, Number(loan.loanAmount) - (otherRepaymentsTotal + Number(body.amount)));
      
      updateData.pendingAmount = newPending;

      // Update loan pending amount
      await prisma.loan.update({
        where: { id: loan.id },
        data: { pendingAmount: newPending },
      });
    }

    const updated = await prisma.repayment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        loan: {
          include: {
            customer: {
              include: {
                area: true
              }
            },
            repayments: {
              select: { 
                id: true,
                amount: true,
                dueDate: true,
                repaymentDate: true
              },
            },
          },
        },
      },
    });

    // Calculate status
    let status = "PENDING";
    const today = new Date();
    const dueDate = new Date(updated.dueDate);
    
    if (updated.repaymentDate) {
      status = "PAID";
    } else if (dueDate < today) {
      status = "OVERDUE";
    }

    const loan = updated.loan;
    const customer = loan.customer;

    const response = {
      id: updated.id.toString(),
      loanId: updated.loanId,
      amount: updated.amount,
      dueDate: updated.dueDate.toISOString(),
      repaymentDate: updated.repaymentDate?.toISOString() || null,
      paymentMethod: updated.paymentMethod,
      createdAt: updated.createdAt.toISOString(),
      status: status,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area
      },
      loan: {
        id: loan.id,
        amount: loan.amount,
        loanAmount: loan.loanAmount,
        pendingAmount: loan.pendingAmount,
        interestAmount: loan.interestAmount,
        status: loan.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loan.loanAmount,
      pendingAmount: loan.pendingAmount
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("PATCH repayment error:", error);
    return NextResponse.json(
      { error: "Failed to update repayment", detail: error.message },
      { status: 500 }
    );
  }
}

// PUT - Full update
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!body.amount || !body.status || !body.dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First get the current repayment
    const currentRepayment = await prisma.repayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        loan: {
          include: {
            customer: true,
            repayments: {
              select: { 
                id: true,
                amount: true
              },
            },
          },
        },
      },
    });

    if (!currentRepayment) {
      return NextResponse.json({ error: "Repayment not found" }, { status: 404 });
    }

    const loan = currentRepayment.loan;
    const otherRepayments = loan.repayments.filter(r => r.id !== parseInt(id));
    const otherRepaymentsTotal = otherRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
    const newPending = Math.max(0, Number(loan.loanAmount) - (otherRepaymentsTotal + Number(body.amount)));

    const updated = await prisma.$transaction(async (tx) => {
      // Update loan pending amount
      await tx.loan.update({
        where: { id: loan.id },
        data: { pendingAmount: newPending },
      });

      // Update repayment
      return await tx.repayment.update({
        where: { id: parseInt(id) },
        data: {
          amount: Number(body.amount),
          dueDate: new Date(body.dueDate),
          pendingAmount: newPending,
        },
        include: {
          loan: {
            include: {
              customer: {
                include: {
                  area: true
                }
              },
              repayments: {
                select: { 
                  id: true,
                  amount: true,
                  dueDate: true,
                  repaymentDate: true
                },
              },
            },
          },
        },
      });
    });

    // Calculate status
    let status = body.status;
    const today = new Date();
    const dueDate = new Date(updated.dueDate);
    
    // Auto-correct status based on dates if needed
    if (updated.repaymentDate && status !== "PAID") {
      status = "PAID";
    } else if (!updated.repaymentDate && dueDate < today && status !== "OVERDUE") {
      status = "OVERDUE";
    }

    const customer = updated.loan.customer;

    const response = {
      id: updated.id.toString(),
      loanId: updated.loanId,
      amount: updated.amount,
      dueDate: updated.dueDate.toISOString(),
      repaymentDate: updated.repaymentDate?.toISOString() || null,
      paymentMethod: updated.paymentMethod,
      createdAt: updated.createdAt.toISOString(),
      status: status,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area
      },
      loan: {
        id: loan.id,
        amount: loan.amount,
        loanAmount: loan.loanAmount,
        pendingAmount: loan.pendingAmount,
        interestAmount: loan.interestAmount,
        status: loan.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loan.loanAmount,
      pendingAmount: loan.pendingAmount
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("PUT repayment error:", error);
    return NextResponse.json(
      { error: "Failed to update repayment", detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove repayment
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if repayment exists
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        loan: {
          include: {
            repayments: {
              select: { 
                id: true,
                amount: true
              },
            },
          },
        },
      },
    });

    if (!existingRepayment) {
      return NextResponse.json(
        { error: "Repayment not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete the repayment
      await tx.repayment.delete({
        where: { id: parseInt(id) }
      });

      // Recalculate loan pending amount
      const remainingRepayments = await tx.repayment.findMany({
        where: { loanId: existingRepayment.loanId },
        select: { amount: true }
      });

      const totalPaid = remainingRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const loanAmount = Number(existingRepayment.loan.loanAmount);
      const pendingAmount = Math.max(0, loanAmount - totalPaid);

      // Update loan pending amount
      await tx.loan.update({
        where: { id: existingRepayment.loanId },
        data: { pendingAmount }
      });
    });

    return NextResponse.json(
      { message: "Repayment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE repayment error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete repayment",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}