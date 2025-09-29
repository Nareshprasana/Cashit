/* -----------------------------------------------------------------
   LoanTable.jsx   (your original file – now with the extra filter)
----------------------------------------------------------------- */
"use client";

import React, { useMemo, useState } from "react";
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

/* ------------------- STATUS BADGE (unchanged) ------------------- */
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

/* -------------------------------------------------
   NEW PROP: selectedCustomerCode
   (string | undefined) – the code of the customer that was
   chosen in the form. If it’s undefined we show *all* loans,
   otherwise we keep only the loans belonging to that code.
------------------------------------------------- */
const LoanTable = ({
  loans = [],
  loading,
  selectedCustomerCode, // <-- NEW
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("loanDate");
  const [sortDirection, setSortDirection] = useState("desc");

  /* ------------ CRUD DIALOG STATE (unchanged) ------------ */
  const [showDialog, setShowDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerCode: "",
    aadhar: "",
    loanAmount: "",
    pendingAmount: "",
    rate: "",
    loanDate: new Date().toISOString().split("T")[0],
  });

  /* ------------ OPEN / CLOSE DIALOG (unchanged) ------------ */
  const openDialog = (loan = null) => {
    setEditingLoan(loan);
    if (loan) {
      setForm({
        customerName: loan.customer?.name || "",
        customerCode: loan.customer?.customerCode || "",
        aadhar: loan.customer?.aadhar || "",
        loanAmount: loan.loanAmount || "",
        pendingAmount: loan.pendingAmount || "",
        rate: loan.rate || "",
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
      // TODO: call API PUT /api/loans/:id
    } else {
      console.log("Create new loan:", form);
      // TODO: call API POST /api/loans
    }
    setShowDialog(false);
  };

  const handleDelete = (loan) => {
    if (
      confirm(
        `Are you sure you want to delete loan ${loan.customer?.customerCode}?`
      )
    ) {
      console.log("Delete loan:", loan.id);
      // TODO: call API DELETE /api/loans/:id
    }
  };

  /* ------------------- SORTING ------------------- */
  const sortedLoans = [...loans].sort((a, b) => {
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

  /* ------------------- FILTERING ------------------- */
  const filteredLoans = sortedLoans.filter((loan) => {
    /* ---- 1️⃣  FILTER BY SELECTED CUSTOMER CODE ---- */
    if (selectedCustomerCode) {
      const loanCode = loan.customer?.customerCode || loan.customer?.code;
      if (loanCode !== selectedCustomerCode) return false;
    }

    /* ---- 2️⃣  GLOBAL TEXT SEARCH ---- */
    const custName = loan.customer?.name || "";
    const custCode = loan.customer?.customerCode || loan.customer?.code || "";
    const aadhar = loan.customer?.aadhar || "";

    const matchesGlobal =
      !globalFilter ||
      custName.toLowerCase().includes(globalFilter.toLowerCase()) ||
      custCode.toLowerCase().includes(globalFilter.toLowerCase()) ||
      aadhar.includes(globalFilter);

    /* ---- 3️⃣  STATUS FILTER (hard‑coded to ACTIVE) ---- */
    const loanStatus = loan.status || (loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED");
    const matchesStatus = loanStatus === "ACTIVE";

    /* ---- 4️⃣  DATE RANGE FILTER ---- */
    const loanDate = loan.loanDate ? new Date(loan.loanDate) : null;
    const matchesFrom = !fromDate || (loanDate && loanDate >= new Date(fromDate));
    const matchesTo = !toDate || (loanDate && loanDate <= new Date(toDate));

    return matchesGlobal && matchesStatus && matchesFrom && matchesTo;
  });

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

  /* ------------------- PAGE WINDOW (for numbered pagination) ------------------- */
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
      {/* ----- Header / Add button ----- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Loan Management
          </h1>
          <p className="text-gray-600">Manage and track all customer loans</p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add New Loan
        </Button>
      </div>

      {/* ----- Stats cards (unchanged) ----- */}
      {/* ... (your existing cards) ... */}

      {/* ----- Search & Filters ----- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Loan Records</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {showFilters && <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* ----- Global search ----- */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, code, or Aadhar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* ----- Advanced filters (only show when toggled) ----- */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
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
            </div>
          )}

          {/* ----- Loan table ----- */}
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

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
            </Table>
          </div>

          {/* ----- Pagination ----- */}
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

          {/* ----- Empty state ----- */}
          {filteredLoans.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No loans found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* -----------------------------------------------------------------
          EDIT / CREATE DIALOG (kept exactly as you already had)
         ----------------------------------------------------------------- */}
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

          {/* ...form fields (same as before)... */}
          {/* (omitted for brevity – keep exactly your existing inputs) */}

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
    </div>
  );
};

export default LoanTable;
