import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all repayments
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const repayments = await prisma.repayment.findMany({
      where: customerId ? { loan: { customerId } } : undefined,
      orderBy: { createdAt: "desc" },
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

    // Group repayments by loan to calculate consistent pending amounts
    const loansMap = new Map();
    
    // First pass: calculate total paid per loan and find loan details
    repayments.forEach(repayment => {
      const loanId = repayment.loanId;
      if (!loansMap.has(loanId)) {
        loansMap.set(loanId, {
          loan: repayment.loan,
          totalPaid: 0,
          repayments: []
        });
      }
      const loanData = loansMap.get(loanId);
      loanData.totalPaid += Number(repayment.amount);
      loanData.repayments.push(repayment);
    });

    // Second pass: transform data with consistent pending amounts
    const transformedRepayments = repayments.map((repayment) => {
      const loan = repayment.loan;
      const customer = loan.customer;
      const loanData = loansMap.get(repayment.loanId);
      
      // Calculate consistent pending amount for all repayments of this loan
      const totalPaid = loanData.totalPaid;
      const loanAmount = Number(loan.loanAmount);
      const pendingAmount = Math.max(0, loanAmount - totalPaid);

      // Calculate status based on payment and dates
      let status = "PENDING";
      const today = new Date();
      const dueDate = new Date(repayment.dueDate);
      
      if (repayment.repaymentDate) {
        status = "PAID";
      } else if (dueDate < today) {
        status = "OVERDUE";
      }

      return {
        // Core repayment fields
        id: repayment.id.toString(),
        loanId: repayment.loanId,
        amount: repayment.amount,
        dueDate: repayment.dueDate.toISOString(),
        repaymentDate: repayment.repaymentDate?.toISOString() || null,
        paymentMethod: repayment.paymentMethod,
        createdAt: repayment.createdAt.toISOString(),
        status: status,

        // Customer data
        customer: {
          id: customer.id,
          customerCode: customer.customerCode,
          customerName: customer.customerName,
          aadhar: customer.aadhar,
          areaId: customer.areaId,
          area: customer.area
        },

        // Loan data
        loan: {
          id: loan.id,
          amount: loan.amount,
          loanAmount: loan.loanAmount,
          pendingAmount: pendingAmount, // Consistent for all repayments of this loan
          interestAmount: loan.interestAmount,
          status: loan.status
        },

        // Backward compatibility
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        loanAmount: loan.loanAmount,
        pendingAmount: pendingAmount // Consistent for all repayments of this loan
      };
    });

    return NextResponse.json(transformedRepayments);
  } catch (error) {
    console.error("Repayment GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch repayments", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new repayment
export async function POST(req) {
  try {
    const body = await req.json();
    const { loanId, amount, dueDate, paymentMethod } = body;

    if (!loanId || amount === undefined || !dueDate || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || isNaN(Date.parse(dueDate))) {
      return NextResponse.json(
        { message: "Invalid data format" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ["CASH", "UPI", "BANK_TRANSFER", "OTHER"];
    const pm = paymentMethod.toUpperCase();
    if (!validPaymentMethods.includes(pm)) {
      return NextResponse.json(
        { message: "Invalid payment method" },
        { status: 400 }
      );
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        repayments: {
          select: { amount: true },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 400 });
    }

    const repaymentAmount = parseFloat(amount);
    const totalPaid = loan.repayments.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

    // Calculate new pending amount
    const newPending = Math.max(
      0,
      Number(loan.loanAmount) - (totalPaid + repaymentAmount)
    );

    const result = await prisma.$transaction(async (tx) => {
      // Update loan pending amount
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: { pendingAmount: newPending },
      });

      // Create repayment
      const repayment = await tx.repayment.create({
        data: {
          loanId,
          amount: repaymentAmount,
          pendingAmount: newPending,
          dueDate: new Date(dueDate),
          paymentMethod: pm,
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

      return { repayment, updatedLoan };
    });

    // Transform the response to match GET structure
    const repayment = result.repayment;
    const loanData = repayment.loan;
    const customer = loanData.customer;
    
    // Calculate the actual total paid for this loan (including the new repayment)
    const actualTotalPaid = loanData.repayments.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const actualPendingAmount = Math.max(0, Number(loanData.loanAmount) - actualTotalPaid);
    
    let status = "PENDING";
    const today = new Date();
    const dueDateObj = new Date(repayment.dueDate);
    
    if (repayment.repaymentDate) {
      status = "PAID";
    } else if (dueDateObj < today) {
      status = "OVERDUE";
    }

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
        id: loanData.id,
        amount: loanData.amount,
        loanAmount: loanData.loanAmount,
        pendingAmount: actualPendingAmount, // Use calculated pending amount
        interestAmount: loanData.interestAmount,
        status: loanData.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loanData.loanAmount,
      pendingAmount: actualPendingAmount // Use calculated pending amount
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Repayment POST error:", error);
    return NextResponse.json(
      {
        message: "Failed to create repayment",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update repayment (full update)
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { message: "Repayment ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amount, dueDate, status, notes, paymentMethod } = body;

    // Validate required fields
    if (!amount || !dueDate || !status) {
      return NextResponse.json(
        { message: "Amount, due date, and status are required" },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (paymentMethod) {
      const validPaymentMethods = ["CASH", "UPI", "BANK_TRANSFER", "OTHER"];
      const pm = paymentMethod.toUpperCase();
      if (!validPaymentMethods.includes(pm)) {
        return NextResponse.json(
          { message: "Invalid payment method" },
          { status: 400 }
        );
      }
    }

    const repaymentId = parseInt(id);

    // Check if repayment exists
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
      include: {
        loan: {
          include: {
            repayments: true
          }
        }
      }
    });

    if (!existingRepayment) {
      return NextResponse.json(
        { message: "Repayment not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update the repayment
      const updatedRepayment = await tx.repayment.update({
        where: { id: repaymentId },
        data: {
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          status: status.toUpperCase(),
          notes: notes || null,
          paymentMethod: paymentMethod ? paymentMethod.toUpperCase() : existingRepayment.paymentMethod,
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

      // Recalculate loan pending amount
      const loanRepayments = await tx.repayment.findMany({
        where: { loanId: existingRepayment.loanId },
        select: { amount: true }
      });

      const totalPaid = loanRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const loanAmount = Number(existingRepayment.loan.loanAmount);
      const pendingAmount = Math.max(0, loanAmount - totalPaid);

      // Update loan pending amount
      await tx.loan.update({
        where: { id: existingRepayment.loanId },
        data: { pendingAmount }
      });

      return { updatedRepayment, pendingAmount };
    });

    // Transform response
    const repayment = result.updatedRepayment;
    const loanData = repayment.loan;
    const customer = loanData.customer;

    const response = {
      id: repayment.id.toString(),
      loanId: repayment.loanId,
      amount: repayment.amount,
      dueDate: repayment.dueDate.toISOString(),
      repaymentDate: repayment.repaymentDate?.toISOString() || null,
      paymentMethod: repayment.paymentMethod,
      createdAt: repayment.createdAt.toISOString(),
      status: repayment.status,
      notes: repayment.notes,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area
      },
      loan: {
        id: loanData.id,
        amount: loanData.amount,
        loanAmount: loanData.loanAmount,
        pendingAmount: result.pendingAmount,
        interestAmount: loanData.interestAmount,
        status: loanData.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loanData.loanAmount,
      pendingAmount: result.pendingAmount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Repayment PUT error:", error);
    return NextResponse.json(
      {
        message: "Failed to update repayment",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (mainly for amount)
export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { message: "Repayment ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { message: "Valid amount is required" },
        { status: 400 }
      );
    }

    const repaymentId = parseInt(id);

    // Check if repayment exists
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
      include: {
        loan: {
          include: {
            repayments: true
          }
        }
      }
    });

    if (!existingRepayment) {
      return NextResponse.json(
        { message: "Repayment not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update the repayment amount
      const updatedRepayment = await tx.repayment.update({
        where: { id: repaymentId },
        data: {
          amount: parseFloat(amount),
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

      // Recalculate loan pending amount
      const loanRepayments = await tx.repayment.findMany({
        where: { loanId: existingRepayment.loanId },
        select: { amount: true }
      });

      const totalPaid = loanRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
      const loanAmount = Number(existingRepayment.loan.loanAmount);
      const pendingAmount = Math.max(0, loanAmount - totalPaid);

      // Update loan pending amount
      await tx.loan.update({
        where: { id: existingRepayment.loanId },
        data: { pendingAmount }
      });

      return { updatedRepayment, pendingAmount };
    });

    // Transform response
    const repayment = result.updatedRepayment;
    const loanData = repayment.loan;
    const customer = loanData.customer;

    const response = {
      id: repayment.id.toString(),
      loanId: repayment.loanId,
      amount: repayment.amount,
      dueDate: repayment.dueDate.toISOString(),
      repaymentDate: repayment.repaymentDate?.toISOString() || null,
      paymentMethod: repayment.paymentMethod,
      createdAt: repayment.createdAt.toISOString(),
      status: repayment.status,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area
      },
      loan: {
        id: loanData.id,
        amount: loanData.amount,
        loanAmount: loanData.loanAmount,
        pendingAmount: result.pendingAmount,
        interestAmount: loanData.interestAmount,
        status: loanData.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loanData.loanAmount,
      pendingAmount: result.pendingAmount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Repayment PATCH error:", error);
    return NextResponse.json(
      {
        message: "Failed to update repayment amount",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove repayment
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { message: "Repayment ID is required" },
        { status: 400 }
      );
    }

    const repaymentId = parseInt(id);

    // Check if repayment exists
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
      include: {
        loan: {
          include: {
            repayments: true
          }
        }
      }
    });

    if (!existingRepayment) {
      return NextResponse.json(
        { message: "Repayment not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete the repayment
      await tx.repayment.delete({
        where: { id: repaymentId }
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
    console.error("Repayment DELETE error:", error);
    return NextResponse.json(
      {
        message: "Failed to delete repayment",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}