"use client";
import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  Eye,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Status badge component
const StatusBadge = ({ status, pendingAmount, loanAmount }) => {
  // Determine status based on pending amount if status is not explicitly provided
  const actualStatus = status || (pendingAmount > 0 ? "ACTIVE" : "CLOSED");
  
  switch (actualStatus) {
    case "ACTIVE":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "NEVER_OPENED":
      return (
        <Badge variant="outline" className="text-gray-600">
          <XCircle className="h-3 w-3 mr-1" />
          Never Opened
        </Badge>
      );
    default:
      return <Badge variant="outline">{actualStatus}</Badge>;
  }
};

const LoanTable = ({ loans, loading }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter loans based on search criteria
  const filteredLoans = loans.filter((loan) => {
    const customerName = loan.customer?.name || "";
    const customerCode = loan.customer?.customerCode || "";
    const aadhar = loan.customer?.aadhar || "";

    const matchesGlobal =
      !globalFilter ||
      customerName.toLowerCase().includes(globalFilter.toLowerCase()) ||
      customerCode.toLowerCase().includes(globalFilter.toLowerCase()) ||
      aadhar.includes(globalFilter);

    // Determine status based on pending amount
    const loanStatus = loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED";
    const matchesStatus = !statusFilter || loanStatus === statusFilter;

    const loanDate = loan.loanDate ? new Date(loan.loanDate) : null;
    const matchesFromDate =
      !fromDate || (loanDate && loanDate >= new Date(fromDate));
    const matchesToDate =
      !toDate || (loanDate && loanDate <= new Date(toDate));

    return matchesGlobal && matchesStatus && matchesFromDate && matchesToDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLoans.length / rowsPerPage) || 1;
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Render pagination controls
  const renderPageWindow = () => {
    const items = [];
    const maxButtons = 5;
    const start = Math.max(
      1,
      Math.min(
        currentPage - Math.floor(maxButtons / 2),
        Math.max(1, totalPages - maxButtons + 1)
      )
    );
    const end = Math.min(totalPages, start + maxButtons - 1);

    if (start > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (start > 2) {
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let p = start; p <= end; p += 1) {
      items.push(
        <PaginationItem key={p}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(p);
            }}
            isActive={currentPage === p}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages);
            }}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                {showFilters ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              {(globalFilter || statusFilter || fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGlobalFilter("");
                    setStatusFilter("");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Main search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name, code, or Aadhar number..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Completed</option>
                    <option value="NEVER_OPENED">Never Opened</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredLoans.length}</span> of{" "}
          <span className="font-medium">{loans.length}</span> loans
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Rows per page:</Label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Customer Code</th>
                  <th className="text-left p-3 font-medium">Aadhar</th>
                  <th className="text-left p-3 font-medium">Loan Amount</th>
                  <th className="text-left p-3 font-medium">Pending Amount</th>
                  <th className="text-left p-3 font-medium">Interest Rate</th>
                  <th className="text-left p-3 font-medium">Loan Date</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <User className="h-12 w-12 text-gray-300 mb-2" />
                        <p>No loans found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {loan.customer?.photoUrl ? (
                            <img
                              src={loan.customer.photoUrl}
                              alt="Customer"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium">
                            {loan.customer?.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded">
                          {loan.customer?.customerCode || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">{loan.customer?.aadhar || "N/A"}</td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                          ₹{Number(loan.loanAmount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                          ₹{Number(loan.pendingAmount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-1 text-gray-500" />
                          {Number(loan.rate || 0).toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {loan.loanDate
                            ? new Date(loan.loanDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge 
                          status={loan.status} 
                          pendingAmount={loan.pendingAmount} 
                          loanAmount={loan.loanAmount} 
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View loan details
                              console.log("View loan:", loan.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table Pagination Controls */}
      {filteredLoans.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {renderPageWindow()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  aria-disabled={currentPage === totalPages || totalPages === 0}
                  className={
                    currentPage === totalPages || totalPages === 0
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default LoanTable;