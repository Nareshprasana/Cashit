/* -----------------------------------------------------------------
   LoanTable.jsx - Fixed Hydration & Overdue Display
----------------------------------------------------------------- */
"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------- CLIENT ONLY WRAPPER ------------------- */
const ClientOnly = ({ children, fallback = null }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient ? children : fallback;
};

/* ------------------- STATUS BADGE ------------------- */
const StatusBadge = ({ status, pendingAmount }) => {
  const actualStatus = status || (pendingAmount > 0 ? "ACTIVE" : "CLOSED");
  switch (actualStatus) {
    case "ACTIVE":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" /> Active
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" /> Completed
        </Badge>
      );
    case "NEVER_OPENED":
      return (
        <Badge variant="outline" className="text-gray-600">
          <XCircle className="h-3 w-3 mr-1" /> Never Opened
        </Badge>
      );
    default:
      return <Badge variant="outline">{actualStatus}</Badge>;
  }
};

/* ------------------- ROBUST HELPER FOR OVERDUE CALCULATION ------------------- */
const calculateOverdueDays = (loanDate, tenure) => {
  if (!loanDate || tenure == null || isNaN(Number(tenure))) {
    return null;
  }

  try {
    let startDate;
    if (typeof loanDate === 'string' || typeof loanDate === 'number') {
      startDate = new Date(loanDate);
    } else if (loanDate instanceof Date) {
      startDate = loanDate;
    } else {
      return null;
    }

    if (isNaN(startDate.getTime())) {
      return null;
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(tenure));
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const comparisonEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const timeDiff = today.getTime() - comparisonEndDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff > 0 ? daysDiff : 0;
  } catch (error) {
    return null;
  }
};

