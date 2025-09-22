import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Function to calculate interest amount
const calculateInterestAmount = (loanAmount, rate, tenure) => {
  // Simple interest calculation: (Principal * Rate * Time) / 100
  return (loanAmount * rate * tenure) / 100;
};

// 🔹 GET handler (summary OR full list)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary");
    const customerId = searchParams.get("customerId");

    if (summary) {
      // Count active loans (pendingAmount > 0)
      const active = await prisma.loan.count({
        where: { pendingAmount: { gt: 0 } },
      });

      return NextResponse.json({ active }, { status: 200 });
    }

    // Otherwise return full loan list with customer details
    const loans = await prisma.loan.findMany({
      where: customerId ? { customerId } : {},
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            customerName: true,
            aadhar: true,
            mobile: true,
            photoUrl: true,
          },
        },
        repayments: {
          select: { 
            id: true,
            amount: true, 
            repaymentDate: true,
            createdAt: true
          },
          orderBy: { repaymentDate: "desc" }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Format loans for frontend with calculated values
    const formattedLoans = loans.map(loan => {
      const totalPaid = loan.repayments.reduce((sum, repayment) => {
        return sum + Number(repayment.amount || 0);
      }, 0);
      
      const pendingAmount = Math.max(Number(loan.amount || 0) - totalPaid, 0);
      
      return {
        id: loan.id,
        customer: {
          id: loan.customer.id,
          name: loan.customer.customerName,
          customerCode: loan.customer.customerCode,
          aadhar: loan.customer.aadhar,
          mobile: loan.customer.mobile,
          photoUrl: loan.customer.photoUrl,
        },
        loanAmount: Number(loan.amount),
        pendingAmount,
        totalPaid,
        rate: loan.rate || 0,
        loanDate: loan.loanDate,
        tenure: loan.tenure,
        status: pendingAmount > 0 ? "ACTIVE" : "CLOSED",
        repayments: loan.repayments,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      };
    });

    return NextResponse.json(formattedLoans, { status: 200 });
  } catch (error) {
    console.error("Loan fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch loans", details: error.message },
      { status: 500 }
    );
  }
}

// 🔹 POST handler (for creating a loan)
export async function POST(req) {
  let rawData;

  try {
    rawData = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format" },
      { status: 400 }
    );
  }

  const data = rawData;

  if (!data.customerId) {
    return NextResponse.json(
      { error: "customerId is required" },
      { status: 400 }
    );
  }

  const amount = Number(data.amount);
  const rate = Number(data.rate);
  const tenure = Number(data.tenure);
  const loanAmount = Number(data.loanAmount || amount);
  const pendingAmount = Number(data.pendingAmount || loanAmount);

  if ([amount, rate, tenure, loanAmount, pendingAmount].some((val) => isNaN(val))) {
    return NextResponse.json(
      { error: "One or more numeric values are invalid" },
      { status: 400 }
    );
  }

  const loanDate = new Date(data.loanDate);
  if (isNaN(loanDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid loan date" },
      { status: 400 }
    );
  }

  const interestAmount = calculateInterestAmount(loanAmount, rate, tenure);
  const documentUrl = data.documentUrl || null;

  try {
    const existingActiveLoan = await prisma.loan.findFirst({
      where: {
        customerId: data.customerId,
        pendingAmount: { gt: 0 },
      },
    });

    if (existingActiveLoan) {
      return NextResponse.json(
        { error: "already loan is in active state" },
        { status: 409 }
      );
    }

    const loan = await prisma.loan.create({
      data: {
        area: data.area || null,
        customerId: data.customerId,
        amount,
        rate,
        tenure,
        loanDate,
        loanAmount,
        pendingAmount,
        interestAmount,
        documentUrl,
      },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            customerName: true,
            aadhar: true,
            mobile: true,
            photoUrl: true,
          },
        },
      },
    });

    // Format the response to match frontend expectations
    const formattedLoan = {
      id: loan.id,
      customer: {
        id: loan.customer.id,
        name: loan.customer.customerName,
        customerCode: loan.customer.customerCode,
        aadhar: loan.customer.aadhar,
        mobile: loan.customer.mobile,
        photoUrl: loan.customer.photoUrl,
      },
      loanAmount: Number(loan.amount),
      pendingAmount: Number(loan.pendingAmount),
      totalPaid: 0,
      rate: loan.rate || 0,
      loanDate: loan.loanDate,
      tenure: loan.tenure,
      status: loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED",
      repayments: [],
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };

    return NextResponse.json({ success: true, loan: formattedLoan }, { status: 201 });
  } catch (error) {
    console.error("Loan creation error:", error);
    return NextResponse.json(
      { error: "Failed to create loan", details: error.message },
      { status: 500 }
    );
  }
}

