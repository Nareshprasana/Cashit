"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  ChevronsUpDown,
  Search,
  Download,
  FileText,
  User,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  DollarSign,
  BarChart3,
  Filter,
  X,
  Edit,
  Loader2,
  Upload,
  Eye,
  Pencil,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Label } from "@/components/ui/label";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Textarea } from "@/components/ui/textarea";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ProgressBar = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Loan Card Component
const LoanCard = ({ loan, index, status, onEdit, onDelete, onUpload }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { className: 'bg-green-100 text-green-800', label: 'Active' },
      'CLOSED': { className: 'bg-gray-100 text-gray-800', label: 'Closed' },
      'OVERDUE': { className: 'bg-red-100 text-red-800', label: 'Overdue' },
      'COMPLETED': { className: 'bg-blue-100 text-blue-800', label: 'Completed' }
    };
    
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const calculatePendingAmount = (loan) => {
    return loan.pendingAmount || (loan.amount || 0) - (loan.totalPaid || 0);
  };

  const pendingAmount = calculatePendingAmount(loan);
  const isClosed = pendingAmount <= 0 || status === 'CLOSED' || status === 'COMPLETED';

  return (
    <div className={`border rounded-lg p-4 ${isClosed ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Loan #{index + 1}</h4>
          {getStatusBadge(status)}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(loan)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Loan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpload(loan)}>
                <Upload className="h-4 w-4 mr-2" />
                {loan.documentUrl ? 'Update Document' : 'Upload Document'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete(loan)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Loan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {[
          { label: "Amount", value: `₹${Number(loan.amount || 0).toLocaleString('en-IN')}` },
          { label: "Rate", value: `${loan.rate}%` },
          { label: "Tenure", value: `${loan.tenure} months` },
          { label: "Loan Date", value: loan.loanDate ? new Date(loan.loanDate).toLocaleDateString() : "N/A" },
          { label: "End Date", value: loan.endDate ? new Date(loan.endDate).toLocaleDateString() : "N/A" },
          { label: "Total Paid", value: `₹${Number(loan.totalPaid || 0).toLocaleString('en-IN')}`, className: "text-green-600" },
          { 
            label: "Pending", 
            value: `₹${Number(pendingAmount).toLocaleString('en-IN')}`, 
            className: isClosed ? "text-gray-600" : "text-red-600" 
          },
          ...(loan.interestAmount !== undefined ? [{ label: "Interest", value: `₹${Number(loan.interestAmount || 0).toLocaleString('en-IN')}` }] : []),
          ...(loan.documentUrl ? [{ label: "Document", value: "Uploaded", className: "text-green-600" }] : [{ label: "Document", value: "Not Uploaded", className: "text-gray-600" }]),
        ].map((item, idx) => (
          <div key={idx}>
            <Label className="text-xs text-gray-500">{item.label}</Label>
            <div className={`font-medium ${item.className || ''}`}>{item.value}</div>
          </div>
        ))}
      </div>
      {loan.documentUrl && (
        <div className="mt-3 pt-3 border-t">
          <Label className="text-xs text-gray-500">Loan Agreement</Label>
          <div className="flex gap-2 mt-1">
            <Button variant="outline" size="sm" asChild>
              <a href={loan.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> View
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={loan.documentUrl} download className="flex items-center gap-1">
                <Download className="h-3 w-3" /> Download
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate loan status
const getLoanStatus = (loan) => {
  // First check if there's an explicit status from the database
  if (loan.status === 'CLOSED' || loan.status === 'ACTIVE' || loan.status === 'OVERDUE' || loan.status === 'COMPLETED') {
    return loan.status;
  }
  
  // Calculate based on financial data
  const pendingAmount = loan.pendingAmount || (loan.amount || 0) - (loan.totalPaid || 0);
  const now = new Date();
  const endDate = loan.endDate ? new Date(loan.endDate) : null;
  
  // If pending amount is zero or negative, loan is completed
  if (pendingAmount <= 0) {
    return 'COMPLETED';
  } 
  // If end date has passed and there's still pending amount, it's overdue
  else if (endDate && endDate < now) {
    return 'OVERDUE';
  } 
  // Otherwise, it's active
  else {
    return 'ACTIVE';
  }
};

export default function AllCustomerTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerLoans, setCustomerLoans] = useState({});

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [startEndDate, setStartEndDate] = useState("");
  const [endEndDate, setEndEndDate] = useState("");
  const [availableAreas, setAvailableAreas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repayments, setRepayments] = useState([]);
  
  const [deletingId, setDeletingId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [documentToUpdate, setDocumentToUpdate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // New states for loan CRUD operations
  const [createLoanOpen, setCreateLoanOpen] = useState(false);
  const [editLoanOpen, setEditLoanOpen] = useState(false);
  const [deleteLoanOpen, setDeleteLoanOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);
  const [creatingLoan, setCreatingLoan] = useState(false);
  const [updatingLoan, setUpdatingLoan] = useState(false);
  const [deletingLoan, setDeletingLoan] = useState(false);

  // New loan form state
  const [loanFormData, setLoanFormData] = useState({
    amount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split('T')[0],
    area: "",
  });

  const router = useRouter();

  const calculateEndDate = (loanDate, tenure) => {
    if (!loanDate || tenure == null) return null;
    const d = new Date(loanDate);
    d.setMonth(d.getMonth() + Number(tenure));
    return d;
  };

  // Enhanced fetch function with better error handling
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const [customersRes, loansRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/loans")
        ]);

        if (!customersRes.ok) throw new Error("Failed to fetch customer data");

        let customers = await customersRes.json();
        const loans = loansRes.ok ? await loansRes.json() : [];

        console.log('Fetched loans:', loans); // Debug log

        // Process customers with calculated end dates
        customers = customers.map((c) => ({
          ...c,
          endDate: c.endDate
            ? new Date(c.endDate)
            : c.loanDate && c.tenure
            ? calculateEndDate(c.loanDate, c.tenure)
            : null,
        }));

        setData(customers);
        setAvailableAreas([...new Set(customers.map((c) => c.area).filter(Boolean))]);

        // Organize loans by customer ID - FIXED VERSION
        const loansByCustomer = {};
        loans.forEach(loan => {
          // Use customerId directly from loan object
          const customerId = loan.customerId;
          if (customerId) {
            if (!loansByCustomer[customerId]) {
              loansByCustomer[customerId] = [];
            }
            
            // Calculate loan status and pending amount
            const pendingAmount = loan.pendingAmount || (loan.amount || 0) - (loan.totalPaid || 0);
            const status = getLoanStatus(loan);
            
            console.log(`Loan ${loan.id}: amount=${loan.amount}, totalPaid=${loan.totalPaid}, pending=${pendingAmount}, status=${status}`);
            
            loansByCustomer[customerId].push({
              ...loan,
              // Ensure all required fields are present
              documentUrl: loan.documentUrl || null,
              status: status,
              amount: loan.amount || loan.loanAmount || 0,
              pendingAmount: pendingAmount,
              totalPaid: loan.totalPaid || 0,
              // Ensure endDate is calculated if not present
              endDate: loan.endDate || (loan.loanDate && loan.tenure ? calculateEndDate(loan.loanDate, loan.tenure) : null),
            });
          }
        });
        
        console.log('Loans by customer:', loansByCustomer); // Debug log
        setCustomerLoans(loansByCustomer);

      } catch (e) {
        console.error("Fetch error:", e);
        alert("Failed to load customer data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  // Enhanced customer selection handler
  useEffect(() => {
    if (!selectedCustomer?.customerCode) {
      setQrCodeUrl("");
      setRepayments([]);
      setSelectedLoan(null);
      return;
    }

    // Generate QR code
    QRCode.toDataURL(selectedCustomer.customerCode)
      .then(setQrCodeUrl)
      .catch(console.error);

    // Fetch repayments
    fetch(`/api/repayments?customerId=${selectedCustomer.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch repayments");
        return r.json();
      })
      .then((d) => setRepayments(Array.isArray(d) ? d : []))
      .catch((error) => {
        console.error("Repayment fetch error:", error);
        setRepayments([]);
      });

    // Set first loan as selected
    const customerLoansList = customerLoans[selectedCustomer.id] || [];
    setSelectedLoan(customerLoansList[0] || null);
  }, [selectedCustomer, customerLoans]);

  // Enhanced delete handler
  const handleDelete = async (id) => {
    if (!id || typeof id !== "string") {
      alert("Invalid customer ID");
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Delete failed");
      }

      const { success, message } = await res.json();
      if (success) {
        setData((prev) => prev.filter((c) => c.id !== id));
        if (selectedCustomer?.id === id) {
          setDialogOpen(false);
          setSelectedCustomer(null);
        }
        alert(message || "Customer deleted successfully!");
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Download QR code
  const handleDownloadQRCode = () => {
    if (!qrCodeUrl) {
      alert("QR code not available");
      return;
    }
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `QRCode_${selectedCustomer?.customerCode || "customer"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download statement
  const handleDownloadStatement = () => {
    if (!selectedCustomer) return;
    
    const headers = ["Date", "Amount", "Note", "Status"];
    const rows = repayments.map((r) => [
      r.date ? new Date(r.date).toISOString().split("T")[0] : "",
      Number(r.amount ?? 0),
      r.note ?? "",
      r.status ?? "completed"
    ]);
    
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((v) => {
            const s = String(v ?? "");
            return s.includes(",") || s.includes('"') || s.includes("\n")
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Statement_${selectedCustomer.name?.replace(/[^a-z0-9]/gi, "_") ?? "customer"}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Document update handlers
  const handleDocumentUpdate = (field) => {
    setDocumentToUpdate(field);
    setSelectedFile(null);
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !documentToUpdate || !selectedCustomer) return;

    setUploadingDocument(true);
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("id", selectedCustomer.id);
    fd.append("documentField", documentToUpdate);

    try {
      const res = await fetch("/api/customers", { 
        method: "PUT", 
        body: fd 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }
      
      const { customer } = await res.json();
      
      // Update both data and selected customer
      setData((prev) => prev.map((c) => (c.id === customer.id ? { ...c, ...customer } : c)));
      setSelectedCustomer((prev) => prev?.id === customer.id ? { ...prev, ...customer } : prev);
      
      alert("Document updated successfully!");
      setDocumentToUpdate(null);
      setSelectedFile(null);
    } catch (e) {
      console.error("Document upload error:", e);
      alert(e.message);
    } finally {
      setUploadingDocument(false);
    }
  };

  // Enhanced loan document handler
  const handleLoanDocumentUpdate = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedLoan) return;

    setUploadingDocument(true);
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("loanId", selectedLoan.id);
    fd.append("documentField", "documentUrl");

    try {
      const res = await fetch("/api/loans", { 
        method: "PUT", 
        body: fd 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Loan document upload failed");
      }
      
      const { loan } = await res.json();

      // Update customer loans state
      setCustomerLoans(prev => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).map(l => 
          l.id === loan.id ? { ...l, documentUrl: loan.documentUrl } : l
        )
      }));

      // Update selected loan
      if (selectedLoan?.id === loan.id) {
        setSelectedLoan(prev => ({ ...prev, documentUrl: loan.documentUrl }));
      }

      alert("Loan document updated successfully!");
      setDocumentToUpdate(null);
      setSelectedFile(null);
    } catch (e) {
      console.error("Loan document upload error:", e);
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  // Loan CRUD Operations
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setCreatingLoan(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: Number(loanFormData.amount),
          rate: Number(loanFormData.rate),
          tenure: Number(loanFormData.tenure),
          loanDate: loanFormData.loanDate,
          area: loanFormData.area || selectedCustomer.area,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create loan");
      }

      const { loan } = await res.json();

      // Update customer loans state
      setCustomerLoans(prev => ({
        ...prev,
        [selectedCustomer.id]: [...(prev[selectedCustomer.id] || []), loan]
      }));

      // Reset form and close dialog
      setLoanFormData({
        amount: "",
        rate: "",
        tenure: "",
        loanDate: new Date().toISOString().split('T')[0],
        area: "",
      });
      setCreateLoanOpen(false);
      alert("Loan created successfully!");
    } catch (e) {
      console.error("Loan creation error:", e);
      alert(`Failed to create loan: ${e.message}`);
    } finally {
      setCreatingLoan(false);
    }
  };

  const handleUpdateLoan = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setUpdatingLoan(true);
    try {
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedLoan.id,
          amount: Number(loanFormData.amount),
          rate: Number(loanFormData.rate),
          tenure: Number(loanFormData.tenure),
          loanDate: loanFormData.loanDate,
          area: loanFormData.area,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update loan");
      }

      const { loan } = await res.json();

      // Update customer loans state
      setCustomerLoans(prev => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).map(l => 
          l.id === loan.id ? loan : l
        )
      }));

      // Update selected loan
      setSelectedLoan(loan);
      setEditLoanOpen(false);
      alert("Loan updated successfully!");
    } catch (e) {
      console.error("Loan update error:", e);
      alert(`Failed to update loan: ${e.message}`);
    } finally {
      setUpdatingLoan(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;

    setDeletingLoan(true);
    try {
      const res = await fetch(`/api/loans?id=${loanToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete loan");
      }

      // Update customer loans state
      setCustomerLoans(prev => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).filter(l => l.id !== loanToDelete.id)
      }));

      // Reset selected loan if it was deleted
      if (selectedLoan?.id === loanToDelete.id) {
        const remainingLoans = customerLoans[selectedCustomer.id]?.filter(l => l.id !== loanToDelete.id) || [];
        setSelectedLoan(remainingLoans[0] || null);
      }

      setDeleteLoanOpen(false);
      setLoanToDelete(null);
      alert("Loan deleted successfully!");
    } catch (e) {
      console.error("Loan deletion error:", e);
      alert(`Failed to delete loan: ${e.message}`);
    } finally {
      setDeletingLoan(false);
    }
  };

  // Helper function to check if loan is active
  const isLoanActive = (loan) => {
    return getLoanStatus(loan) === 'ACTIVE';
  };

  // Initialize loan form for editing
  const initializeEditLoan = (loan) => {
    setSelectedLoan(loan);
    setLoanFormData({
      amount: loan.amount?.toString() || "",
      rate: loan.rate?.toString() || "",
      tenure: loan.tenure?.toString() || "",
      loanDate: loan.loanDate ? new Date(loan.loanDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      area: loan.area || selectedCustomer?.area || "",
    });
    setEditLoanOpen(true);
  };

  // Initialize create loan form
  const initializeCreateLoan = () => {
    setLoanFormData({
      amount: "",
      rate: "",
      tenure: "",
      loanDate: new Date().toISOString().split('T')[0],
      area: selectedCustomer?.area || "",
    });
    setCreateLoanOpen(true);
  };

  // Columns definition
  const columns = [
    {
      accessorKey: "photoUrl",
      header: "Photo",
      cell: ({ row }) => {
        const url = row.original.photoUrl;
        return url ? (
          <img 
            src={url} 
            alt="Customer" 
            className="h-10 w-10 rounded-full object-cover border shadow-sm" 
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        );
      },
    },
    {
      accessorKey: "customerCode",
      header: "Customer ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded border">
          {row.original.customerCode || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span
          className="cursor-pointer text-blue-600 hover:underline font-medium transition-colors"
          onClick={() => {
            setSelectedCustomer(row.original);
            setDialogOpen(true);
          }}
        >
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "aadhar",
      header: "Aadhar",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.aadhar || "N/A"}</span>,
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-gray-500" />
          {row.original.area || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const customerLoansList = customerLoans[row.original.id] || [];
        const hasActiveLoan = customerLoansList.some(loan => getLoanStatus(loan) === 'ACTIVE');
        const hasOverdueLoan = customerLoansList.some(loan => getLoanStatus(loan) === 'OVERDUE');
        const hasCompletedLoan = customerLoansList.some(loan => getLoanStatus(loan) === 'COMPLETED');
        
        if (hasOverdueLoan) {
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </Badge>
          );
        } else if (hasActiveLoan) {
          return (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          );
        } else if (hasCompletedLoan) {
          return (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="text-gray-600">
              No Loans
            </Badge>
          );
        }
      },
    },
    {
      accessorKey: "loanAmount",
      header: () => <div className="text-right">Loan Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ₹{Number(row.original.loanAmount ?? 0).toLocaleString('en-IN')}
        </div>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        const d = row.original.endDate;
        return d ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            {new Date(d).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      accessorKey: "overdueDays",
      header: "Overdue",
      cell: ({ row }) => {
        const end = row.original.endDate ? new Date(row.original.endDate) : null;
        if (!end) return "N/A";
        const diff = Math.floor((Date.now() - end) / (1000 * 60 * 60 * 24));
        return diff > 0 ? (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {diff} days
          </Badge>
        ) : (
          <span className="text-green-600 text-xs font-medium">On time</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedCustomer(customer);
                setDialogOpen(true);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/customers/edit?id=${customer.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filtering and pagination
  const filteredData = useMemo(() => {
    return data.filter((c) => {
      const globalMatch = !globalFilter ||
        c.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        c.customerCode?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        c.aadhar?.includes(globalFilter);

      const customerLoansList = customerLoans[c.id] || [];
      const hasActiveLoan = customerLoansList.some(loan => getLoanStatus(loan) === 'ACTIVE');
      const hasCompletedLoan = customerLoansList.some(loan => getLoanStatus(loan) === 'COMPLETED');
      const hasOverdueLoan = customerLoansList.some(loan => getLoanStatus(loan) === 'OVERDUE');
      
      let statusMatch = true;
      if (statusFilter === "active") {
        statusMatch = hasActiveLoan || hasOverdueLoan;
      } else if (statusFilter === "completed") {
        statusMatch = hasCompletedLoan && !hasActiveLoan && !hasOverdueLoan;
      } else if (statusFilter === "closed") {
        statusMatch = !hasActiveLoan && !hasOverdueLoan;
      }

      const areaMatch = !areaFilter || c.area === areaFilter;

      const end = c.endDate ? new Date(c.endDate) : null;
      const startDateMatch = !startEndDate || (end && end >= new Date(startEndDate));
      const endDateMatch = !endEndDate || (end && end <= new Date(endEndDate));

      return globalMatch && statusMatch && areaMatch && startDateMatch && endDateMatch;
    });
  }, [data, globalFilter, statusFilter, areaFilter, startEndDate, endEndDate, customerLoans]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const numberOfRepayments = repayments.length;

  const numberOfDocuments = useMemo(() => {
    if (!selectedCustomer) return 0;
    
    const customerDocs = ["aadharDocumentUrl", "incomeProofUrl", "residenceProofUrl", "qrUrl", "photoUrl"];
    const customerDocCount = customerDocs.filter((f) => selectedCustomer[f]).length;
    
    const customerLoansList = customerLoans[selectedCustomer.id] || [];
    const loanDocCount = customerLoansList.filter(loan => loan.documentUrl).length;
    
    return customerDocCount + loanDocCount;
  }, [selectedCustomer, customerLoans]);

  // Pagination helper
  const renderPageWindow = () => {
    const max = 5;
    const start = Math.max(1, Math.min(currentPage - Math.floor(max / 2), totalPages - max + 1));
    const end = Math.min(totalPages, start + max - 1);
    const items = [];

    if (start > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentPage(1); }} 
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (start > 2) {
        items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }
    }

    for (let p = start; p <= end; p++) {
      items.push(
        <PaginationItem key={p}>
          <PaginationLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentPage(p); }} 
            isActive={currentPage === p}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }} 
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading customers…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">View, filter, and edit customer details.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {data.length} customer{data.length !== 1 && "s"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            {filteredData.length} filtered
          </Badge>
          <Button onClick={() => router.push("/dashboard/addNewCustomer")} className="ml-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
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
                {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              {(globalFilter || statusFilter || areaFilter || startEndDate || endEndDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { 
                    setGlobalFilter(""); 
                    setStatusFilter(""); 
                    setAreaFilter(""); 
                    setStartEndDate(""); 
                    setEndEndDate(""); 
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name, ID, or Aadhar…" 
                value={globalFilter} 
                onChange={(e) => setGlobalFilter(e.target.value)} 
                className="pl-10" 
              />
            </div>
            {showFilters && (
              <div className="grid gap-4 pt-4 border-t md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    className="w-full rounded border p-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Area</Label>
                  <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={areaOpen} className="w-full justify-between text-sm">
                        {areaFilter || "All Areas"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search area…" />
                        <CommandList>
                          <CommandEmpty>No area found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => { setAreaFilter(""); setAreaOpen(false); }}>
                              All Areas
                            </CommandItem>
                            {availableAreas.map((a) => (
                              <CommandItem key={a} onSelect={() => { setAreaFilter(a); setAreaOpen(false); }}>
                                {a}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">End Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="date" 
                      value={startEndDate} 
                      onChange={(e) => setStartEndDate(e.target.value)} 
                    />
                    <Input 
                      type="date" 
                      value={endEndDate} 
                      onChange={(e) => setEndEndDate(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{paginatedData.length}</span> of <span className="font-medium">{filteredData.length}</span> customers (Total: {data.length})
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Rows per page:</Label>
          <select 
            className="rounded border p-1 text-sm" 
            value={rowsPerPage} 
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            {[5, 10, 20, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={paginatedData} />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} 
                />
              </PaginationItem>
              {renderPageWindow()}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }} 
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start gap-3">
              <div>
                <DialogTitle className="text-2xl">Customer Details</DialogTitle>
                <DialogDescription>Full profile for {selectedCustomer?.name}</DialogDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={initializeCreateLoan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Loan
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      router.push(`/loans?customerId=${selectedCustomer.id}`);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Loans
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          {!selectedCustomer ? (
            <p className="text-center py-8 text-gray-500">No customer selected.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Left Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4">
                      {selectedCustomer.photoUrl ? (
                        <img 
                          src={selectedCustomer.photoUrl} 
                          alt="customer" 
                          className="h-24 w-24 rounded-full object-cover border-4 border-gray-100 shadow-sm" 
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-100">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <div className="text-center">
                        <div className="font-bold text-lg">{selectedCustomer.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{selectedCustomer.customerCode || "N/A"}</div>
                      </div>
                      {qrCodeUrl ? (
                        <div className="p-2 bg-white border rounded-lg shadow-sm">
                          <img src={qrCodeUrl} alt="QR" className="h-32 w-32" />
                        </div>
                      ) : (
                        <div className="h-32 w-32 border rounded-lg flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                          QR loading…
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => navigator.clipboard.writeText(selectedCustomer.customerCode ?? "")}
                    >
                      <FileText className="h-4 w-4 mr-2" /> Copy Customer ID
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setEditOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={initializeCreateLoan}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create Loan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={handleDownloadQRCode} 
                      disabled={!qrCodeUrl}
                    >
                      <Download className="h-4 w-4 mr-2" /> Download QR Code
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={handleDownloadStatement}
                    >
                      <Download className="h-4 w-4 mr-2" /> Download Statement
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Content */}
              <div className="lg:col-span-3 space-y-6">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="repayments">Repayments ({numberOfRepayments})</TabsTrigger>
                    <TabsTrigger value="documents">Documents ({numberOfDocuments})</TabsTrigger>
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          { label: "Mobile", value: selectedCustomer.mobile, icon: Phone },
                          { label: "Aadhar", value: selectedCustomer.aadhar },
                          { label: "Area", value: selectedCustomer.area, icon: MapPin },
                          { label: "Address", value: selectedCustomer.address, span: true },
                          { label: "DOB", value: selectedCustomer.dob ? new Date(selectedCustomer.dob).toLocaleDateString() : "N/A" },
                          { label: "Gender", value: selectedCustomer.gender },
                          { label: "Spouse Name", value: selectedCustomer.spouseName },
                          { label: "Parent Name", value: selectedCustomer.parentName },
                          { label: "Guarantor", value: selectedCustomer.guarantorName },
                          { label: "Guarantor Aadhar", value: selectedCustomer.guarantorAadhar },
                        ].map((item, index) => (
                          <div key={index} className={`space-y-1 ${item.span ? 'md:col-span-2' : ''}`}>
                            <Label className="text-sm text-gray-500">{item.label}</Label>
                            <div className={`font-medium ${item.icon ? 'flex items-center' : ''}`}>
                              {item.icon && <item.icon className="h-4 w-4 mr-2 text-gray-500" />}
                              {item.value ?? "N/A"}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Loan Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {[
                            { label: "Loan Amount", value: `₹${Number(selectedCustomer.loanAmount || 0).toLocaleString('en-IN')}`, icon: DollarSign },
                            { label: "Total Paid", value: `₹${Number(selectedCustomer.totalPaid || 0).toLocaleString('en-IN')}`, className: "text-green-600", icon: DollarSign },
                            { label: "Pending Amount", value: `₹${Number((selectedCustomer.loanAmount || 0) - (selectedCustomer.totalPaid || 0)).toLocaleString('en-IN')}`, className: "text-red-600", icon: DollarSign },
                            { label: "Loan Date", value: selectedCustomer.loanDate ? new Date(selectedCustomer.loanDate).toLocaleDateString() : "N/A" },
                            { label: "Tenure (months)", value: selectedCustomer.tenure },
                            { label: "End Date", value: selectedCustomer.endDate ? new Date(selectedCustomer.endDate).toLocaleDateString() : "N/A", icon: Calendar },
                          ].map((item, index) => (
                            <div key={index} className="space-y-1">
                              <Label className="text-sm text-gray-500">{item.label}</Label>
                              <div className={`flex items-center font-medium text-lg ${item.className || ''}`}>
                                {item.icon && <item.icon className="h-4 w-4 mr-1 text-gray-500" />}
                                {item.value ?? "N/A"}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Repayment Progress</span>
                            <span>{Math.round(((selectedCustomer.totalPaid || 0) / (selectedCustomer.loanAmount || 1)) * 100)}%</span>
                          </div>
                          <ProgressBar value={((selectedCustomer.totalPaid || 0) / (selectedCustomer.loanAmount || 1)) * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Loan Details from Loan Model */}
                    {(customerLoans[selectedCustomer.id]?.length > 0) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">All Loans</CardTitle>
                          <CardDescription>
                            {customerLoans[selectedCustomer.id].length} loan(s) found - 
                            Active: {customerLoans[selectedCustomer.id].filter(loan => getLoanStatus(loan) === 'ACTIVE').length}, 
                            Completed: {customerLoans[selectedCustomer.id].filter(loan => getLoanStatus(loan) === 'COMPLETED').length},
                            Overdue: {customerLoans[selectedCustomer.id].filter(loan => getLoanStatus(loan) === 'OVERDUE').length}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-2"
                              onClick={initializeCreateLoan}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Loan
                            </Button>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Show active loans first */}
                            {customerLoans[selectedCustomer.id]
                              .filter(loan => getLoanStatus(loan) === 'ACTIVE')
                              .map((loan, index) => (
                                <LoanCard 
                                  key={loan.id} 
                                  loan={loan} 
                                  index={index} 
                                  status="ACTIVE"
                                  onEdit={initializeEditLoan}
                                  onDelete={(loan) => { setLoanToDelete(loan); setDeleteLoanOpen(true); }}
                                  onUpload={(loan) => { setSelectedLoan(loan); setDocumentToUpdate("loanAgreement"); }}
                                />
                              ))
                            }
                            
                            {/* Show overdue loans */}
                            {customerLoans[selectedCustomer.id]
                              .filter(loan => getLoanStatus(loan) === 'OVERDUE')
                              .map((loan, index) => (
                                <LoanCard 
                                  key={loan.id} 
                                  loan={loan} 
                                  index={index} 
                                  status="OVERDUE"
                                  onEdit={initializeEditLoan}
                                  onDelete={(loan) => { setLoanToDelete(loan); setDeleteLoanOpen(true); }}
                                  onUpload={(loan) => { setSelectedLoan(loan); setDocumentToUpdate("loanAgreement"); }}
                                />
                              ))
                            }
                            
                            {/* Show completed loans - THIS IS THE KEY FIX */}
                            {customerLoans[selectedCustomer.id]
                              .filter(loan => getLoanStatus(loan) === 'COMPLETED')
                              .map((loan, index) => (
                                <LoanCard 
                                  key={loan.id} 
                                  loan={loan} 
                                  index={index} 
                                  status="COMPLETED"
                                  onEdit={initializeEditLoan}
                                  onDelete={(loan) => { setLoanToDelete(loan); setDeleteLoanOpen(true); }}
                                  onUpload={(loan) => { setSelectedLoan(loan); setDocumentToUpdate("loanAgreement"); }}
                                />
                              ))
                            }
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Repayments Tab */}
                  <TabsContent value="repayments">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Repayment History</CardTitle>
                        <CardDescription>All transactions for {selectedCustomer.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {repayments.length === 0 ? (
                          <div className="py-8 text-center text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            No repayment history found.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="p-3 text-left font-medium">Date</th>
                                  <th className="p-3 text-left font-medium">Amount</th>
                                  <th className="p-3 text-left font-medium">Note</th>
                                  <th className="p-3 text-left font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {repayments.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="p-3">
                                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                    </td>
                                    <td className="p-3 font-medium">₹{Number(r.amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-gray-600">{r.note ?? "—"}</td>
                                    <td className="p-3">
                                      <Badge variant={r.status === 'PENDING' ? 'destructive' : 'outline'} className="text-xs">
                                        {r.status || 'COMPLETED'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Customer Documents</CardTitle>
                        <CardDescription>Document links for {selectedCustomer.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <Button 
                              variant="outline" 
                              onClick={initializeCreateLoan}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" /> Create New Loan
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500">
                            {numberOfDocuments} document(s) total
                          </div>
                        </div>
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-3 text-left font-medium">Document Type</th>
                                <th className="p-3 text-left font-medium">Status</th>
                                <th className="p-3 text-left font-medium">File Type</th>
                                <th className="p-3 text-left font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {/* Profile Photo */}
                              <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium">Profile Photo</td>
                                <td className="p-3">
                                  {selectedCustomer.photoUrl ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Uploaded
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-600">
                                      Not Uploaded
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.photoUrl ? (
                                    <Badge variant="outline" className="text-xs">Image</Badge>
                                  ) : (
                                    <span className="text-sm text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.photoUrl ? (
                                    <div className="flex flex-wrap gap-2">
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={selectedCustomer.photoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                          <Eye className="h-4 w-4" /> View
                                        </a>
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={selectedCustomer.photoUrl} download className="flex items-center gap-1">
                                          <Download className="h-4 w-4" /> Download
                                        </a>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDocumentUpdate("photoUrl")} 
                                        className="flex items-center gap-1"
                                      >
                                        <Pencil className="h-4 w-4" /> Modify
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleDocumentUpdate("photoUrl")} 
                                      className="flex items-center gap-1"
                                    >
                                      <Upload className="h-4 w-4" /> Upload
                                    </Button>
                                  )}
                                </td>
                              </tr>

                              {/* Customer Documents */}
                              {[
                                { title: "Aadhar Document", field: "aadharDocumentUrl" },
                                { title: "Income Proof", field: "incomeProofUrl" },
                                { title: "Residence Proof", field: "residenceProofUrl" },
                              ].map((doc, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="p-3 font-medium">{doc.title}</td>
                                  <td className="p-3">
                                    {selectedCustomer[doc.field] ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Uploaded
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-gray-600">
                                        Not Uploaded
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {selectedCustomer[doc.field] ? (
                                      <Badge variant="outline" className="text-xs">
                                        {selectedCustomer[doc.field].toLowerCase().endsWith(".pdf") ? "PDF" : "Document"}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {selectedCustomer[doc.field] ? (
                                      <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={selectedCustomer[doc.field]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                            <Eye className="h-4 w-4" />
                                            {selectedCustomer[doc.field].toLowerCase().endsWith(".pdf") ? "View PDF" : "View"}
                                          </a>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={selectedCustomer[doc.field]} download className="flex items-center gap-1">
                                            <Download className="h-4 w-4" /> Download
                                          </a>
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => handleDocumentUpdate(doc.field)} 
                                          className="flex items-center gap-1"
                                        >
                                          <Pencil className="h-4 w-4" /> Modify
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDocumentUpdate(doc.field)} 
                                        className="flex items-center gap-1"
                                      >
                                        <Upload className="h-4 w-4" /> Upload
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Loan Agreements - Show ALL loans including completed ones */}
                              {customerLoans[selectedCustomer.id]?.length > 0 ? (
                                customerLoans[selectedCustomer.id].map((loan, index) => {
                                  const loanStatus = getLoanStatus(loan);
                                  return (
                                    <tr key={loan.id} className="hover:bg-gray-50">
                                      <td className="p-3 font-medium">
                                        <div className="flex items-center gap-2">
                                          Loan Agreement {customerLoans[selectedCustomer.id].length > 1 ? `#${index + 1}` : ''}
                                          <Badge className={
                                            loanStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            loanStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                            loanStatus === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }>
                                            {loanStatus}
                                          </Badge>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        {loan.documentUrl ? (
                                          <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Uploaded
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-gray-600">
                                            Not Uploaded
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        {loan.documentUrl ? (
                                          <Badge variant="outline" className="text-xs">
                                            {loan.documentUrl.toLowerCase().endsWith(".pdf") ? "PDF" : "Document"}
                                          </Badge>
                                        ) : (
                                          <span className="text-sm text-gray-500">-</span>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        {loan.documentUrl ? (
                                          <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                              <a href={loan.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                <Eye className="h-4 w-4" />
                                                {loan.documentUrl.toLowerCase().endsWith(".pdf") ? "View PDF" : "View"}
                                              </a>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                              <a href={loan.documentUrl} download className="flex items-center gap-1">
                                                <Download className="h-4 w-4" /> Download
                                              </a>
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => { setSelectedLoan(loan); setDocumentToUpdate("loanAgreement"); }} 
                                              className="flex items-center gap-1"
                                            >
                                              <Pencil className="h-4 w-4" /> Modify
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => initializeEditLoan(loan)}
                                              className="flex items-center gap-1"
                                            >
                                              <Edit className="h-4 w-4" /> Edit
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => { setLoanToDelete(loan); setDeleteLoanOpen(true); }}
                                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="h-4 w-4" /> Delete
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex flex-wrap gap-2">
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => { setSelectedLoan(loan); setDocumentToUpdate("loanAgreement"); }} 
                                              className="flex items-center gap-1"
                                            >
                                              <Upload className="h-4 w-4" /> Upload
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => initializeEditLoan(loan)}
                                              className="flex items-center gap-1"
                                            >
                                              <Edit className="h-4 w-4" /> Edit
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => { setLoanToDelete(loan); setDeleteLoanOpen(true); }}
                                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="h-4 w-4" /> Delete
                                            </Button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr className="hover:bg-gray-50">
                                  <td className="p-3 font-medium">Loan Agreement</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="text-gray-600">No Loans Found</Badge>
                                  </td>
                                  <td className="p-3">
                                    <span className="text-sm text-gray-500">-</span>
                                  </td>
                                  <td className="p-3">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={initializeCreateLoan}
                                      className="flex items-center gap-1"
                                    >
                                      <Plus className="h-4 w-4" /> Create Loan
                                    </Button>
                                  </td>
                                </tr>
                              )}

                              {/* QR Code */}
                              <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium">QR Code</td>
                                <td className="p-3">
                                  {selectedCustomer.qrUrl ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Uploaded
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-600">
                                      Not Uploaded
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.qrUrl ? (
                                    <Badge variant="outline" className="text-xs">Image</Badge>
                                  ) : (
                                    <span className="text-sm text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.qrUrl ? (
                                    <div className="flex flex-wrap gap-2">
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={selectedCustomer.qrUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                          <Eye className="h-4 w-4" /> View
                                        </a>
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <a href={selectedCustomer.qrUrl} download className="flex items-center gap-1">
                                          <Download className="h-4 w-4" /> Download
                                        </a>
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">N/A</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Upload Modal */}
                    <Dialog open={!!documentToUpdate} onOpenChange={() => setDocumentToUpdate(null)}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {documentToUpdate === "loanAgreement" 
                              ? selectedLoan?.documentUrl ? "Modify Loan Agreement" : "Upload Loan Agreement"
                              : documentToUpdate === "photoUrl"
                              ? selectedCustomer?.photoUrl ? "Modify Profile Photo" : "Upload Profile Photo"
                              : selectedCustomer?.[documentToUpdate] ? "Modify Document" : "Upload Document"
                            }
                          </DialogTitle>
                          <DialogDescription>
                            {documentToUpdate === "photoUrl" ? "Upload a new profile picture" :
                             documentToUpdate === "loanAgreement" ? "Upload loan agreement document" :
                             `Upload a new ${documentToUpdate?.replace("Url", "")}`}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={documentToUpdate === "loanAgreement" ? handleLoanDocumentUpdate : handleDocumentSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="doc-file">File</Label>
                            <Input 
                              id="doc-file" 
                              type="file" 
                              accept={documentToUpdate === "photoUrl" ? "image/*" : "image/*,.pdf"} 
                              onChange={(e) => setSelectedFile(e.target.files[0])} 
                              required 
                            />
                            <p className="text-xs text-gray-500">
                              {documentToUpdate === "photoUrl" ? "JPG / PNG / GIF" : "JPG / PNG / GIF / PDF"}
                            </p>
                          </div>

                          {(documentToUpdate === "loanAgreement" ? selectedLoan?.documentUrl : 
                            documentToUpdate === "photoUrl" ? selectedCustomer?.photoUrl : 
                            selectedCustomer?.[documentToUpdate]) && (
                            <div className="space-y-2">
                              <Label>Current Document</Label>
                              <div className="p-2 border rounded-md bg-gray-50">
                                {documentToUpdate === "photoUrl" || 
                                (documentToUpdate === "loanAgreement" && selectedLoan?.documentUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) ||
                                (documentToUpdate !== "loanAgreement" && selectedCustomer[documentToUpdate]?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) ? (
                                  <img
                                    src={documentToUpdate === "loanAgreement" ? selectedLoan.documentUrl : 
                                         documentToUpdate === "photoUrl" ? selectedCustomer.photoUrl : 
                                         selectedCustomer[documentToUpdate]}
                                    alt="current"
                                    className="h-32 object-contain mx-auto rounded"
                                  />
                                ) : (
                                  <div className="text-center py-8">
                                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">PDF Document</p>
                                    <a
                                      href={documentToUpdate === "loanAgreement" ? selectedLoan.documentUrl : 
                                            documentToUpdate === "photoUrl" ? selectedCustomer.photoUrl : 
                                            selectedCustomer[documentToUpdate]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      View current document
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDocumentToUpdate(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={uploadingDocument || !selectedFile}>
                              {uploadingDocument && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {documentToUpdate === "loanAgreement" 
                                ? selectedLoan?.documentUrl ? "Update" : "Upload"
                                : documentToUpdate === "photoUrl"
                                ? selectedCustomer?.photoUrl ? "Update" : "Upload"
                                : selectedCustomer?.[documentToUpdate] ? "Update" : "Upload"
                              }
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Loan Dialog */}
      <Dialog open={createLoanOpen} onOpenChange={setCreateLoanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Loan</DialogTitle>
            <DialogDescription>
              Create a new loan agreement for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={loanFormData.amount}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Interest Rate (%) *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={loanFormData.rate}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, rate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenure">Tenure (months) *</Label>
                <Input
                  id="tenure"
                  type="number"
                  placeholder="12"
                  value={loanFormData.tenure}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, tenure: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanDate">Loan Date *</Label>
                <Input
                  id="loanDate"
                  type="date"
                  value={loanFormData.loanDate}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, loanDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  type="text"
                  placeholder="Enter area"
                  value={loanFormData.area}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateLoanOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingLoan}>
                {creatingLoan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Loan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      <Dialog open={editLoanOpen} onOpenChange={setEditLoanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Loan</DialogTitle>
            <DialogDescription>
              Update loan details for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateLoan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Loan Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={loanFormData.amount}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rate">Interest Rate (%) *</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={loanFormData.rate}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, rate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tenure">Tenure (months) *</Label>
                <Input
                  id="edit-tenure"
                  type="number"
                  placeholder="12"
                  value={loanFormData.tenure}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, tenure: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-loanDate">Loan Date *</Label>
                <Input
                  id="edit-loanDate"
                  type="date"
                  value={loanFormData.loanDate}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, loanDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-area">Area</Label>
                <Input
                  id="edit-area"
                  type="text"
                  placeholder="Enter area"
                  value={loanFormData.area}
                  onChange={(e) => setLoanFormData(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditLoanOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingLoan}>
                {updatingLoan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Loan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Loan Confirmation */}
      <AlertDialog open={deleteLoanOpen} onOpenChange={setDeleteLoanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the loan agreement
              {loanToDelete?.documentUrl && " and its associated document"}.
              {loanToDelete?.status === 'ACTIVE' && " This loan is currently active."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleDeleteLoan}
            >
              {deletingLoan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Loan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update any field of the selected customer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedCustomer) return;
            const form = e.currentTarget;
            const fd = new FormData(form);
            fd.set("id", selectedCustomer.id);
            const photoFile = form.querySelector('input[name="photo"]')?.files[0];
            if (photoFile) fd.set("photo", photoFile);
            try {
              const res = await fetch("/api/customers", { method: "PUT", body: fd });
              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Update failed");
              }
              const { customer } = await res.json();
              setData((prev) => prev.map((c) => c.id === customer.id ? { ...c, ...customer } : c));
              setSelectedCustomer((prev) => prev && prev.id === customer.id ? { ...prev, ...customer } : prev);
              setEditOpen(false);
              alert("Customer updated successfully!");
            } catch (err) {
              console.error("Update error:", err);
              alert(err.message);
            }
          }} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Full Name *", name: "customerName", type: "text", required: true },
                { label: "Mobile", name: "mobile", type: "text" },
                { label: "Customer Code", name: "customerCode", type: "text" },
                { label: "Aadhar Number", name: "aadhar", type: "text" },
                { label: "Area", name: "area", type: "text" },
                { label: "Address", name: "address", type: "textarea", rows: 2 },
                { label: "Date of Birth", name: "dob", type: "date" },
                { label: "Gender", name: "gender", type: "select", options: ["", "Male", "Female", "Other"] },
                { label: "Spouse Name", name: "spouseName", type: "text" },
                { label: "Parent Name", name: "parentName", type: "text" },
                { label: "Guarantor Name", name: "guarantorName", type: "text" },
                { label: "Guarantor Aadhar", name: "guarantorAadhar", type: "text" },
              ].map((field, index) => (
                <div key={index} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  <Label>{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea 
                      name={field.name} 
                      defaultValue={selectedCustomer?.[field.name]} 
                      rows={field.rows} 
                    />
                  ) : field.type === 'select' ? (
                    <select 
                      name={field.name} 
                      defaultValue={selectedCustomer?.[field.name] ?? ""} 
                      className="w-full rounded border p-2"
                    >
                      {field.options.map((option, idx) => (
                        <option key={idx} value={option}>{option || "Select …"}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      name={field.name} 
                      type={field.type} 
                      defaultValue={field.type === 'date' && selectedCustomer?.[field.name] ? new Date(selectedCustomer[field.name]).toISOString().split("T")[0] : selectedCustomer?.[field.name]} 
                      required={field.required} 
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Loan Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Loan Amount</Label>
                  <Input name="loanAmount" type="number" step="0.01" defaultValue={selectedCustomer?.loanAmount ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Loan Date</Label>
                  <Input name="loanDate" type="date" defaultValue={selectedCustomer?.loanDate ? new Date(selectedCustomer.loanDate).toISOString().split("T")[0] : ""} />
                </div>
                <div className="space-y-2">
                  <Label>Tenure (months)</Label>
                  <Input name="tenure" type="number" defaultValue={selectedCustomer?.tenure ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Total Paid (read-only)</Label>
                  <Input value={Number(selectedCustomer?.totalPaid ?? 0).toLocaleString('en-IN')} readOnly />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Profile Photo (optional)</Label>
                  <Input name="photo" type="file" accept="image/*" />
                  {selectedCustomer?.photoUrl && (
                    <div className="mt-2">
                      <img src={selectedCustomer.photoUrl} alt="current" className="h-16 w-16 rounded-full object-cover border" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated repayments, loans, and documents will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={async () => {
                if (!selectedCustomer) return;
                await handleDelete(selectedCustomer.id);
                setDeleteOpen(false);
              }}
            >
              {deletingId === selectedCustomer?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Customer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export { AllCustomerTable };