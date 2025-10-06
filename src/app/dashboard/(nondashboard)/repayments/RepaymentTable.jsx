"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Search,
  Filter,
  X,
  Eye,
  Edit,
  Download,
  Calendar,
  CreditCard,
  BadgeCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Save,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

/* ================= Pagination Component ================= */
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

/* ================= Helper Functions ================= */
const getStatusBadge = (status) => {
  switch (status) {
    case "PAID":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 py-1">
          <BadgeCheck className="h-3 w-3" /> Paid
        </Badge>
      );
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="text-amber-600 border-amber-300 flex items-center gap-1 py-1"
        >
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge variant="destructive" className="flex items-center gap-1 py-1">
          <AlertCircle className="h-3 w-3" /> Overdue
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

/* ================= Payment Method Badge ================= */
const getPaymentMethodBadge = (paymentMethod) => {
  if (!paymentMethod) return null;
  
  const methodConfig = {
    CASH: { label: "Cash", className: "bg-green-100 text-green-800 border-green-200" },
    UPI: { label: "UPI", className: "bg-purple-100 text-purple-800 border-purple-200" },
    BANK_TRANSFER: { label: "Bank Transfer", className: "bg-blue-100 text-blue-800 border-blue-200" },
    CHEQUE: { label: "Cheque", className: "bg-orange-100 text-orange-800 border-orange-200" },
    OTHER: { label: "Other", className: "bg-gray-100 text-gray-800 border-gray-200" }
  };

  const config = methodConfig[paymentMethod] || { label: paymentMethod, className: "bg-gray-100 text-gray-800 border-gray-200" };
  
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ================= Consistent Pending Amount Logic ================= */
const calculateTotalPaid = (repayment, allRepayments) => {
  if (!repayment?.loanId) return 0;
  
  // Sum all repayments for this loan
  const loanRepayments = allRepayments.filter((r) => r.loanId === repayment.loanId);
  return loanRepayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
};

const getPendingAmount = (repayment, allRepayments = []) => {
  if (!repayment?.loanId) return 0;

  // Sort all repayments for this loan by dueDate
  const loanRepayments = allRepayments
    .filter((r) => r.loanId === repayment.loanId)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const loanAmount = getLoanAmount(repayment);
  let runningBalance = loanAmount;

  // Iterate through repayments up to the current one
  for (let r of loanRepayments) {
    if (new Date(r.dueDate) <= new Date(repayment.dueDate)) {
      runningBalance -= Number(r.amount) || 0;
    }
    // Stop if we reach the current repayment to get its pending amount
    if (r.id === repayment.id) break;
  }

  return Math.max(0, runningBalance); // Ensure balance doesn't go negative
};

const getLoanAmount = (repayment) => {
  return Number(repayment.loan?.loanAmount) || Number(repayment.loanAmount) || 0;
};

const getCustomerData = (repayment) => {
  return {
    customerCode: repayment.customer?.customerCode || repayment.customerCode || "N/A",
    customerName: repayment.customer?.customerName || repayment.customerName || "N/A",
    aadhar: repayment.customer?.aadhar || repayment.aadhar || "N/A",
    areaId: repayment.customer?.areaId || "N/A"
  };
};

/* ================= Get consistent total paid for display ================= */
const getTotalPaidAmount = (repayment, allRepayments) => {
  return calculateTotalPaid(repayment, allRepayments);
};

/* ================= Create Repayment Form ================= */
function CreateRepaymentForm({ onCreated, onClose, customers = [], loans = [] }) {
  const [formData, setFormData] = useState({
    loanId: "",
    customerId: "",
    amount: "",
    dueDate: "",
    status: "PENDING",
    notes: "",
    paymentMethod: "CASH"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Filter loans based on selected customer
  const customerLoans = loans.filter(loan => 
    formData.customerId ? loan.customerId === formData.customerId : true
  );

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.loanId) newErrors.loanId = "Loan is required";
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Valid amount is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/repayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount)
        }),
      });

      if (!res.ok) throw new Error("Failed to create repayment");

      const newRepayment = await res.json();
      
      if (onCreated) onCreated(newRepayment);
      if (onClose) onClose();
      
      // Reset form
      setFormData({
        loanId: "",
        customerId: "",
        amount: "",
        dueDate: "",
        status: "PENDING",
        notes: "",
        paymentMethod: "CASH"
      });
    } catch (err) {
      console.error(err);
      alert("Error creating repayment");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({
      ...prev,
      customerId,
      loanId: "" // Reset loan when customer changes
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer *</Label>
          <Select 
            value={formData.customerId} 
            onValueChange={handleCustomerChange}
          >
            <SelectTrigger className={errors.customerId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.customerName} ({customer.customerCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId}</p>}
        </div>

        {/* Loan Selection */}
        <div className="space-y-2">
          <Label htmlFor="loanId">Loan *</Label>
          <Select 
            value={formData.loanId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, loanId: value }))}
            disabled={!formData.customerId}
          >
            <SelectTrigger className={errors.loanId ? "border-red-500" : ""}>
              <SelectValue placeholder={
                formData.customerId ? "Select loan" : "Select customer first"
              } />
            </SelectTrigger>
            <SelectContent>
              {customerLoans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>
                  Loan #{loan.id} - ₹{loan.loanAmount?.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.loanId && <p className="text-red-500 text-sm">{errors.loanId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className={errors.amount ? "border-red-500" : ""}
              min="0"
              step="1"
            />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className={errors.dueDate ? "border-red-500" : ""}
            />
            {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Status and Payment Method */}
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about this repayment..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Repayment"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ================= Delete Confirmation Dialog ================= */
function DeleteConfirmationDialog({ repayment, onDelete, onClose }) {
  const [loading, setLoading] = useState(false);
  const { customerName, customerCode } = getCustomerData(repayment);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete repayment");

      if (onDelete) onDelete(repayment.id);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert("Error deleting repayment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Warning: This action cannot be undone</span>
        </div>
        <p className="text-red-700 text-sm mt-2">
          You are about to delete the repayment for <strong>{customerName}</strong> ({customerCode}) 
          with amount <strong>₹{(repayment.amount || 0).toLocaleString()}</strong> due on <strong>{formatDate(repayment.dueDate)}</strong>.
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDelete} 
          disabled={loading}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {loading ? "Deleting..." : "Delete Repayment"}
        </Button>
      </div>
    </div>
  );
}

