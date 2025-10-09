/* -----------------------------------------------------------------
   LoanTable.jsx - Fixed Hydration & Overdue Display with Working API
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
  Upload,
  FileText,
  Download,
  Save,
  FileEdit,
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

/* ------------------- OVERDUE BADGE ------------------- */
const OverdueBadge = ({ isOverdue, overdueDays }) => {
  if (isOverdue) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Overdue {overdueDays} days
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <CheckCircle className="h-3 w-3 text-green-600" />
      On Time
    </Badge>
  );
};

/* ------------------- DOCUMENT BADGE ------------------- */
const DocumentBadge = ({ documentUrl }) => {
  if (documentUrl) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <FileText className="h-3 w-3 mr-1" /> Document
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-gray-500">
      <FileText className="h-3 w-3 mr-1" /> No Document
    </Badge>
  );
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
   LoanTable Component with Fixed API Integration
------------------------------------------------- */
const LoanTable = ({
  loans = [],
  loading,
  selectedCustomerCode,
  onLoanUpdate, // Add this prop for state updates
  onLoanDelete, // Add this prop for delete operations
  onLoanCreate, // Add this prop for create operations
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

  /* ------------ COMPREHENSIVE EDIT DIALOG STATE ------------ */
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  
  /* ------------ LOAN DETAILS FORM STATE ------------ */
  const [form, setForm] = useState({
    customerName: "",
    customerCode: "",
    aadhar: "",
    loanAmount: "",
    pendingAmount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    customerId: "", // Add customerId for API calls
  });

  /* ------------ DOCUMENT STATE ------------ */
  const [documentFile, setDocumentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ------------ STATS CALCULATION ------------ */
  const stats = useMemo(() => {
    const totalLoans = loans.length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const totalPending = loans.reduce((sum, loan) => sum + (loan.pendingAmount || 0), 0);
    const activeLoans = loans.filter(loan => 
      loan.status === "ACTIVE" || (loan.status === undefined && loan.pendingAmount > 0)
    ).length;
    const loansWithDocuments = loans.filter(loan => loan.documentUrl).length;

    return {
      totalLoans,
      totalLoanAmount,
      totalPending,
      activeLoans,
      loansWithDocuments,
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

  /* ------------ COMPREHENSIVE EDIT DIALOG HANDLER ------------ */
  const openEditDialog = (loan = null) => {
    setEditingLoan(loan);
    setActiveTab("details");
    
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
        status: loan.status || (loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED"),
        customerId: loan.customerId || "",
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
        status: "ACTIVE",
        customerId: "",
      });
    }
    
    // Reset document state
    setDocumentFile(null);
    setPreviewUrl(null);
    
    setShowEditDialog(true);
  };

  /* ------------ FORM HANDLERS ------------ */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ------------ API HANDLERS ------------ */
  const handleSaveLoanDetails = async () => {
    setIsSaving(true);
    try {
      let response;
      
      if (editingLoan) {
        // UPDATE existing loan
        const loanData = {
          id: editingLoan.id,
          amount: Number(form.loanAmount),
          rate: Number(form.rate),
          tenure: Number(form.tenure),
          loanDate: form.loanDate,
          // Add other fields that your backend expects
        };

        response = await fetch("/api/loans", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loanData),
        });
      } else {
        // CREATE new loan
        const loanData = {
          customerId: form.customerId, // You need to get this from somewhere
          amount: Number(form.loanAmount),
          rate: Number(form.rate),
          tenure: Number(form.tenure),
          loanDate: form.loanDate,
          area: form.area || "", // Add if you have area field
        };

        response = await fetch("/api/loans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loanData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        toast.success(editingLoan ? "Loan updated successfully!" : "Loan created successfully!");
        
        // Update parent component state
        if (editingLoan && onLoanUpdate) {
          onLoanUpdate(result.loan);
        } else if (!editingLoan && onLoanCreate) {
          onLoanCreate(result.loan);
        }
        
        setShowEditDialog(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Operation failed");
      }
    } catch (error) {
      toast.error(`Failed to save loan: ${error.message}`);
      console.error("Loan save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!editingLoan) return;

    if (!confirm(`Are you sure you want to delete loan ${editingLoan.customer?.customerCode || editingLoan.customer?.code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/loans?id=${editingLoan.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Loan deleted successfully!");
        
        // Update parent component state
        if (onLoanDelete) {
          onLoanDelete(editingLoan.id);
        }
        
        setShowEditDialog(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }
    } catch (error) {
      toast.error(`Failed to delete loan: ${error.message}`);
      console.error("Loan delete error:", error);
    }
  };

  /* ------------ VERCEL BLOB DOCUMENT HANDLERS ------------ */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5 MB");
      return;
    }

    setDocumentFile(file);
    
    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setDocumentFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleDocumentUpload = async () => {
    if (!documentFile || !editingLoan) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", documentFile);
      formData.append("loanId", editingLoan.id);

      // Use the correct PUT endpoint for document upload
      const response = await fetch("/api/loans", {
        method: "PUT",
        body: formData,
        // Don't set Content-Type header for FormData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Document uploaded successfully!");
        setDocumentFile(null);
        setPreviewUrl(null);
        
        // Update parent component state
        if (onLoanUpdate && result.loan) {
          onLoanUpdate(result.loan);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (error) {
      toast.error(`Failed to upload document: ${error.message}`);
      console.error("Document upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = (loan) => {
    if (!loan.documentUrl) {
      toast.error("No document available");
      return;
    }
    
    let documentUrl = loan.documentUrl;
    
    // Handle both Vercel Blob URLs and local paths
    if (documentUrl.startsWith('/uploads/')) {
      // Convert local path to full URL for Vercel deployment
      documentUrl = `${window.location.origin}${documentUrl}`;
    }
    // If it's already a full URL (Vercel Blob), use it directly
    
    window.open(documentUrl, "_blank");
  };

  const handleDownloadDocument = async (loan) => {
    if (!loan.documentUrl) {
      toast.error("No document available for download");
      return;
    }

    try {
      let documentUrl = loan.documentUrl;
      
      // Handle both Vercel Blob URLs and local paths
      if (documentUrl.startsWith('/uploads/')) {
        // Convert local path to full URL for Vercel deployment
        documentUrl = `${window.location.origin}${documentUrl}`;
      }
      
      // For Vercel Blob, create a download link
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Get file extension from URL or content type
      const fileExtension = loan.documentUrl.split('.').pop() || 'pdf';
      a.download = `loan-document-${loan.customer?.customerCode || loan.customer?.code}-${Date.now()}.${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download document");
      console.error("Document download error:", error);
    }
  };

  const handleRemoveDocument = async (loan) => {
    if (!confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      // Use PUT request with null documentUrl to remove the document
      const response = await fetch("/api/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: loan.id,
          documentUrl: null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Document removed successfully!");
        
        // Update parent component state
        if (onLoanUpdate && result.loan) {
          onLoanUpdate(result.loan);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Removal failed");
      }
    } catch (error) {
      toast.error(`Failed to remove document: ${error.message}`);
      console.error("Document removal error:", error);
    }
  };

  /* ------------ QUICK ACTIONS (for table row buttons) ------------ */
  const handleQuickDelete = async (loan) => {
    if (!confirm(`Are you sure you want to delete loan ${loan.customer?.customerCode || loan.customer?.code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/loans?id=${loan.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Loan deleted successfully!");
        
        // Update parent component state
        if (onLoanDelete) {
          onLoanDelete(loan.id);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }
    } catch (error) {
      toast.error(`Failed to delete loan: ${error.message}`);
      console.error("Quick delete error:", error);
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
        if (overdueFilter === "OVERDUE") {
          matchesOverdue = loan.isOverdue === true;
        } else if (overdueFilter === "ON_TIME") {
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

  /* Helper to display filter value */
  const getOverdueFilterDisplay = (value) => {
    switch (value) {
      case "OVERDUE": return "Overdue";
      case "ON_TIME": return "On Time";
      default: return "All";
    }
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
            onClick={() => openEditDialog()} 
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
            <CardTitle className="text-sm font-medium">With Documents</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loansWithDocuments}</div>
            <p className="text-xs text-gray-600">Loans with documents</p>
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
                  <Label>Payment Status</Label>
                  <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="OVERDUE">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Overdue
                        </div>
                      </SelectItem>
                      <SelectItem value="ON_TIME">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          On Time
                        </div>
                      </SelectItem>
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

                  <TableHead>Payment Status</TableHead>

                  <TableHead>Document</TableHead>

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
                        <TableCell><div className="h-6 w-20 bg-gray-200 rounded" /></TableCell>
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
                          <OverdueBadge
                            isOverdue={loan.isOverdue}
                            overdueDays={loan.overdueDays}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs italic">Missing data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DocumentBadge documentUrl={loan.documentUrl} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Document Actions */}
                          {loan.documentUrl ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDocument(loan)}
                                className="h-8 w-8 text-green-600 hover:text-green-800"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadDocument(loan)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-800"
                                title="Download Document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveDocument(loan)}
                                className="h-8 w-8 text-red-600 hover:text-red-800"
                                title="Remove Document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(loan)}
                              className="h-8 w-8 text-orange-600 hover:text-orange-800"
                              title="Upload Document"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Edit Loan */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(loan)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800"
                            title="Edit Loan"
                          >
                            <FileEdit className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete Loan */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuickDelete(loan)}
                            className="h-8 w-8 text-red-600 hover:text-red-800"
                            title="Delete Loan"
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
                    {overdueFilter !== "ALL" && ` Payment Status: ${getOverdueFilterDisplay(overdueFilter)}`}
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

      {/* ----- COMPREHENSIVE EDIT DIALOG ----- */}
      <ClientOnly>
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                {editingLoan ? "Edit Loan" : "Create New Loan"}
              </DialogTitle>
              <DialogDescription>
                {editingLoan 
                  ? "Manage all aspects of this loan including details, documents, and status." 
                  : "Create a new loan and upload supporting documents."}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Loan Details
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Actions
                </TabsTrigger>
              </TabsList>

              {/* LOAN DETAILS TAB */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={form.status} 
                      onValueChange={(value) => setForm({...form, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CLOSED">Completed</SelectItem>
                        <SelectItem value="NEVER_OPENED">Never Opened</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Loan Amount (₹)</Label>
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
                    <Label htmlFor="pendingAmount">Pending Amount (₹)</Label>
                    <Input
                      id="pendingAmount"
                      name="pendingAmount"
                      type="number"
                      value={form.pendingAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

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

                  <div className="md:col-span-2 space-y-2">
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

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveLoanDetails}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {editingLoan ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingLoan ? "Update Loan" : "Create Loan"}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* DOCUMENTS TAB */}
              <TabsContent value="documents" className="space-y-4">
                {/* Current Document Status */}
                {editingLoan?.documentUrl && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Document Uploaded
                          </p>
                          <p className="text-xs text-green-600">
                            Document is available for this loan
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(editingLoan)}
                          className="text-green-600 border-green-200 hover:bg-green-100"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(editingLoan)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-100"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Upload Section */}
                <div className="space-y-4">
                  <Label htmlFor="document-upload">
                    {editingLoan?.documentUrl ? "Replace Document" : "Upload Document"}
                  </Label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      id="document-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG, DOC (max 5 MB)
                      </p>
                    </label>
                  </div>

                  {/* File Preview */}
                  {previewUrl && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700">
                        Preview
                      </Label>
                      <div className="relative mt-2 inline-block">
                        <div className="w-32 h-32 border rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={previewUrl}
                            alt="Document preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removeFile}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  {documentFile && !previewUrl && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <span className="text-sm font-medium block">
                            {documentFile.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  {editingLoan?.documentUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveDocument(editingLoan)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Document
                    </Button>
                  )}
                  
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("details")}
                    >
                      Back to Details
                    </Button>
                    <Button
                      onClick={handleDocumentUpload}
                      disabled={!documentFile || isUploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {editingLoan?.documentUrl ? 'Replace Document' : 'Upload Document'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ACTIONS TAB */}
              <TabsContent value="actions" className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Danger Zone</h4>
                  <p className="text-sm text-yellow-700 mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  
                  <div className="space-y-3">
                    {editingLoan && (
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                        <div>
                          <p className="font-medium text-red-800">Delete Loan</p>
                          <p className="text-sm text-red-600">
                            Permanently delete this loan and all associated data
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteLoan}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Loan
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                      <div>
                        <p className="font-medium text-gray-800">Close Dialog</p>
                        <p className="text-sm text-gray-600">
                          Close this dialog without saving changes
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowEditDialog(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </ClientOnly>
    </div>
  );
};

// Add missing Settings icon component
const Settings = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default LoanTable;