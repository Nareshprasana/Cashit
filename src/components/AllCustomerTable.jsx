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
  RefreshCw,
  Info,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

const ProgressBar = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const LoanCard = ({ loan, index, status, onEdit, onDelete, onUpload }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { className: "bg-green-100 text-green-800", label: "Active" },
      CLOSED: { className: "bg-gray-100 text-gray-800", label: "Closed" },
      OVERDUE: { className: "bg-red-100 text-red-800", label: "Overdue" },
      COMPLETED: { className: "bg-blue-100 text-blue-800", label: "Completed" },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const calculatePendingAmount = (loan) => {
    return loan.pendingAmount || (loan.amount || 0) - (loan.totalPaid || 0);
  };

  const pendingAmount = calculatePendingAmount(loan);
  const isClosed =
    pendingAmount <= 0 || status === "CLOSED" || status === "COMPLETED";

  return (
    <div
      className={`border rounded-lg p-4 ${
        isClosed ? "bg-gray-50" : "bg-white"
      }`}
    >
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
                {loan.documentUrl ? "Update Document" : "Upload Document"}
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
          {
            label: "Amount",
            value: `₹${Number(loan.amount || 0).toLocaleString("en-IN")}`,
          },
          { label: "Rate", value: `${loan.rate}%` },
          { label: "Tenure", value: `${loan.tenure} months` },
          {
            label: "Loan Date",
            value: loan.loanDate
              ? new Date(loan.loanDate).toLocaleDateString()
              : "N/A",
          },
          {
            label: "End Date",
            value: loan.endDate
              ? new Date(loan.endDate).toLocaleDateString()
              : "N/A",
          },
          {
            label: "Total Paid",
            value: `₹${Number(loan.totalPaid || 0).toLocaleString("en-IN")}`,
            className: "text-green-600",
          },
          {
            label: "Pending",
            value: `₹${Number(pendingAmount).toLocaleString("en-IN")}`,
            className: isClosed ? "text-gray-600" : "text-red-600",
          },
          ...(loan.interestAmount !== undefined
            ? [
                {
                  label: "Interest",
                  value: `₹${Number(loan.interestAmount || 0).toLocaleString(
                    "en-IN"
                  )}`,
                },
              ]
            : []),
          ...(loan.documentUrl
            ? [
                {
                  label: "Document",
                  value: "Uploaded",
                  className: "text-green-600",
                },
              ]
            : [
                {
                  label: "Document",
                  value: "Not Uploaded",
                  className: "text-gray-600",
                },
              ]),
        ].map((item, idx) => (
          <div key={idx}>
            <Label className="text-xs text-gray-500">{item.label}</Label>
            <div className={`font-medium ${item.className || ""}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      {loan.documentUrl && (
        <div className="mt-3 pt-3 border-t">
          <Label className="text-xs text-gray-500">Loan Agreement</Label>
          <div className="flex gap-2 mt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={loan.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> View
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View loan agreement document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={loan.documentUrl}
                      download
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download loan agreement document</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
};

const getLoanStatus = (loan) => {
  if (
    loan.status === "CLOSED" ||
    loan.status === "ACTIVE" ||
    loan.status === "OVERDUE" ||
    loan.status === "COMPLETED"
  ) {
    return loan.status;
  }

  const pendingAmount =
    loan.pendingAmount || (loan.amount || 0) - (loan.totalPaid || 0);
  const now = new Date();
  const endDate = loan.endDate ? new Date(loan.endDate) : null;

  if (pendingAmount <= 0) {
    return "COMPLETED";
  } else if (endDate && endDate < now) {
    return "OVERDUE";
  } else {
    return "ACTIVE";
  }
};

const getCurrentLoan = (customerLoansList) => {
  if (!customerLoansList || customerLoansList.length === 0) {
    return null;
  }

  const sortedLoans = [...customerLoansList].sort(
    (a, b) => new Date(b.loanDate || 0) - new Date(a.loanDate || 0)
  );

  return (
    sortedLoans.find((loan) => getLoanStatus(loan) === "ACTIVE") ||
    sortedLoans.find((loan) => getLoanStatus(loan) === "OVERDUE") ||
    sortedLoans[0]
  );
};

// Fixed Edit Customer Form Component
const EditCustomerForm = ({ customer, onSave, onCancel, areas }) => {
  const [formData, setFormData] = useState({
    customerName: customer?.name || "",
    mobile: customer?.mobile || "",
    customerCode: customer?.customerCode || "",
    aadhar: customer?.aadhar || "",
    area: customer?.areaId || "",
    address: customer?.address || "",
    dob: customer?.dob
      ? new Date(customer.dob).toISOString().split("T")[0]
      : "",
    gender: customer?.gender || "",
    spouseName: customer?.spouseName || "",
    parentName: customer?.parentName || "",
    guarantorName: customer?.guarantorName || "",
    guarantorAadhar: customer?.guarantorAadhar || "",
    loanAmount: customer?.loanAmount || "",
    loanDate: customer?.loanDate
      ? new Date(customer.loanDate).toISOString().split("T")[0]
      : "",
    tenure: customer?.tenure || "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(customer?.photoUrl || "");
  const [loading, setLoading] = useState(false);
  // const { toast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Enforce digit-only and length limits for specific fields
    if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    if (name === "aadhar" || name === "guarantorAadhar") {
      const digits = value.replace(/\D/g, "").slice(0, 12);
      setFormData((prev) => ({ ...prev, [name]: digits }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("id", customer.id);

      // Append all form data
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      // Only append photo file if a new one was selected
      if (photoFile) {
        submitData.append("photo", photoFile);
      }

      // DON'T append other document files here unless they were specifically updated
      // This prevents accidental overwriting of existing documents

      const res = await fetch("/api/customers", {
        method: "PUT",
        body: submitData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update customer");
      }

      const { customer: updatedCustomer } = await res.json();
      onSave(updatedCustomer);
      toast.success("Customer updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Failed to update customer: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile</Label>
          <Input
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            inputMode="numeric"
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerCode">Customer Code</Label>
          <Input
            id="customerCode"
            name="customerCode"
            value={formData.customerCode}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aadhar">Aadhar Number</Label>
          <Input
            id="aadhar"
            name="aadhar"
            value={formData.aadhar}
            onChange={handleInputChange}
            inputMode="numeric"
            maxLength={12}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <select
            id="area"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            className="w-full rounded border p-2"
          >
            <option value="">Select Area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.areaName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full rounded border p-2"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="spouseName">Spouse Name</Label>
          <Input
            id="spouseName"
            name="spouseName"
            value={formData.spouseName}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentName">Parent Name</Label>
          <Input
            id="parentName"
            name="parentName"
            value={formData.parentName}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guarantorName">Guarantor Name</Label>
          <Input
            id="guarantorName"
            name="guarantorName"
            value={formData.guarantorName}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guarantorAadhar">Guarantor Aadhar</Label>
          <Input
            id="guarantorAadhar"
            name="guarantorAadhar"
            value={formData.guarantorAadhar}
            onChange={handleInputChange}
            inputMode="numeric"
            maxLength={12}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loanAmount">Loan Amount</Label>
          <Input
            id="loanAmount"
            name="loanAmount"
            type="number"
            step="0.01"
            value={formData.loanAmount}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanDate">Loan Date</Label>
          <Input
            id="loanDate"
            name="loanDate"
            type="date"
            value={formData.loanDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenure">Tenure (months)</Label>
          <Input
            id="tenure"
            name="tenure"
            type="number"
            value={formData.tenure}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo">Profile Photo</Label>
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {photoPreview && (
            <div className="mt-2">
              <img
                src={photoPreview}
                alt="Preview"
                className="h-16 w-16 rounded-full object-cover border"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
};

// Document Upload Dialog Component
const DocumentUploadDialog = ({
  open,
  onOpenChange,
  documentType,
  onSubmit,
  selectedFile,
  setSelectedFile,
  loading,
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload {documentType}</DialogTitle>
          <DialogDescription>
            Select a file to upload as {documentType.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-file">Select File</Label>
            <Input
              id="document-file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/*,application/pdf"
            />
            {selectedFile && (
              <p className="text-sm text-green-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedFile}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function AllCustomerTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerLoans, setCustomerLoans] = useState({});
  const [areas, setAreas] = useState([]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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

  // Document Management States
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [currentDocumentField, setCurrentDocumentField] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(false);
  const [deleteDocumentDialog, setDeleteDocumentDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState("");

  const [createLoanOpen, setCreateLoanOpen] = useState(false);
  const [editLoanOpen, setEditLoanOpen] = useState(false);
  const [deleteLoanOpen, setDeleteLoanOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);
  const [creatingLoan, setCreatingLoan] = useState(false);
  const [updatingLoan, setUpdatingLoan] = useState(false);
  const [deletingLoan, setDeletingLoan] = useState(false);

  const [loanFormData, setLoanFormData] = useState({
    amount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split("T")[0],
    area: "",
  });

  const router = useRouter();
  // const { toast } = useToast();

  const calculateEndDate = (loanDate, tenure) => {
    if (!loanDate || tenure == null) return null;
    const d = new Date(loanDate);
    d.setMonth(d.getMonth() + Number(tenure));
    return d;
  };

  // Enhanced getLoansForCustomer function to ensure it always returns an array
  const getLoansForCustomer = (customer) => {
    if (!customer || !customer.id) return [];

    const keyCandidates = [
      customer.id,
      String(customer.id),
      String(customer.customerCode),
      customer.customerCode?.toString?.(),
    ]
      .filter(Boolean)
      .map((k) => String(k));

    for (const key of keyCandidates) {
      if (customerLoans[key] && customerLoans[key].length > 0) {
        return customerLoans[key];
      }
    }

    // Return empty array for customers with no loans
    return [];
  };

  // Enhanced function to get loans for display (only current and recent closed)
  const getLoansForDisplay = (customer) => {
    const allLoans = getLoansForCustomer(customer);
    
    if (allLoans.length === 0) return [];
    
    // Sort loans by date (newest first)
    const sortedLoans = [...allLoans].sort(
      (a, b) => new Date(b.loanDate || 0) - new Date(a.loanDate || 0)
    );

    // Get current loan (active/overdue)
    const currentLoan = getCurrentLoan(sortedLoans);
    
    // Get recent completed/closed loans (max 1 recent closed loan)
    const recentClosedLoans = sortedLoans
      .filter(loan => {
        const status = getLoanStatus(loan);
        return (status === "COMPLETED" || status === "CLOSED") && 
               loan.id !== currentLoan?.id;
      })
      .slice(0, 1); // Only take the most recent closed loan

    // Combine current loan and recent closed loans
    const displayLoans = [];
    if (currentLoan) displayLoans.push(currentLoan);
    displayLoans.push(...recentClosedLoans);

    return displayLoans;
  };

  // Refresh data function
  const refreshCustomerData = async () => {
    try {
      setLoading(true);
      console.log("Refreshing customer data...");

      const [customersRes, loansRes, areasRes] = await Promise.all([
        fetch("/api/customers?" + Date.now()),
        fetch("/api/loans?" + Date.now()),
        fetch("/api/area?" + Date.now()),
      ]);

      if (!customersRes.ok) throw new Error("Failed to fetch customer data");

      let customers = await customersRes.json();
      const loans = loansRes.ok ? await loansRes.json() : [];
      const areasData = areasRes.ok ? await areasRes.json() : [];

      setAreas(areasData);

      // Ensure all customers have basic structure
      customers = customers.map((c) => ({
        ...c,
        loanAmount: c.loanAmount || 0,
        totalPaid: c.totalPaid || 0,
        endDate: c.endDate
          ? new Date(c.endDate)
          : c.loanDate && c.tenure
          ? calculateEndDate(c.loanDate, c.tenure)
          : null,
      }));

      setData(customers);
      setAvailableAreas([
        ...new Set(customers.map((c) => c.area).filter(Boolean)),
      ]);

      const loansByCustomer = {};
      const toDeleteLoanIds = [];
      const today = new Date();
      const MS_PER_DAY = 1000 * 60 * 60 * 24;

      loans.forEach((loan) => {
        const pendingAmount =
          loan.pendingAmount || (loan.amount || 0) - (loan.totalPaid || 0);
        const status = getLoanStatus(loan);
        const normalizedLoan = {
          ...loan,
          documentUrl: loan.documentUrl || null,
          status: status,
          amount: loan.amount || loan.loanAmount || 0,
          pendingAmount: pendingAmount,
          totalPaid: loan.totalPaid || 0,
          endDate:
            loan.endDate ||
            (loan.loanDate && loan.tenure
              ? calculateEndDate(loan.loanDate, loan.tenure)
              : null),
        };

        const end = normalizedLoan.endDate
          ? new Date(normalizedLoan.endDate)
          : null;
        if (end) {
          const daysSinceEnd = Math.floor(
            (today.getTime() - new Date(end).getTime()) / MS_PER_DAY
          );
          if (daysSinceEnd > 30) {
            if (loan.id) toDeleteLoanIds.push(loan.id);
            return;
          }
        }

        const candidateKeys = [
          loan.customerId,
          loan.customer?.id,
          loan.customer?.customerCode,
          loan.customer?.customerCode?.toString?.(),
          loan.customerId?.toString?.(),
        ]
          .filter(Boolean)
          .map((k) => String(k));

        candidateKeys.forEach((key) => {
          if (!loansByCustomer[key]) loansByCustomer[key] = [];
          loansByCustomer[key].push(normalizedLoan);
        });
      });

      // Ensure every customer has an entry in loansByCustomer (even if empty)
      customers.forEach((customer) => {
        const customerKey = String(customer.id);
        if (!loansByCustomer[customerKey]) {
          loansByCustomer[customerKey] = [];
        }
      });

      if (toDeleteLoanIds.length > 0) {
        Promise.all(
          toDeleteLoanIds.map((id) =>
            fetch(`/api/loans?id=${encodeURIComponent(id)}`, {
              method: "DELETE",
            })
              .then((res) => ({ id, ok: res.ok }))
              .catch((err) => ({ id, ok: false, error: err.message }))
          )
        )
          .then((results) => console.log("Auto-delete results:", results))
          .catch((err) => console.error("Auto-delete error:", err));
      }

      setCustomerLoans(loansByCustomer);
      console.log("Customer data refreshed successfully");
    } catch (e) {
      console.error("Refresh error:", e);
      toast.error("Failed to refresh customer data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    refreshCustomerData();
  }, []);

  // Listen for loan creation events so we can refresh data without a full page reload
  useEffect(() => {
    const handler = (e) => {
      console.log("loan:created event received", e?.detail);
      refreshCustomerData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("loan:created", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("loan:created", handler);
      }
    };
  }, [refreshCustomerData]);

  useEffect(() => {
    if (!selectedCustomer?.customerCode) {
      setQrCodeUrl("");
      setRepayments([]);
      setSelectedLoan(null);
      return;
    }

    QRCode.toDataURL(selectedCustomer.customerCode)
      .then(setQrCodeUrl)
      .catch(console.error);

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

    const customerLoansList = getLoansForCustomer(selectedCustomer);
    const currentLoan = getCurrentLoan(customerLoansList);
    setSelectedLoan(currentLoan || null);
  }, [selectedCustomer, customerLoans]);

  const handleDelete = async (id) => {
    if (!id || typeof id !== "string") {
      toast.error("Invalid customer ID");
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
        toast.success(`${message} || "Customer deleted successfully!`);
      }
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(`Delete failed: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeUrl) {
      toast.error("QR code not available");
      return;
    }
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `QRCode_${selectedCustomer?.customerCode || "customer"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR code downloaded successfully!");
  };

  const handleDownloadStatement = () => {
    if (!selectedCustomer) return;

    const headers = ["Date", "Amount", "Note", "Status"];
    const rows = repayments.map((r) => [
      r.date ? new Date(r.date).toISOString().split("T")[0] : "",
      Number(r.amount ?? 0),
      r.note ?? "",
      r.status ?? "completed",
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
    a.download = `Statement_${
      selectedCustomer.name?.replace(/[^a-z0-9]/gi, "_") ?? "customer"
    }_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Statement downloaded successfully!");
  };

  // Document Management Functions
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !currentDocumentField || !selectedCustomer) return;

    setUploadingDocument(true);
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("id", selectedCustomer.id);
    fd.append("documentField", currentDocumentField);

    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const { customer } = await res.json();

      setData((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, ...customer } : c))
      );
      setSelectedCustomer((prev) =>
        prev?.id === customer.id ? { ...prev, ...customer } : prev
      );

      toast.success("Document uploaded successfully!");

      setDocumentUploadOpen(false);
      setSelectedFile(null);
      setCurrentDocumentField("");
    } catch (e) {
      console.error("Document upload error:", e);

      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete || !selectedCustomer) return;

    setDeletingDocument(true);
    try {
      const fd = new FormData();
      fd.append("id", selectedCustomer.id);
      fd.append("documentField", documentToDelete);
      fd.append("deleteDocument", "true");

      const res = await fetch("/api/customers", {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Delete failed");
      }

      const { customer } = await res.json();

      setData((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, ...customer } : c))
      );
      setSelectedCustomer((prev) =>
        prev?.id === customer.id ? { ...prev, ...customer } : prev
      );

      toast.success("Document deleted successfully!");

      setDeleteDocumentDialog(false);
      setDocumentToDelete("");
    } catch (e) {
      console.error("Document delete error:", e);
      toast.error(`Delete failed: ${e.message}`);
    } finally {
      setDeletingDocument(false);
    }
  };

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
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Loan document upload failed");
      }

      const { loan } = await res.json();

      setCustomerLoans((prev) => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).map((l) =>
          l.id === loan.id ? { ...l, documentUrl: loan.documentUrl } : l
        ),
      }));

      if (selectedLoan?.id === loan.id) {
        setSelectedLoan((prev) => ({ ...prev, documentUrl: loan.documentUrl }));
      }

      toast.success("Loan document updated successfully!");

      setDocumentUploadOpen(false);
      setSelectedFile(null);
    } catch (e) {
      console.error("Loan document upload error:", e);
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteLoanDocument = async (loan) => {
    if (!loan) return;

    setDeletingDocument(true);
    try {
      const fd = new FormData();
      fd.append("loanId", loan.id);
      fd.append("documentField", "documentUrl");
      fd.append("deleteDocument", "true");

      const res = await fetch("/api/loans", {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Loan document delete failed");
      }

      const { loan: updatedLoan } = await res.json();

      setCustomerLoans((prev) => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).map((l) =>
          l.id === updatedLoan.id ? { ...l, documentUrl: null } : l
        ),
      }));

      if (selectedLoan?.id === updatedLoan.id) {
        setSelectedLoan((prev) => ({ ...prev, documentUrl: null }));
      }

      toast.success("Loan document deleted successfully!");
    } catch (e) {
      console.error("Loan document delete error:", e);
      toast.error(`Delete failed: ${e.message}`);
    } finally {
      setDeletingDocument(false);
    }
  };

  const openDocumentUpload = (field) => {
    setCurrentDocumentField(field);
    setSelectedFile(null);
    setDocumentUploadOpen(true);
  };

  const openDocumentDelete = (field) => {
    setDocumentToDelete(field);
    setDeleteDocumentDialog(true);
  };

  // Loan Management Functions
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

      setCustomerLoans((prev) => ({
        ...prev,
        [selectedCustomer.id]: [...(prev[selectedCustomer.id] || []), loan],
      }));

      setSelectedLoan(loan);

      setLoanFormData({
        amount: "",
        rate: "",
        tenure: "",
        loanDate: new Date().toISOString().split("T")[0],
        area: "",
      });
      setCreateLoanOpen(false);
      toast.success("Loan created successfully!");
    } catch (e) {
      console.error("Loan creation error:", e);
      toast.error(`Failed to create loan: ${e.message}`);
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

      setCustomerLoans((prev) => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).map((l) =>
          l.id === loan.id ? loan : l
        ),
      }));

      setSelectedLoan(loan);
      setEditLoanOpen(false);
      toast.success("Loan updated successfully!");
    } catch (e) {
      console.error("Loan update error:", e);
      toast.error(`Failed to update loan: ${e.message}`);
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

      setCustomerLoans((prev) => ({
        ...prev,
        [selectedCustomer.id]: (prev[selectedCustomer.id] || []).filter(
          (l) => l.id !== loanToDelete.id
        ),
      }));

      if (selectedLoan?.id === loanToDelete.id) {
        const customerLoansList = getLoansForCustomer(selectedCustomer);
        const currentLoan = getCurrentLoan(
          customerLoansList.filter((l) => l.id !== loanToDelete.id)
        );
        setSelectedLoan(currentLoan || null);
      }

      setDeleteLoanOpen(false);
      setLoanToDelete(null);
      toast.success("Loan deleted successfully!");
    } catch (e) {
      console.error("Loan deletion error:", e);
      toast.error(`Failed to delete loan: ${e.message}`);
    } finally {
      setDeletingLoan(false);
    }
  };

  const initializeEditLoan = (loan) => {
    setSelectedLoan(loan);
    setLoanFormData({
      amount: loan.amount?.toString() || "",
      rate: loan.rate?.toString() || "",
      tenure: loan.tenure?.toString() || "",
      loanDate: loan.loanDate
        ? new Date(loan.loanDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      area: loan.area || selectedCustomer?.area || "",
    });
    setEditLoanOpen(true);
  };

  const initializeCreateLoan = () => {
    setLoanFormData({
      amount: "",
      rate: "",
      tenure: "",
      loanDate: new Date().toISOString().split("T")[0],
      area: selectedCustomer?.area || "",
    });
    setCreateLoanOpen(true);
  };

  // Handle customer update success
  const handleCustomerUpdateSuccess = (updatedCustomer) => {
    setData((prev) =>
      prev.map((c) =>
        c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
      )
    );
    setSelectedCustomer((prev) =>
      prev && prev.id === updatedCustomer.id
        ? { ...prev, ...updatedCustomer }
        : prev
    );
    setEditOpen(false);
    toast.success("Customer updated successfully!");
  };

  // Updated columns with fixed status display
  const columns = [
    {
      accessorKey: "photoUrl",
      header: "Photo",
      cell: ({ row }) => {
        const url = row.original.photoUrl;
        return url ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <img
                  src={url}
                  alt="Customer"
                  className="h-10 w-10 rounded-full object-cover border shadow-sm"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Customer profile photo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>No profile photo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "customerCode",
      header: "Customer ID",
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded border">
                {row.original.customerCode || "N/A"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Unique customer identifier</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Name <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to sort by name</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="cursor-pointer text-blue-600 hover:underline font-medium transition-colors"
                onClick={() => {
                  setSelectedCustomer(row.original);
                  setDialogOpen(true);
                }}
              >
                {row.original.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view customer details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "aadhar",
      header: "Aadhar",
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-sm">
                {row.original.aadhar || "N/A"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aadhar identification number</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                {row.original.area || "N/A"}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Customer's area/location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const customerLoansList = getLoansForCustomer(row.original);

        // Handle customers with no loans
        if (customerLoansList.length === 0) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-gray-600">
                    No Loans
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Customer has no active loans</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        const hasActiveLoan = customerLoansList.some(
          (loan) => getLoanStatus(loan) === "ACTIVE"
        );
        const hasOverdueLoan = customerLoansList.some(
          (loan) => getLoanStatus(loan) === "OVERDUE"
        );
        const hasCompletedLoan = customerLoansList.some(
          (loan) => getLoanStatus(loan) === "COMPLETED"
        );

        if (hasOverdueLoan) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Customer has overdue payments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        } else if (hasActiveLoan) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Customer has active loans</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        } else if (hasCompletedLoan) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>All loans are completed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        } else {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-gray-600">
                    No Loans
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Customer has no active loans</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
      },
    },
    {
      accessorKey: "loanAmount",
      header: () => <div className="text-right">Loan Amount</div>,
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-right font-medium">
                ₹{Number(row.original.loanAmount ?? 0).toLocaleString("en-IN")}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total loan amount</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        const d = row.original.endDate;
        return d ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  {new Date(d).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Loan end date</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          "N/A"
        );
      },
    },
    {
      accessorKey: "overdueDays",
      header: "Overdue",
      cell: ({ row }) => {
        const end = row.original.endDate
          ? new Date(row.original.endDate)
          : null;
        if (!end) return "N/A";
        const diff = Math.floor((Date.now() - end) / (1000 * 60 * 60 * 24));
        return diff > 0 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {diff} days
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Loan is overdue by {diff} days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-green-600 text-xs font-medium">On time</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Loan payments are on schedule</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Customer actions menu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
  ];

  // Fixed filteredData logic to include all customers with From and To date filters
  const filteredData = useMemo(() => {
    return data.filter((customer) => {
      // Basic search filter
      const globalMatch =
        !globalFilter ||
        customer.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        customer.customerCode
          ?.toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        customer.aadhar?.includes(globalFilter);

      const customerLoansList = getLoansForCustomer(customer);

      // Enhanced status filtering that properly handles customers with no loans
      let statusMatch = true;
      if (statusFilter) {
        const statusFilterLower = statusFilter.toLowerCase();

        if (statusFilterLower === "active") {
          statusMatch = customerLoansList.some(
            (loan) => getLoanStatus(loan) === "ACTIVE"
          );
        } else if (statusFilterLower === "overdue") {
          statusMatch = customerLoansList.some(
            (loan) => getLoanStatus(loan) === "OVERDUE"
          );
        } else if (statusFilterLower === "completed") {
          statusMatch = customerLoansList.some(
            (loan) => getLoanStatus(loan) === "COMPLETED"
          );
        } else if (statusFilterLower === "closed") {
          statusMatch =
            customerLoansList.length === 0 ||
            customerLoansList.every(
              (loan) => getLoanStatus(loan) === "COMPLETED"
            );
        } else if (statusFilterLower === "no-loans") {
          statusMatch = customerLoansList.length === 0;
        } else if (statusFilterLower === "has-loans") {
          statusMatch = customerLoansList.length > 0;
        }
        // If no specific status filter matches, show all (statusMatch remains true)
      }

      const areaMatch = !areaFilter || customer.area === areaFilter;

      // Date range filtering based on loan date
      const loanDate = customer.loanDate ? new Date(customer.loanDate) : null;
      
      const fromDateMatch = !fromDate || (loanDate && loanDate >= new Date(fromDate));
      const toDateMatch = !toDate || (loanDate && loanDate <= new Date(toDate));

      // Now returns true for customers without loans when no status filter is applied
      return (
        globalMatch &&
        statusMatch &&
        areaMatch &&
        fromDateMatch &&
        toDateMatch
      );
    });
  }, [
    data,
    globalFilter,
    statusFilter,
    areaFilter,
    fromDate,
    toDate,
    customerLoans,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const numberOfRepayments = repayments.length;

  const numberOfDocuments = useMemo(() => {
    if (!selectedCustomer) return 0;

    const customerDocs = [
      "aadharDocumentUrl",
      "incomeProofUrl",
      "residenceProofUrl",
      "photoUrl",
    ];
    const customerDocCount = customerDocs.filter(
      (f) => selectedCustomer[f]
    ).length;

    const customerLoansList = getLoansForCustomer(selectedCustomer);
    const currentLoan = getCurrentLoan(customerLoansList);
    const loanDocCount = currentLoan?.documentUrl ? 1 : 0;

    return customerDocCount + loanDocCount;
  }, [selectedCustomer, customerLoans]);

  const renderPageWindow = () => {
    const max = 5;
    const start = Math.max(
      1,
      Math.min(currentPage - Math.floor(max / 2), totalPages - max + 1)
    );
    const end = Math.min(totalPages, start + max - 1);
    const items = [];

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading customers…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* <Toaster /> */}

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">
            View, filter, and edit customer details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {data.length} customer{data.length !== 1 && "s"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of customers in system</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  {filteredData.length} filtered
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of customers after applying filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={refreshCustomerData}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh customer data from server</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                      {showFilters ? "Hide" : "Show"} Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showFilters ? "Hide" : "Show"} advanced filters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {(globalFilter ||
                statusFilter ||
                areaFilter ||
                fromDate ||
                toDate) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGlobalFilter("");
                          setStatusFilter("");
                          setAreaFilter("");
                          setFromDate("");
                          setToDate("");
                        }}
                      >
                        Clear All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear all active filters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                    <option value="">All Customers</option>
                    <option value="active">Active Loans</option>
                    <option value="overdue">Overdue Loans</option>
                    <option value="completed">Completed Loans</option>
                    <option value="no-loans">No Loans</option>
                    <option value="has-loans">Has Loans</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Area</Label>
                  <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={areaOpen}
                        className="w-full justify-between text-sm"
                      >
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
                            <CommandItem
                              onSelect={() => {
                                setAreaFilter("");
                                setAreaOpen(false);
                              }}
                            >
                              All Areas
                            </CommandItem>
                            {availableAreas.map((a) => (
                              <CommandItem
                                key={a}
                                onSelect={() => {
                                  setAreaFilter(a);
                                  setAreaOpen(false);
                                }}
                              >
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
                  <Label className="text-sm">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="To"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table Info and Pagination Controls */}
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{paginatedData.length}</span> of{" "}
          <span className="font-medium">{filteredData.length}</span> customers
          (Total: {data.length})
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Rows per page:</Label>
          <select
            className="rounded border p-1 text-sm"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={paginatedData} />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to previous page</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </PaginationItem>
              {renderPageWindow()}
              <PaginationItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to next page</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Customer Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start gap-3">
              <div>
                <DialogTitle className="text-2xl">Customer Details</DialogTitle>
                <DialogDescription>
                  Full profile for {selectedCustomer?.name}
                </DialogDescription>
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
            <p className="text-center py-8 text-gray-500">
              No customer selected.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Left Sidebar - Customer Profile */}
              <div className="space-y-6 lg:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4">
                      {selectedCustomer.photoUrl ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <img
                                src={selectedCustomer.photoUrl}
                                alt="customer"
                                className="h-24 w-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Customer profile photo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-100">
                                <User className="h-10 w-10 text-gray-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>No profile photo uploaded</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div className="text-center">
                        <div className="font-bold text-lg">
                          {selectedCustomer.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {selectedCustomer.customerCode || "N/A"}
                        </div>
                      </div>
                      {qrCodeUrl ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-2 bg-white border rounded-lg shadow-sm">
                                <img src={qrCodeUrl} alt="QR" className="h-32 w-32" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Customer QR Code - Scan for quick access</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                    <CardTitle className="text-sm font-medium">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                selectedCustomer.customerCode ?? ""
                              )
                            }
                          >
                            <FileText className="h-4 w-4 mr-2" /> Copy Customer ID
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy customer ID to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setEditOpen(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit Profile
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit customer information</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={initializeCreateLoan}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Create Loan
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create new loan for this customer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleDownloadQRCode}
                            disabled={!qrCodeUrl}
                          >
                            <Download className="h-4 w-4 mr-2" /> Download QR Code
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download customer QR code as PNG</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleDownloadStatement}
                          >
                            <Download className="h-4 w-4 mr-2" /> Download Statement
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download repayment history as CSV</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="repayments">
                      Repayments ({numberOfRepayments})
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                      Documents ({numberOfDocuments})
                    </TabsTrigger>
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          {
                            label: "Mobile",
                            value: selectedCustomer.mobile,
                            icon: Phone,
                          },
                          { label: "Aadhar", value: selectedCustomer.aadhar },
                          {
                            label: "Area",
                            value: selectedCustomer.area,
                            icon: MapPin,
                          },
                          {
                            label: "Address",
                            value: selectedCustomer.address,
                            span: true,
                          },
                          {
                            label: "DOB",
                            value: selectedCustomer.dob
                              ? new Date(
                                  selectedCustomer.dob
                                ).toLocaleDateString()
                              : "N/A",
                          },
                          { label: "Gender", value: selectedCustomer.gender },
                          {
                            label: "Spouse Name",
                            value: selectedCustomer.spouseName,
                          },
                          {
                            label: "Parent Name",
                            value: selectedCustomer.parentName,
                          },
                          {
                            label: "Guarantor",
                            value: selectedCustomer.guarantorName,
                          },
                          {
                            label: "Guarantor Aadhar",
                            value: selectedCustomer.guarantorAadhar,
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className={`space-y-1 ${
                              item.span ? "md:col-span-2" : ""
                            }`}
                          >
                            <Label className="text-sm text-gray-500">
                              {item.label}
                            </Label>
                            <div
                              className={`font-medium ${
                                item.icon ? "flex items-center" : ""
                              }`}
                            >
                              {item.icon && (
                                <item.icon className="h-4 w-4 mr-2 text-gray-500" />
                              )}
                              {item.value ?? "N/A"}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Loan Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {[
                            {
                              label: "Loan Amount",
                              value: `₹${Number(
                                selectedCustomer.loanAmount || 0
                              ).toLocaleString("en-IN")}`,
                              icon: DollarSign,
                            },
                            {
                              label: "Total Paid",
                              value: `₹${Number(
                                selectedCustomer.totalPaid || 0
                              ).toLocaleString("en-IN")}`,
                              className: "text-green-600",
                              icon: DollarSign,
                            },
                            {
                              label: "Pending Amount",
                              value: `₹${Number(
                                (selectedCustomer.loanAmount || 0) -
                                  (selectedCustomer.totalPaid || 0)
                              ).toLocaleString("en-IN")}`,
                              className: "text-red-600",
                              icon: DollarSign,
                            },
                            {
                              label: "Loan Date",
                              value: selectedCustomer.loanDate
                                ? new Date(
                                    selectedCustomer.loanDate
                                  ).toLocaleDateString()
                                : "N/A",
                            },
                            {
                              label: "Tenure (months)",
                              value: selectedCustomer.tenure,
                            },
                            {
                              label: "End Date",
                              value: selectedCustomer.endDate
                                ? new Date(
                                    selectedCustomer.endDate
                                  ).toLocaleDateString()
                                : "N/A",
                              icon: Calendar,
                            },
                          ].map((item, index) => (
                            <div key={index} className="space-y-1">
                              <Label className="text-sm text-gray-500">
                                {item.label}
                              </Label>
                              <div
                                className={`flex items-center font-medium text-lg ${
                                  item.className || ""
                                }`}
                              >
                                {item.icon && (
                                  <item.icon className="h-4 w-4 mr-1 text-gray-500" />
                                )}
                                {item.value ?? "N/A"}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Repayment Progress</span>
                            <span>
                              {Math.round(
                                ((selectedCustomer.totalPaid || 0) /
                                  (selectedCustomer.loanAmount || 1)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <ProgressBar
                            value={
                              ((selectedCustomer.totalPaid || 0) /
                                (selectedCustomer.loanAmount || 1)) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fixed All Loans Section - Only shows current and recent closed loans */}
                    {getLoansForDisplay(selectedCustomer)?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Loan History</CardTitle>
                          <CardDescription>
                            {(() => {
                              const customerLoansList = getLoansForCustomer(selectedCustomer);
                              const displayLoans = getLoansForDisplay(selectedCustomer);
                              const total = customerLoansList.length;
                              const displayCount = displayLoans.length;
                              
                              return `${displayCount} of ${total} loan(s) shown - Current and most recent closed loans`;
                            })()}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-2"
                                    onClick={initializeCreateLoan}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add Loan
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Create new loan for this customer</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {getLoansForDisplay(selectedCustomer).map((loan, index) => {
                              const uniqueKey = `${loan.id}-${index}`;
                              const status = getLoanStatus(loan);

                              return (
                                <LoanCard
                                  key={uniqueKey}
                                  loan={loan}
                                  index={index}
                                  status={status}
                                  onEdit={initializeEditLoan}
                                  onDelete={(loan) => {
                                    setLoanToDelete(loan);
                                    setDeleteLoanOpen(true);
                                  }}
                                  onUpload={(loan) => {
                                    setSelectedLoan(loan);
                                    openDocumentUpload("loanAgreement");
                                  }}
                                />
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Repayments Tab */}
                  <TabsContent value="repayments">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Repayment History
                        </CardTitle>
                        <CardDescription>
                          All transactions for {selectedCustomer.name}
                        </CardDescription>
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
                                  <th className="p-3 text-left font-medium">
                                    Date
                                  </th>
                                  <th className="p-3 text-left font-medium">
                                    Amount
                                  </th>
                                  <th className="p-3 text-left font-medium">
                                    Note
                                  </th>
                                  <th className="p-3 text-left font-medium">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {repayments.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="p-3">
                                      {r.dueDate
                                        ? new Date(
                                            r.dueDate
                                          ).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "—"}
                                    </td>
                                    <td className="p-3 font-medium">
                                      ₹
                                      {Number(r.amount || 0).toLocaleString(
                                        "en-IN"
                                      )}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                      {r.note ?? "—"}
                                    </td>
                                    <td className="p-3">
                                      <Badge
                                        variant={
                                          r.status === "PENDING"
                                            ? "destructive"
                                            : "outline"
                                        }
                                        className="text-xs"
                                      >
                                        {r.status || "COMPLETED"}
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
                        <CardTitle className="text-lg">
                          Customer Documents
                        </CardTitle>
                        <CardDescription>
                          Document links for {selectedCustomer.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={initializeCreateLoan}
                                    className="flex items-center gap-1"
                                  >
                                    <Plus className="h-4 w-4" /> Create New Loan
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Create new loan agreement</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="text-sm text-gray-500">
                            {numberOfDocuments} document(s) total
                          </div>
                        </div>
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-3 text-left font-medium">
                                  Document Type
                                </th>
                                <th className="p-3 text-left font-medium">
                                  Status
                                </th>
                                <th className="p-3 text-left font-medium">
                                  File Type
                                </th>
                                <th className="p-3 text-left font-medium">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {/* Profile Photo Row */}
                              <tr className="hover:bg-gray-50">
                                <td className="p-3 font-medium">
                                  Profile Photo
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.photoUrl ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Uploaded
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-gray-600"
                                    >
                                      Not Uploaded
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.photoUrl ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Image
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {selectedCustomer.photoUrl ? (
                                    <div className="flex flex-wrap gap-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                            >
                                              <a
                                                href={selectedCustomer.photoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1"
                                              >
                                                <Eye className="h-4 w-4" /> View
                                              </a>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View profile photo</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                            >
                                              <a
                                                href={selectedCustomer.photoUrl}
                                                download
                                                className="flex items-center gap-1"
                                              >
                                                <Download className="h-4 w-4" />{" "}
                                                Download
                                              </a>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Download profile photo</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                openDocumentUpload("photoUrl")
                                              }
                                              className="flex items-center gap-1"
                                            >
                                              <Pencil className="h-4 w-4" /> Modify
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Update profile photo</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                openDocumentDelete("photoUrl")
                                              }
                                              className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-4 w-4" /> Delete
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Delete profile photo</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  ) : (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              openDocumentUpload("photoUrl")
                                            }
                                            className="flex items-center gap-1"
                                          >
                                            <Upload className="h-4 w-4" /> Upload
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Upload profile photo</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </td>
                              </tr>

                              {/* Document Rows */}
                              {[
                                {
                                  title: "Aadhar Document",
                                  field: "aadharDocumentUrl",
                                },
                                {
                                  title: "Income Proof",
                                  field: "incomeProofUrl",
                                },
                                {
                                  title: "Residence Proof",
                                  field: "residenceProofUrl",
                                },
                              ].map((doc, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="p-3 font-medium">
                                    {doc.title}
                                  </td>
                                  <td className="p-3">
                                    {selectedCustomer[doc.field] ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Uploaded
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-gray-600"
                                      >
                                        Not Uploaded
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {selectedCustomer[doc.field] ? (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {selectedCustomer[doc.field]
                                          .toLowerCase()
                                          .endsWith(".pdf")
                                          ? "PDF"
                                          : "Document"}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-gray-500">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {selectedCustomer[doc.field] ? (
                                      <div className="flex flex-wrap gap-2">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                              >
                                                <a
                                                  href={selectedCustomer[doc.field]}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-1"
                                                >
                                                  <Eye className="h-4 w-4" />
                                                  {selectedCustomer[doc.field]
                                                    .toLowerCase()
                                                    .endsWith(".pdf")
                                                    ? "View PDF"
                                                    : "View"}
                                                </a>
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>View {doc.title.toLowerCase()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                              >
                                                <a
                                                  href={selectedCustomer[doc.field]}
                                                  download
                                                  className="flex items-center gap-1"
                                                >
                                                  <Download className="h-4 w-4" />{" "}
                                                  Download
                                                </a>
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Download {doc.title.toLowerCase()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  openDocumentUpload(doc.field)
                                                }
                                                className="flex items-center gap-1"
                                              >
                                                <Pencil className="h-4 w-4" /> Modify
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Update {doc.title.toLowerCase()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  openDocumentDelete(doc.field)
                                                }
                                                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" /> Delete
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Delete {doc.title.toLowerCase()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    ) : (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                openDocumentUpload(doc.field)
                                              }
                                              className="flex items-center gap-1"
                                            >
                                              <Upload className="h-4 w-4" /> Upload
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Upload {doc.title.toLowerCase()}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </td>
                                </tr>
                              ))}

                              {/* Loan Agreement Row */}
                              {(() => {
                                const customerLoansList =
                                  getLoansForCustomer(selectedCustomer);
                                const currentLoan =
                                  getCurrentLoan(customerLoansList);

                                if (!currentLoan) {
                                  return (
                                    <tr className="hover:bg-gray-50">
                                      <td className="p-3 font-medium">
                                        Loan Agreement
                                      </td>
                                      <td className="p-3">
                                        <Badge
                                          variant="outline"
                                          className="text-gray-600"
                                        >
                                          No Loans Found
                                        </Badge>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-sm text-gray-500">
                                          -
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={initializeCreateLoan}
                                                className="flex items-center gap-1"
                                              >
                                                <Plus className="h-4 w-4" /> Create
                                                Loan
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Create first loan agreement</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </td>
                                    </tr>
                                  );
                                }

                                const loanStatus = getLoanStatus(currentLoan);

                                return (
                                  <tr
                                    key={currentLoan.id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="p-3 font-medium">
                                      <div className="flex items-center gap-2">
                                        Current Loan Agreement
                                        <Badge
                                          className={
                                            loanStatus === "ACTIVE"
                                              ? "bg-green-100 text-green-800"
                                              : loanStatus === "COMPLETED"
                                              ? "bg-blue-100 text-blue-800"
                                              : loanStatus === "OVERDUE"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                                          }
                                        >
                                          {loanStatus}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Amount: ₹
                                        {Number(
                                          currentLoan.amount || 0
                                        ).toLocaleString("en-IN")}{" "}
                                        | Created:{" "}
                                        {currentLoan.loanDate
                                          ? new Date(
                                              currentLoan.loanDate
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {currentLoan.documentUrl ? (
                                        <Badge className="bg-green-100 text-green-800">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Uploaded
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-gray-600"
                                        >
                                          Not Uploaded
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {currentLoan.documentUrl ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {currentLoan.documentUrl
                                            .toLowerCase()
                                            .endsWith(".pdf")
                                            ? "PDF"
                                            : "Document"}
                                        </Badge>
                                      ) : (
                                        <span className="text-sm text-gray-500">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {currentLoan.documentUrl ? (
                                        <div className="flex flex-wrap gap-2">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  asChild
                                                >
                                                  <a
                                                    href={currentLoan.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1"
                                                  >
                                                    <Eye className="h-4 w-4" />
                                                    {currentLoan.documentUrl
                                                      .toLowerCase()
                                                      .endsWith(".pdf, .doc, .docx, .jpg, .png, .jpeg")
                                                      ? "View Document"
                                                      : "View"}
                                                  </a>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>View loan agreement</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  asChild
                                                >
                                                  <a
                                                    href={currentLoan.documentUrl}
                                                    download
                                                    className="flex items-center gap-1"
                                                  >
                                                    <Download className="h-4 w-4" />{" "}
                                                    Download
                                                  </a>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Download loan agreement</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setSelectedLoan(currentLoan);
                                                    openDocumentUpload(
                                                      "loanAgreement"
                                                    );
                                                  }}
                                                  className="flex items-center gap-1"
                                                >
                                                  <Pencil className="h-4 w-4" />{" "}
                                                  Modify
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Update loan agreement document</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleDeleteLoanDocument(
                                                      currentLoan
                                                    )
                                                  }
                                                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                  <Trash2 className="h-4 w-4" />{" "}
                                                  Delete
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Delete loan agreement document</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    initializeEditLoan(currentLoan)
                                                  }
                                                  className="flex items-center gap-1"
                                                >
                                                  <Edit className="h-4 w-4" /> Edit
                                                  Loan
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Edit loan details</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap gap-2">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setSelectedLoan(currentLoan);
                                                    openDocumentUpload(
                                                      "loanAgreement"
                                                    );
                                                  }}
                                                  className="flex items-center gap-1"
                                                >
                                                  <Upload className="h-4 w-4" />{" "}
                                                  Upload
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Upload loan agreement document</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    initializeEditLoan(currentLoan)
                                                  }
                                                  className="flex items-center gap-1"
                                                >
                                                  <Edit className="h-4 w-4" /> Edit
                                                  Loan
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Edit loan details</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        open={documentUploadOpen}
        onOpenChange={setDocumentUploadOpen}
        documentType={
          currentDocumentField === "loanAgreement"
            ? "Loan Agreement"
            : currentDocumentField?.replace("Url", "") || "Document"
        }
        onSubmit={
          currentDocumentField === "loanAgreement"
            ? handleLoanDocumentUpdate
            : handleDocumentUpload
        }
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        loading={uploadingDocument}
      />

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog
        open={deleteDocumentDialog}
        onOpenChange={setDeleteDocumentDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently
              removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteDocument}
            >
              {deletingDocument ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Document"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      rate: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      tenure: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanDate">Loan Date *</Label>
                <Input
                  id="loanDate"
                  type="date"
                  value={loanFormData.loanDate}
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      loanDate: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      area: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateLoanOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingLoan}>
                {creatingLoan && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      rate: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      tenure: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-loanDate">Loan Date *</Label>
                <Input
                  id="edit-loanDate"
                  type="date"
                  value={loanFormData.loanDate}
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      loanDate: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setLoanFormData((prev) => ({
                      ...prev,
                      area: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditLoanOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingLoan}>
                {updatingLoan && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Loan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Loan Alert */}
      <AlertDialog open={deleteLoanOpen} onOpenChange={setDeleteLoanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              loan agreement
              {loanToDelete?.documentUrl && " and its associated document"}.
              {loanToDelete?.status === "ACTIVE" &&
                " This loan is currently active."}
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

      {/* Fixed Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update any field of the selected customer.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <EditCustomerForm
              customer={selectedCustomer}
              areas={areas}
              onSave={handleCustomerUpdateSuccess}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Customer Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated repayments, loans,
              and documents will be permanently removed.
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