/* -------------------------------------------------
   LoanTable Component with Fixed Hydration
------------------------------------------------- */
const LoanTable = ({
  loans = [],
  loading,
  selectedCustomerCode,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [overdueFilter, setOverdueFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("loanDate");
  const [sortDirection, setSortDirection] = useState("desc");

  /* ------------ CRUD DIALOG STATE ------------ */
  const [showDialog, setShowDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerCode: "",
    aadhar: "",
    loanAmount: "",
    pendingAmount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split("T")[0],
  });

  /* ------------ STATS CALCULATION ------------ */
  const stats = useMemo(() => {
    const totalLoans = loans.length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const totalPending = loans.reduce((sum, loan) => sum + (loan.pendingAmount || 0), 0);
    const activeLoans = loans.filter(loan => 
      loan.status === "ACTIVE" || (loan.status === undefined && loan.pendingAmount > 0)
    ).length;

    return {
      totalLoans,
      totalLoanAmount,
      totalPending,
      activeLoans,
    };
  }, [loans]);

  /* 👈 Client-only computed loans with overdue */
  const computedLoans = useMemo(() => {
    return loans.map(loan => {
      const overdueDays = calculateOverdueDays(loan.loanDate, loan.tenure);
      const hasPendingAmount = (loan.pendingAmount || 0) > 0;
      const isPastDueDate = (overdueDays || 0) > 0;
      const isOverdue = hasPendingAmount && isPastDueDate;
      
      return {
        ...loan,
        overdueDays,
        isOverdue
      };
    });
  }, [loans]);

  /* ------------ DIALOG HANDLERS ------------ */
  const openDialog = (loan = null) => {
    setEditingLoan(loan);
    if (loan) {
      setForm({
        customerName: loan.customer?.name || "",
        customerCode: loan.customer?.customerCode || loan.customer?.code || "",
        aadhar: loan.customer?.aadhar || "",
        loanAmount: loan.loanAmount || "",
        pendingAmount: loan.pendingAmount || "",
        rate: loan.rate || "",
        tenure: loan.tenure || "",
        loanDate: loan.loanDate
          ? new Date(loan.loanDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setForm({
        customerName: "",
        customerCode: "",
        aadhar: "",
        loanAmount: "",
        pendingAmount: "",
        rate: "",
        tenure: "",
        loanDate: new Date().toISOString().split("T")[0],
      });
    }
    setShowDialog(true);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (editingLoan) {
      console.log("Update loan:", { id: editingLoan.id, ...form });
    } else {
      console.log("Create new loan:", form);
    }
    setShowDialog(false);
  };

  const handleDelete = (loan) => {
    if (
      confirm(
        `Are you sure you want to delete loan ${loan.customer?.customerCode || loan.customer?.code}?`
      )
    ) {
      console.log("Delete loan:", loan.id);
    }
  };

  /* ------------------- SORTING ------------------- */
  const sortedLoans = [...computedLoans].sort((a, b) => {
    let aValue, bValue;

    if (sortField.includes("customer.")) {
      const field = sortField.split(".")[1];
      aValue = a.customer?.[field] || "";
      bValue = b.customer?.[field] || "";
    } else {
      aValue = a[sortField] || 0;
      bValue = b[sortField] || 0;
    }

    if (typeof aValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  /* ------------------- COMPLETELY SEPARATED FILTERING LOGIC ------------------- */
  const filteredLoans = useMemo(() => {
    return sortedLoans.filter((loan) => {
      // Customer code filter
      if (selectedCustomerCode) {
        const loanCode = loan.customer?.customerCode || loan.customer?.code;
        if (loanCode !== selectedCustomerCode) return false;
      }

      // Global search filter
      const custName = loan.customer?.name || "";
      const custCode = loan.customer?.customerCode || loan.customer?.code || "";
      const aadhar = loan.customer?.aadhar || "";

      const matchesGlobal =
        !globalFilter ||
        custName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        custCode.toLowerCase().includes(globalFilter.toLowerCase()) ||
        aadhar.includes(globalFilter);

      if (!matchesGlobal) return false;

      // Independent status filter
      const loanStatus = loan.status || (loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED");
      const matchesStatus = statusFilter === "ALL" || loanStatus === statusFilter;

      if (!matchesStatus) return false;

      // Date filters
      const loanDate = loan.loanDate ? new Date(loan.loanDate) : null;
      const matchesFrom = !fromDate || (loanDate && loanDate >= new Date(fromDate));
      const matchesTo = !toDate || (loanDate && loanDate <= new Date(toDate + "T23:59:59"));

      if (!matchesFrom || !matchesTo) return false;

      // Completely independent overdue filter
      let matchesOverdue = true;
      if (overdueFilter !== "ALL") {
        if (overdueFilter === "YES") {
          matchesOverdue = loan.isOverdue === true;
        } else if (overdueFilter === "NO") {
          matchesOverdue = loan.isOverdue === false;
        }
      }

      return matchesOverdue;
    });
  }, [sortedLoans, selectedCustomerCode, globalFilter, statusFilter, fromDate, toDate, overdueFilter]);

  /* ------------------- PAGINATION ------------------- */
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /* ------------------- SORT HELPERS ------------------- */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }) =>
    sortField !== field ? (
      <ChevronDown className="h-4 w-4 opacity-50" />
    ) : sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );

  /* ------------------- PAGINATION RENDER ------------------- */
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
      if (start > 2)
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
    }

    for (let p = start; p <= end; p++) {
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
      if (end < totalPages - 1)
        items.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
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

  /* ------------------- LOADING STATE ------------------- */
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

  /* ------------------- MAIN RENDER ------------------- */
  return (
    <div className="p-6 space-y-6">
      {/* ----- Header ----- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Loan Management
          </h1>
          <p className="text-gray-600">Manage and track all customer loans</p>
        </div>
        <ClientOnly>
          <Button 
            onClick={() => openDialog()} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Loan
          </Button>
        </ClientOnly>
      </div>

      {/* ----- Stats Cards ----- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-gray-600">All time loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-gray-600">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalLoanAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-600">Total loan amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalPending.toLocaleString()}</div>
            <p className="text-xs text-gray-600">Amount to be recovered</p>
          </CardContent>
        </Card>
      </div>

      {/* ----- Search & Filters ----- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Loan Records</CardTitle>
            <div className="flex items-center gap-2">
              <ClientOnly>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {showFilters && <X className="h-4 w-4" />}
                </Button>
              </ClientOnly>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* ----- Global Search ----- */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, code, or Aadhar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* ----- Advanced Filters ----- */}
          <ClientOnly
            fallback={
              showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Label className="invisible">Placeholder</Label>
                      <div className="h-10 bg-gray-200 animate-pulse rounded-md" />
                    </div>
                  ))}
                </div>
              )
            }
          >
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="CLOSED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Overdue</Label>
                  <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="YES">Yes</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rows per page</Label>
                  <Select 
                    value={rowsPerPage.toString()} 
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </ClientOnly>

          {/* ----- Customer Filter Notice ----- */}
          <ClientOnly>
            {selectedCustomerCode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Showing loans for customer: <strong>{selectedCustomerCode}</strong>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="h-6 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </ClientOnly>

          {/* ----- Loan Table ----- */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("customer.customerCode")}
                  >
                    <div className="flex items-center gap-1">
                      Code <SortIcon field="customer.customerCode" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("customer.name")}
                  >
                    <div className="flex items-center gap-1">
                      Customer <SortIcon field="customer.name" />
                    </div>
                  </TableHead>

                  <TableHead>Aadhar</TableHead>

                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 text-right"
                    onClick={() => handleSort("loanAmount")}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Loan Amount <SortIcon field="loanAmount" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 text-right"
                    onClick={() => handleSort("pendingAmount")}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Pending <SortIcon field="pendingAmount" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("loanDate")}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date <SortIcon field="loanDate" />
                    </div>
                  </TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>Overdue</TableHead>

                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <ClientOnly
                fallback={
                  <TableBody>
                    {Array.from({ length: Math.min(10, rowsPerPage) }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="animate-pulse">
                        <TableCell><div className="h-4 bg-gray-200 rounded w-16" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-32" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-24" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 bg-gray-200 rounded w-20 inline-block" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 bg-gray-200 rounded w-20 inline-block" /></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded w-20" /></TableCell>
                        <TableCell><div className="h-6 w-20 bg-gray-200 rounded" /></TableCell>
                        <TableCell><div className="h-6 w-24 bg-gray-200 rounded" /></TableCell>
                        <TableCell className="text-right"><div className="h-8 w-16 bg-gray-200 rounded inline-block" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                }
              >
                <TableBody>
                  {paginatedLoans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {loan.customer?.customerCode || loan.customer?.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {loan.customer?.name}
                        </div>
                      </TableCell>
                      <TableCell>{loan.customer?.aadhar}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {loan.loanAmount?.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {loan.pendingAmount?.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {loan.loanDate
                          ? new Date(loan.loanDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={loan.status}
                          pendingAmount={loan.pendingAmount}
                        />
                      </TableCell>
                      <TableCell>
                        {loan.overdueDays !== null ? (
                          loan.isOverdue ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {loan.overdueDays} days
                            </Badge>
                          ) : (
                            <span className="text-green-600 text-xs font-medium">On time</span>
                          )
                        ) : (
                          <span className="text-gray-500 text-xs italic">Missing data</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(loan)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(loan)}
                            className="h-8 w-8 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ClientOnly>
            </Table>
          </div>

          {/* ----- Pagination ----- */}
          <ClientOnly>
            {filteredLoans.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {((currentPage - 1) * rowsPerPage) + 1} to{" "}
                  {Math.min(currentPage * rowsPerPage, filteredLoans.length)} of{" "}
                  {filteredLoans.length} entries
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.max(1, currentPage - 1));
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {renderPageWindow()}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.min(totalPages, currentPage + 1));
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {filteredLoans.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No loans found matching your criteria</p>
                {selectedCustomerCode && (
                  <p className="text-sm mt-2">
                    No loans found for customer code: <strong>{selectedCustomerCode}</strong>
                  </p>
                )}
                {(statusFilter !== "ALL" || overdueFilter !== "ALL") && (
                  <p className="text-sm mt-2">
                    Current filters: 
                    {statusFilter !== "ALL" && ` Status: ${statusFilter}`}
                    {overdueFilter !== "ALL" && ` Overdue: ${overdueFilter}`}
                  </p>
                )}
                <p className="text-sm mt-2">
                  Total loans available: {loans.length}
                </p>
              </div>
            )}
          </ClientOnly>
        </CardContent>
      </Card>

      {/* ----- Edit/Create Dialog ----- */}
      <ClientOnly>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingLoan ? "Edit Loan Details" : "Create New Loan"}
              </DialogTitle>
              <DialogDescription>
                {editingLoan ? "Update the loan information below." : "Fill in the details to create a new loan."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerCode">Customer Code</Label>
                <Input
                  id="customerCode"
                  name="customerCode"
                  value={form.customerCode}
                  onChange={handleChange}
                  placeholder="Enter customer code"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhar">Aadhar Number</Label>
                <Input
                  id="aadhar"
                  name="aadhar"
                  value={form.aadhar}
                  onChange={handleChange}
                  placeholder="Enter Aadhar number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    name="loanAmount"
                    type="number"
                    value={form.loanAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pendingAmount">Pending Amount</Label>
                  <Input
                    id="pendingAmount"
                    name="pendingAmount"
                    type="number"
                    value={form.pendingAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate (%)</Label>
                  <Input
                    id="rate"
                    name="rate"
                    type="number"
                    value={form.rate}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure (months)</Label>
                  <Input
                    id="tenure"
                    name="tenure"
                    type="number"
                    value={form.tenure}
                    onChange={handleChange}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanDate">Loan Date</Label>
                <Input
                  id="loanDate"
                  name="loanDate"
                  type="date"
                  value={form.loanDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                {editingLoan ? "Update Loan" : "Create Loan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </ClientOnly>
    </div>
  );
};

export default LoanTable;