/* ================= Editable Amount Component ================= */
function EditableAmount({ repayment, onUpdate, allRepayments }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(repayment.amount);
  const [loading, setLoading] = useState(false);

  const saveChange = async () => {
    if (Number(value) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    const loanAmount = getLoanAmount(repayment);

    // Check if new amount would exceed the loan amount
    if (Number(value) > loanAmount) {
      alert(`Amount cannot exceed loan amount of ₹${loanAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(value) }),
      });

      if (!res.ok) throw new Error("Failed to update repayment");

      const updatedRepayment = await res.json();
      setEditing(false);
      if (onUpdate) onUpdate(updatedRepayment);
    } catch (err) {
      alert("Error updating repayment");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setValue(repayment.amount);
    setEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") saveChange();
    else if (e.key === "Escape") cancelEdit();
  };

  return editing ? (
    <div className="flex items-center gap-2">
      <div className="relative">
        <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-28 h-8 text-sm pl-7"
          autoFocus
          min="0"
          max={getLoanAmount(repayment)}
        />
      </div>
      <Button size="sm" className="h-7 px-2" onClick={saveChange} disabled={loading}>
        {loading ? "..." : "✓"}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelEdit}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="text-right font-semibold cursor-pointer hover:underline hover:text-blue-600 transition-colors flex items-center justify-end gap-1"
            onClick={() => setEditing(true)}
          >
            <IndianRupee className="h-3.5 w-3.5" />
            {(Number(repayment.amount) || 0).toLocaleString()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to edit amount</p>
          <p className="text-xs text-gray-500">
            Loan Amount: ₹{getLoanAmount(repayment).toLocaleString()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ================= Edit Repayment Form ================= */
function EditRepaymentForm({ repayment, onUpdate, onClose, allRepayments }) {
  const [formData, setFormData] = useState({
    amount: repayment.amount || 0,
    dueDate: repayment.dueDate?.split("T")[0] || "",
    status: repayment.status || "PENDING",
    notes: repayment.notes || "",
    paymentMethod: repayment.paymentMethod || "CASH"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loanAmount = getLoanAmount(repayment);
  const totalPaid = getTotalPaidAmount(repayment, allRepayments);
  const pendingAmount = getPendingAmount(repayment, allRepayments);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Valid amount is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (Number(formData.amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    // Check if new amount would exceed the loan amount
    if (Number(formData.amount) > loanAmount) {
      alert(`Amount cannot exceed loan amount of ₹${loanAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(formData.amount),
          dueDate: formData.dueDate,
          status: formData.status,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod
        }),
      });

      if (!res.ok) throw new Error("Failed to update repayment");

      const updatedRepayment = await res.json();
      if (onUpdate) onUpdate(updatedRepayment);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert("Error updating repayment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (₹) *</Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className={errors.amount ? "border-red-500" : ""}
            min="0"
            max={loanAmount}
          />
          {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label>Due Date *</Label>
          <Input 
            type="date" 
            value={formData.dueDate} 
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            className={errors.dueDate ? "border-red-500" : ""}
          />
          {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate}</p>}
        </div>
      </div>

      {/* Status and Payment Method */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className={errors.status ? "border-red-500" : ""}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select 
            value={formData.paymentMethod} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this repayment..."
          rows={3}
        />
      </div>

      {/* Loan summary */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <Label className="text-sm font-medium">Loan Summary</Label>
        <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
          <div>
            <div className="text-gray-600">Loan Amount:</div>
            <div className="font-medium">₹{loanAmount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Paid:</div>
            <div className="font-medium text-green-600">₹{totalPaid.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-600">Pending:</div>
            <div className="font-medium text-red-600">₹{pendingAmount.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Note: Pending amount is consistent across all repayments for this loan
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/* ================= ActionButtons Component ================= */
function ActionButtons({ repayment, onUpdate, onDelete, allRepayments }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { customerCode, customerName, aadhar } = getCustomerData(repayment);

  const loanAmount = getLoanAmount(repayment);
  const totalPaid = getTotalPaidAmount(repayment, allRepayments);
  const pendingAmount = getPendingAmount(repayment, allRepayments);

  return (
    <div className="flex gap-2">
      {/* View dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Repayment Details
            </DialogTitle>
            <DialogDescription>View detailed information about this repayment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Customer ID</Label>
                <p className="text-sm font-medium">{customerCode}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Aadhar Number</Label>
                <p className="text-sm font-medium">{aadhar}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Customer Name</Label>
              <p className="text-sm font-medium">{customerName}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Loan Amount</Label>
                <p className="text-sm font-medium">{formatCurrency(loanAmount)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total Paid</Label>
                <p className="text-sm font-medium text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Pending Amount</Label>
                <p className="text-sm font-medium text-red-600">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">This Repayment</Label>
                <p className="text-sm font-medium">{formatCurrency(repayment.amount || 0)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <p className="text-sm font-medium">{formatDate(repayment.dueDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>{getStatusBadge(repayment.status)}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Payment Method</Label>
                <div>{getPaymentMethodBadge(repayment.paymentMethod)}</div>
              </div>
            </div>

            {repayment.notes && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{repayment.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Repayment
            </DialogTitle>
            <DialogDescription>Update repayment details</DialogDescription>
          </DialogHeader>
          <EditRepaymentForm
            repayment={repayment}
            onUpdate={onUpdate}
            onClose={() => setEditDialogOpen(false)}
            allRepayments={allRepayments}
          />
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Repayment
            </DialogTitle>
            <DialogDescription>Permanently delete this repayment record</DialogDescription>
          </DialogHeader>
          <DeleteConfirmationDialog
            repayment={repayment}
            onDelete={onDelete}
            onClose={() => setDeleteDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= Custom Pagination Component ================= */
function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  currentItemsCount,
}) {
  const maxVisiblePages = 5;

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
      <div className="text-sm text-gray-600">
        Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
        {(currentPage - 1) * itemsPerPage + currentItemsCount} of {totalItems} entries
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="itemsPerPage" className="text-sm text-gray-600">
            Rows per page:
          </Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers().map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => onPageChange(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

/* ================= Simple Table Component ================= */
function SimpleTable({ columns, data }) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column.accessorKey || column.id} className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                {typeof column.header === 'function' ? column.header() : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row, index) => (
            <tr key={row.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.accessorKey || column.id} className="p-4 align-middle">
                  {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= Main Component ================= */
export default function RepaymentTable({ repayments: propRepayments = [] }) {
  // Use prop repayments if provided, otherwise use internal state
  const [internalRepayments, setInternalRepayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(!propRepayments); // Only load if no props provided
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [urlFilters, setUrlFilters] = useState({ area: "", customer: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);

  // Use prop repayments if provided, otherwise use internal state
  const repayments = propRepayments.length > 0 ? propRepayments : internalRepayments;

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ---------- Debug data structure ---------- */
  useEffect(() => {
    if (currentItems.length > 0) {
      console.log('Sample repayment data structure:', currentItems[0]);
      console.log('All repayments count:', repayments.length);
      console.log('Filtered repayments count:', filtered.length);
    }
  }, [currentItems, repayments, filtered]);

  /* ---------- URL query handling ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const area = params.get("area") || "";
    const customer = params.get("customer") || "";
    setUrlFilters({ area, customer });
    if (customer && !search) setSearch(customer);
  }, []);

  /* ---------- fetch data ---------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Only fetch repayments if no prop repayments provided
      const [repaymentsRes, customersRes, loansRes] = await Promise.all([
        propRepayments.length === 0 ? fetch("/api/repayments") : Promise.resolve({ json: () => Promise.resolve([]) }),
        fetch("/api/customers"),
        fetch("/api/loans")
      ]);

      const repaymentsData = propRepayments.length === 0 ? await repaymentsRes.json() : [];
      const customersData = await customersRes.json();
      const loansData = await loansRes.json();
      
      console.log("=== API RESPONSE DEBUG ===");
      console.log("Repayments API response:", repaymentsData);
      if (repaymentsData.length > 0) {
        console.log("First repayment structure:", repaymentsData[0]);
        console.log("Repayment keys:", Object.keys(repaymentsData[0]));
      }
      console.log("=== END DEBUG ===");
      
      // Only set internal repayments if no props provided
      if (propRepayments.length === 0) {
        setInternalRepayments(repaymentsData);
        setFiltered(repaymentsData);
      }
      setCustomers(customersData);
      setLoans(loansData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update state functions to work with both scenarios
  const updateRepaymentInState = (updatedRepayment) => {
    if (propRepayments.length > 0) {
      // If using props, we can't update internal state
      // The parent component should handle updates
      console.log("Repayment updated (prop mode):", updatedRepayment);
    } else {
      setInternalRepayments((prev) => prev.map((r) => r.id === updatedRepayment.id ? updatedRepayment : r));
    }
    setFiltered((prev) => prev.map((r) => r.id === updatedRepayment.id ? updatedRepayment : r));
  };

  const deleteRepaymentFromState = (repaymentId) => {
    if (propRepayments.length > 0) {
      // If using props, the parent component should handle deletions
      console.log("Repayment deleted (prop mode):", repaymentId);
    } else {
      setInternalRepayments((prev) => prev.filter((r) => r.id !== repaymentId));
    }
    setFiltered((prev) => prev.filter((r) => r.id !== repaymentId));
  };

  const addRepaymentToState = (newRepayment) => {
    if (propRepayments.length > 0) {
      // If using props, the parent component should handle additions
      console.log("Repayment added (prop mode):", newRepayment);
    } else {
      setInternalRepayments((prev) => [newRepayment, ...prev]);
    }
    setFiltered((prev) => [newRepayment, ...prev]);
  };

  // Only fetch data if no prop repayments provided
  useEffect(() => {
    if (propRepayments.length === 0) {
      fetchData();
    } else {
      // If props provided, use them directly
      setFiltered(propRepayments);
      setLoading(false);
    }
  }, [propRepayments]);

  /* ---------- Sync filtered state with repayments prop ---------- */
  useEffect(() => {
    if (propRepayments.length > 0) {
      setFiltered(propRepayments);
    }
  }, [propRepayments]);

  /* ---------- reset page on filter change ---------- */
  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? 1 : prev));
  }, [search, status, paymentMethod, fromDate, toDate, sortConfig, urlFilters, totalPages]);

  /* ---------- filtering & sorting ---------- */
  useEffect(() => {
    let data = [...repayments];

    // URL filters
    if (urlFilters.area) {
      data = data.filter((r) => r.customer?.areaId === urlFilters.area);
    }
    if (urlFilters.customer) {
      data = data.filter((r) => r.customer?.customerCode === urlFilters.customer);
    }

    // Text search
    if (search) {
      const lc = search.toLowerCase();
      data = data.filter((r) => {
        const customerData = getCustomerData(r);
        return (
          customerData.customerCode.toLowerCase().includes(lc) ||
          customerData.aadhar.toLowerCase().includes(lc) ||
          customerData.customerName.toLowerCase().includes(lc)
        );
      });
    }

    // Status
    if (status !== "ALL") {
      data = data.filter((r) => r.status === status);
    }

    // Payment Method
    if (paymentMethod !== "ALL") {
      data = data.filter((r) => r.paymentMethod === paymentMethod);
    }

    // Date range
    if (fromDate) data = data.filter((r) => new Date(r.dueDate) >= new Date(fromDate));
    if (toDate) data = data.filter((r) => new Date(r.dueDate) <= new Date(toDate));

    // Sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aVal, bVal;

        if (sortConfig.key === "aadhar") {
          aVal = getCustomerData(a).aadhar;
          bVal = getCustomerData(b).aadhar;
        } else if (sortConfig.key === "pendingAmount") {
          aVal = getPendingAmount(a, repayments);
          bVal = getPendingAmount(b, repayments);
        } else if (sortConfig.key === "totalPaid") {
          aVal = getTotalPaidAmount(a, repayments);
          bVal = getTotalPaidAmount(b, repayments);
        } else if (sortConfig.key === "loanAmount") {
          aVal = getLoanAmount(a);
          bVal = getLoanAmount(b);
        } else if (sortConfig.key === "customerCode") {
          aVal = getCustomerData(a).customerCode;
          bVal = getCustomerData(b).customerCode;
        } else if (sortConfig.key === "customerName") {
          aVal = getCustomerData(a).customerName;
          bVal = getCustomerData(b).customerName;
        } else {
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
        }

        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    setFiltered(data);
  }, [search, status, paymentMethod, fromDate, toDate, repayments, sortConfig, urlFilters]);

  /* ---------- UI helpers ---------- */
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const clearUrlFilters = () => {
    setUrlFilters({ area: "", customer: "" });
    setSearch("");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = [
      "Customer ID", "Customer Name", "Aadhar Number", "Loan Amount", 
      "This Repayment", "Total Paid", "Pending Amount", "Due Date", 
      "Payment Method", "Status", "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...filtered.map((row) => {
        const customerData = getCustomerData(row);
        const loanAmount = getLoanAmount(row);
        const totalPaid = getTotalPaidAmount(row, repayments);
        const pendingAmount = getPendingAmount(row, repayments);
        
        return [
          `"${customerData.customerCode}"`,
          `"${customerData.customerName}"`,
          `"${customerData.aadhar}"`,
          loanAmount,
          row.amount || 0,
          totalPaid,
          pendingAmount,
          `"${formatDate(row.dueDate || "")}"`,
          `"${row.paymentMethod || ""}"`,
          `"${row.status || ""}"`,
          `"${row.notes || ""}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `repayments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortableHeader = ({ columnKey, children }) => (
    <div className="flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort(columnKey)}>
      {children}
      {sortConfig.key === columnKey ? (
        sortConfig.direction === "ascending" ? (
          <ChevronUp className="h-4 w-4 ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-1" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
      )}
    </div>
  );

  /* ---------- Column definitions ---------- */
  const columns = [
    {
      accessorKey: "customerCode",
      header: () => <SortableHeader columnKey="customerCode">Customer ID</SortableHeader>,
      cell: ({ row }) => {
        const { customerCode, customerName } = getCustomerData(row.original);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-full">
              <User className="h-3.5 w-3.5 text-blue-700" />
            </div>
            <div>
              <span className="font-medium text-sm block">{customerCode}</span>
              <span className="text-xs text-gray-500 block">{customerName}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: () => <SortableHeader columnKey="customerName">Customer Name</SortableHeader>,
      cell: ({ row }) => {
        const { customerName } = getCustomerData(row.original);
        return <span className="text-sm">{customerName}</span>;
      },
    },
    {
      accessorKey: "aadhar",
      header: () => <SortableHeader columnKey="aadhar">Aadhar Number</SortableHeader>,
      cell: ({ row }) => {
        const { aadhar } = getCustomerData(row.original);
        return <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{aadhar}</span>;
      },
    },
    {
      accessorKey: "loanAmount",
      header: () => (
        <div className="text-right"><SortableHeader columnKey="loanAmount">Loan Amount</SortableHeader></div>
      ),
      cell: ({ row }) => {
        const loanAmount = getLoanAmount(row.original);
        return (
          <div className="text-right font-semibold">
            <IndianRupee className="h-3.5 w-3.5 inline mr-1" />
            {loanAmount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-right"><SortableHeader columnKey="amount">This Repayment</SortableHeader></div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <EditableAmount repayment={row.original} onUpdate={updateRepaymentInState} allRepayments={repayments} />
        </div>
      ),
    },
    {
      accessorKey: "totalPaid",
      header: () => (
        <div className="text-right"><SortableHeader columnKey="totalPaid">Total Paid</SortableHeader></div>
      ),
      cell: ({ row }) => {
        const totalPaid = getTotalPaidAmount(row.original, repayments);
        return (
          <div className="text-right font-semibold text-green-600">
            <IndianRupee className="h-3.5 w-3.5 inline mr-1" />
            {totalPaid.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "pendingAmount",
      header: () => (
        <div className="text-right"><SortableHeader columnKey="pendingAmount">Running Balance</SortableHeader></div>
      ),
      cell: ({ row }) => {
        const pending = getPendingAmount(row.original, repayments);
        return (
          <div className="text-right font-semibold text-red-600">
            <IndianRupee className="h-3.5 w-3.5 inline mr-1" />
            {pending.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: () => <SortableHeader columnKey="dueDate">Due Date</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          {formatDate(row.original.dueDate)}
        </div>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => getPaymentMethodBadge(row.original.paymentMethod),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionButtons 
          repayment={row.original} 
          onUpdate={updateRepaymentInState} 
          onDelete={deleteRepaymentFromState}
          allRepayments={repayments} 
        />
      ),
    },
  ];

  /* ---------- render ---------- */
  return (
    <div className="space-y-6 p-6 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Repayment Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all loan repayments in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 gap-1.5">
            <CreditCard className="h-4 w-4" />
            {filtered.length} repayment{filtered.length !== 1 ? "s" : ""}
          </Badge>

          <Button onClick={handleExport} className="h-10 gap-2" disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* URL‑filter banner */}
      {(urlFilters.area || urlFilters.customer) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-blue-100 text-blue-800">Active Filters</Badge>
                <div className="flex flex-wrap gap-2">
                  {urlFilters.area && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Area: {urlFilters.area}
                    </Badge>
                  )}
                  {urlFilters.customer && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <User className="h-3 w-3" /> Customer: {urlFilters.customer}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearUrlFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <X className="h-3 w-3 mr-1" /> Clear URL Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { bg: "blue", text: "Total Repayments", count: repayments.length, icon: CreditCard },
          { bg: "green", text: "Paid", count: repayments.filter((r) => r.status === "PAID").length, icon: BadgeCheck },
          { bg: "amber", text: "Pending", count: repayments.filter((r) => r.status === "PENDING").length, icon: Clock },
          { bg: "red", text: "Overdue", count: repayments.filter((r) => r.status === "OVERDUE").length, icon: AlertCircle },
        ].map((card, index) => (
          <Card key={index} className={`bg-${card.bg}-50 border-${card.bg}-100`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium text-${card.bg}-700`}>{card.text}</p>
                  <h3 className="text-2xl font-bold mt-1">{card.count}</h3>
                </div>
                <div className={`p-2 bg-${card.bg}-100 rounded-full`}>
                  <card.icon className={`h-5 w-5 text-${card.bg}-700`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" /> Filters & Search
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1">
                {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              {(search || status !== "ALL" || paymentMethod !== "ALL" || fromDate || toDate) && (
                <Button variant="ghost" size="sm" onClick={() => { 
                  setSearch(""); 
                  setStatus("ALL"); 
                  setPaymentMethod("ALL");
                  setFromDate(""); 
                  setToDate(""); 
                }}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search by customer code, name, or Aadhar number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue placeholder="All Methods" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Methods</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>

                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2"><Label className="text-sm">From Date</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-sm">To Date</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No repayments found</h3>
              <p className="text-gray-500">
                {repayments.length === 0 ? "No repayment records available." : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              {repayments.length === 0 && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)} 
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Repayment
                </Button>
              )}
            </div>
          ) : (
            <>
              <SimpleTable columns={columns} data={currentItems} />
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalItems}
                currentItemsCount={currentItems.length}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}