import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all repayments
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const repayments = await prisma.repayment.findMany({
      where: customerId ? { loan: { customerId } } : undefined,
      orderBy: { dueDate: "asc" },
      include: {
        loan: {
          include: {
            customer: {
              select: {
                id: true,
                customerCode: true,
                customerName: true,
                aadhar: true,
                areaId: true,
                photoUrl: true,
                area: true,
              },
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

    // Calculate running balances for all loans
    const loansMap = new Map();
    
    // First pass: organize repayments by loan and calculate running balances
    repayments.forEach(repayment => {
      const loanId = repayment.loanId;
      if (!loansMap.has(loanId)) {
        loansMap.set(loanId, {
          loan: repayment.loan,
          repayments: [],
          runningBalance: Number(repayment.loan.loanAmount)
        });
      }
      
      const loanData = loansMap.get(loanId);
      
      // Calculate running balance for this repayment
      const runningBalance = loanData.runningBalance;
      const newBalance = Math.max(0, runningBalance - Number(repayment.amount));
      
      loanData.repayments.push({
        ...repayment,
        calculatedPendingAmount: runningBalance
      });
      
      loanData.runningBalance = newBalance;
    });

    // Transform data with consistent pending amounts
    const transformedRepayments = repayments.map((repayment) => {
      const loan = repayment.loan;
      const customer = loan.customer;
      const loanData = loansMap.get(repayment.loanId);
      
      // Find this repayment in the calculated data
      const calculatedRepayment = loanData.repayments.find(r => r.id === repayment.id);
      const pendingAmount = calculatedRepayment?.calculatedPendingAmount || 0;

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
        pendingAmount: pendingAmount,

        // Customer data
        customer: {
          id: customer.id,
          customerCode: customer.customerCode,
          customerName: customer.customerName,
          aadhar: customer.aadhar,
          areaId: customer.areaId,
          area: customer.area,
          mobile: customer.mobile || "Not Provided",
          photoUrl: customer.photoUrl
        },

        // Loan data
        loan: {
          id: loan.id,
          amount: loan.amount,
          loanAmount: loan.loanAmount,
          pendingAmount: loanData.runningBalance, // Final running balance
          interestAmount: loan.interestAmount,
          status: loan.status
        },

        // Backward compatibility
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        loanAmount: loan.loanAmount,
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
          orderBy: { dueDate: "asc" },
          select: { 
            id: true, 
            amount: true, 
            dueDate: true,
            pendingAmount: true
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 400 });
    }

    const repaymentAmount = parseFloat(amount);
    
    // Calculate running balance for all repayments including the new one
    let runningBalance = Number(loan.loanAmount);
    const updatedRepayments = [];

    // Add existing repayments
    for (const repayment of loan.repayments) {
      runningBalance -= Number(repayment.amount);
      updatedRepayments.push({
        id: repayment.id,
        pendingAmount: Math.max(0, runningBalance)
      });
    }

    // Add new repayment
    runningBalance -= repaymentAmount;
    const newPendingAmount = Math.max(0, runningBalance);

    const result = await prisma.$transaction(async (tx) => {
      // Update all existing repayments with new pending amounts
      await Promise.all(
        updatedRepayments.map(repayment => 
          tx.repayment.update({
            where: { id: repayment.id },
            data: { pendingAmount: repayment.pendingAmount }
          })
        )
      );

      // Update loan pending amount
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: { pendingAmount: newPendingAmount },
      });

      // Create new repayment
      const repayment = await tx.repayment.create({
        data: {
          loanId,
          amount: repaymentAmount,
          pendingAmount: newPendingAmount,
          dueDate: new Date(dueDate),
          paymentMethod: pm,
        },
        include: {
          loan: {
            include: {
              customer: {
                select: {
                  id: true,
                  customerCode: true,
                  customerName: true,
                  aadhar: true,
                  areaId: true,
                  photoUrl: true,
                  area: true,
                },
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

      return { repayment, updatedLoan };
    });

    // Transform the response
    const repayment = result.repayment;
    const loanData = repayment.loan;
    const customer = loanData.customer;
    
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
      pendingAmount: repayment.pendingAmount,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area,
        mobile: customer.mobile || "Not Provided",
        photoUrl: customer.photoUrl
      },
      loan: {
        id: loanData.id,
        amount: loanData.amount,
        loanAmount: loanData.loanAmount,
        pendingAmount: repayment.pendingAmount,
        interestAmount: loanData.interestAmount,
        status: loanData.status
      },
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      aadhar: customer.aadhar,
      loanAmount: loanData.loanAmount,
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

    // Check if repayment exists and get loan data
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
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
        { message: "Repayment not found" },
        { status: 404 }
      );
    }

    const loan = existingRepayment.loan;
    const loanAmount = Number(loan.loanAmount);
    
    // Recalculate running balance for ALL repayments
    let runningBalance = loanAmount;
    const updatedRepayments = [];

    for (let repayment of loan.repayments) {
      if (repayment.id === repaymentId) {
        // Use the updated amount for this repayment
        runningBalance -= Number(amount);
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

    const result = await prisma.$transaction(async (tx) => {
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
        where: { id: existingRepayment.loanId },
        data: { pendingAmount: loanPendingAmount }
      });

      // Update the main repayment
      const updatedRepayment = await tx.repayment.update({
        where: { id: repaymentId },
        data: {
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          status: status.toUpperCase(),
          notes: notes || null,
          paymentMethod: paymentMethod ? paymentMethod.toUpperCase() : existingRepayment.paymentMethod,
          pendingAmount: updatedRepayments.find(r => r.id === repaymentId)?.pendingAmount || 0,
        },
        include: {
          loan: {
            include: {
              customer: {
                select: {
                  id: true,
                  customerCode: true,
                  customerName: true,
                  aadhar: true,
                  areaId: true,
                  photoUrl: true,
                  area: true,
                },
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

      return { updatedRepayment, pendingAmount: loanPendingAmount };
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
      pendingAmount: repayment.pendingAmount,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area,
        mobile: customer.mobile || "Not Provided",
        photoUrl: customer.photoUrl
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

    // Check if repayment exists and get loan data
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
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
        { message: "Repayment not found" },
        { status: 404 }
      );
    }

    const loan = existingRepayment.loan;
    const loanAmount = Number(loan.loanAmount);
    
    // Recalculate running balance for ALL repayments
    let runningBalance = loanAmount;
    const updatedRepayments = [];

    for (let repayment of loan.repayments) {
      if (repayment.id === repaymentId) {
        // Use the updated amount for this repayment
        runningBalance -= Number(amount);
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

    const result = await prisma.$transaction(async (tx) => {
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
        where: { id: existingRepayment.loanId },
        data: { pendingAmount: loanPendingAmount }
      });

      // Update the repayment amount
      const updatedRepayment = await tx.repayment.update({
        where: { id: repaymentId },
        data: {
          amount: parseFloat(amount),
          pendingAmount: updatedRepayments.find(r => r.id === repaymentId)?.pendingAmount || 0,
        },
        include: {
          loan: {
            include: {
              customer: {
                select: {
                  id: true,
                  customerCode: true,
                  customerName: true,
                  aadhar: true,
                  areaId: true,
                  photoUrl: true,
                  area: true,
                },
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

      return { updatedRepayment, pendingAmount: loanPendingAmount };
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
      pendingAmount: repayment.pendingAmount,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        aadhar: customer.aadhar,
        areaId: customer.areaId,
        area: customer.area,
        mobile: customer.mobile || "Not Provided",
        photoUrl: customer.photoUrl
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

    // Check if repayment exists and get loan data
    const existingRepayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
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
        { message: "Repayment not found" },
        { status: 404 }
      );
    }

    const loan = existingRepayment.loan;
    const loanAmount = Number(loan.loanAmount);
    
    // Recalculate running balance for REMAINING repayments
    let runningBalance = loanAmount;
    const updatedRepayments = [];

    for (let repayment of loan.repayments) {
      if (repayment.id === repaymentId) {
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
        where: { id: repaymentId }
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