import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single repayment
export async function GET(req, { params }) {
  try {
    const { id } = await params;

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
              orderBy: { dueDate: "asc" },
              select: { 
                id: true,
                amount: true,
                dueDate: true,
                repaymentDate: true,
                paymentMethod: true,
                pendingAmount: true
              },
            },
          },
        },
      },
    });

    if (!repayment) {
      return NextResponse.json({ error: "Repayment not found" }, { status: 404 });
    }

    // Calculate running balance
    const loanAmount = Number(repayment.loan.loanAmount);
    let runningBalance = loanAmount;
    
    for (const r of repayment.loan.repayments) {
      if (r.id === parseInt(id)) {
        break; // Stop at current repayment
      }
      runningBalance -= Number(r.amount);
    }

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
      pendingAmount: runningBalance,
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
    const { id } = await params;
    const body = await req.json();

    // First get the current repayment with all loan repayments
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
              orderBy: { dueDate: "asc" },
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

    const loan = currentRepayment.loan;
    const loanAmount = Number(loan.loanAmount);
    
    // Recalculate running balance for ALL repayments
    let runningBalance = loanAmount;
    const updatedRepayments = [];

    for (let repayment of loan.repayments) {
      if (repayment.id === parseInt(id)) {
        // Use the updated amount for this repayment
        runningBalance -= Number(body.amount || currentRepayment.amount);
      } else {
        // Use the existing amount for other repayments
        runningBalance -= Number(repayment.amount);
      }
      
      updatedRepayments.push({
        id: repayment.id,
        pendingAmount: Math.max(0, runningBalance)
      });
    }

    const loanPendingAmount = updatedRepayments.length > 0 
      ? updatedRepayments[updatedRepayments.length - 1].pendingAmount 
      : loanAmount;

    const updateData = {};
    
    if (body.amount !== undefined) {
      updateData.amount = Number(body.amount);
    }
    
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update ALL repayments with their new pending amounts
      await Promise.all(
        updatedRepayments.map(repayment => 
          tx.repayment.update({
            where: { id: repayment.id },
            data: { pendingAmount: repayment.pendingAmount }
          })
        )
      );

      // Update loan pending amount
      await tx.loan.update({
        where: { id: loan.id },
        data: { pendingAmount: loanPendingAmount },
      });

      // Update the main repayment
      return await tx.repayment.update({
        where: { id: parseInt(id) },
        data: {
          ...updateData,
          pendingAmount: updatedRepayments.find(r => r.id === parseInt(id))?.pendingAmount || 0,
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
                orderBy: { dueDate: "asc" },
                select: { 
                  id: true,
                  amount: true,
                  dueDate: true,
                  repaymentDate: true,
                  pendingAmount: true
                },
              },
            },
          },
        },
      });
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
      pendingAmount: updated.pendingAmount,
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
        pendingAmount: loanPendingAmount,
        interestAmount: loan.interestAmount,
        status: loan.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loan.loanAmount,
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
    const { id } = await params;
    const body = await req.json();

    if (!body.amount || !body.status || !body.dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First get the current repayment with all loan repayments
    const currentRepayment = await prisma.repayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        loan: {
          include: {
            customer: true,
            repayments: {
              orderBy: { dueDate: "asc" },
              select: { 
                id: true,
                amount: true,
                dueDate: true
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
    const loanAmount = Number(loan.loanAmount);
    
    // Recalculate running balance for ALL repayments
    let runningBalance = loanAmount;
    const updatedRepayments = [];

    for (let repayment of loan.repayments) {
      if (repayment.id === parseInt(id)) {
        // Use the updated amount for this repayment
        runningBalance -= Number(body.amount);
      } else {
        // Use the existing amount for other repayments
        runningBalance -= Number(repayment.amount);
      }
      
      updatedRepayments.push({
        id: repayment.id,
        pendingAmount: Math.max(0, runningBalance)
      });
    }

    const loanPendingAmount = updatedRepayments.length > 0 
      ? updatedRepayments[updatedRepayments.length - 1].pendingAmount 
      : loanAmount;

    const updated = await prisma.$transaction(async (tx) => {
      // Update ALL repayments with their new pending amounts
      await Promise.all(
        updatedRepayments.map(repayment => 
          tx.repayment.update({
            where: { id: repayment.id },
            data: { pendingAmount: repayment.pendingAmount }
          })
        )
      );

      // Update loan pending amount
      await tx.loan.update({
        where: { id: loan.id },
        data: { pendingAmount: loanPendingAmount },
      });

      // Update the main repayment
      return await tx.repayment.update({
        where: { id: parseInt(id) },
        data: {
          amount: Number(body.amount),
          dueDate: new Date(body.dueDate),
          status: body.status.toUpperCase(),
          pendingAmount: updatedRepayments.find(r => r.id === parseInt(id))?.pendingAmount || 0,
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
                orderBy: { dueDate: "asc" },
                select: { 
                  id: true,
                  amount: true,
                  dueDate: true,
                  repaymentDate: true,
                  pendingAmount: true
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
      pendingAmount: updated.pendingAmount,
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
        pendingAmount: loanPendingAmount,
        interestAmount: loan.interestAmount,
        status: loan.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loan.loanAmount,
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
    const { id } = await params;

    // Check if repayment exists and get loan data
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        loan: {
          include: {
            repayments: {
              orderBy: { dueDate: "asc" },
              select: { 
                id: true,
                amount: true,
                dueDate: true
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

    const loan = existingRepayment.loan;
    const loanAmount = Number(loan.loanAmount);
    
    // Recalculate running balance for REMAINING repayments
    let runningBalance = loanAmount;
    const updatedRepayments = [];

    for (let repayment of loan.repayments) {
      if (repayment.id === parseInt(id)) {
        // Skip the deleted repayment
        continue;
      }
      
      runningBalance -= Number(repayment.amount);
      updatedRepayments.push({
        id: repayment.id,
        pendingAmount: Math.max(0, runningBalance)
      });
    }

    const loanPendingAmount = updatedRepayments.length > 0 
      ? updatedRepayments[updatedRepayments.length - 1].pendingAmount 
      : loanAmount;

    await prisma.$transaction(async (tx) => {
      // Delete the repayment
      await tx.repayment.delete({
        where: { id: parseInt(id) }
      });

      // Update remaining repayments with new pending amounts
      await Promise.all(
        updatedRepayments.map(repayment => 
          tx.repayment.update({
            where: { id: repayment.id },
            data: { pendingAmount: repayment.pendingAmount }
          })
        )
      );

      // Update loan pending amount
      await tx.loan.update({
        where: { id: existingRepayment.loanId },
        data: { pendingAmount: loanPendingAmount }
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