// 🔹 PUT handler (for updating a loan)
export async function PUT(req) {
  let rawData;

  try {
    rawData = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format" },
      { status: 400 }
    );
  }

  const data = rawData;

  if (!data.id) {
    return NextResponse.json(
      { error: "Loan ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check if loan exists
    const existingLoan = await prisma.loan.findUnique({
      where: { id: data.id },
    });

    if (!existingLoan) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    
    if (data.amount !== undefined) updateData.amount = Number(data.amount);
    if (data.rate !== undefined) updateData.rate = Number(data.rate);
    if (data.tenure !== undefined) updateData.tenure = Number(data.tenure);
    if (data.loanAmount !== undefined) updateData.loanAmount = Number(data.loanAmount);
    if (data.pendingAmount !== undefined) updateData.pendingAmount = Number(data.pendingAmount);
    if (data.loanDate !== undefined) updateData.loanDate = new Date(data.loanDate);
    if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;
    if (data.area !== undefined) updateData.area = data.area;

    // Recalculate interest if relevant fields changed
    if (data.loanAmount !== undefined || data.rate !== undefined || data.tenure !== undefined) {
      const loanAmount = data.loanAmount !== undefined ? Number(data.loanAmount) : existingLoan.loanAmount;
      const rate = data.rate !== undefined ? Number(data.rate) : existingLoan.rate;
      const tenure = data.tenure !== undefined ? Number(data.tenure) : existingLoan.tenure;
      updateData.interestAmount = calculateInterestAmount(loanAmount, rate, tenure);
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: data.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            customerName: true,
            aadhar: true,
            mobile: true,
            photoUrl: true,
          },
        },
        repayments: {
          select: { 
            id: true,
            amount: true, 
            repaymentDate: true,
            createdAt: true
          },
          orderBy: { repaymentDate: "desc" }
        },
      },
    });

    // Calculate total paid from repayments
    const totalPaid = updatedLoan.repayments.reduce((sum, repayment) => {
      return sum + Number(repayment.amount || 0);
    }, 0);

    // Format the response
    const formattedLoan = {
      id: updatedLoan.id,
      customer: {
        id: updatedLoan.customer.id,
        name: updatedLoan.customer.customerName,
        customerCode: updatedLoan.customer.customerCode,
        aadhar: updatedLoan.customer.aadhar,
        mobile: updatedLoan.customer.mobile,
        photoUrl: updatedLoan.customer.photoUrl,
      },
      loanAmount: Number(updatedLoan.amount),
      pendingAmount: Number(updatedLoan.pendingAmount),
      totalPaid,
      rate: updatedLoan.rate || 0,
      loanDate: updatedLoan.loanDate,
      tenure: updatedLoan.tenure,
      status: updatedLoan.pendingAmount > 0 ? "ACTIVE" : "CLOSED",
      repayments: updatedLoan.repayments,
      createdAt: updatedLoan.createdAt,
      updatedAt: updatedLoan.updatedAt,
    };

    return NextResponse.json({ success: true, loan: formattedLoan }, { status: 200 });
  } catch (error) {
    console.error("Loan update error:", error);
    return NextResponse.json(
      { error: "Failed to update loan", details: error.message },
      { status: 500 }
    );
  }
}

// 🔹 DELETE handler (for deleting a loan)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Loan ID is required" },
        { status: 400 }
      );
    }

    // Check if loan exists
    const existingLoan = await prisma.loan.findUnique({
      where: { id },
      include: {
        repayments: true,
      },
    });

    if (!existingLoan) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    // Check if loan has repayments
    if (existingLoan.repayments && existingLoan.repayments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete loan with existing repayments" },
        { status: 400 }
      );
    }

    // Delete the loan
    await prisma.loan.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Loan deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Loan deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete loan", details: error.message },
      { status: 500 }
    );
  }
}