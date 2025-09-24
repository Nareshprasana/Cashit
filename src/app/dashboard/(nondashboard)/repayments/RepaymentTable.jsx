"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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

// ================= Status Badge =================
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

// ================= Formatters =================
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

// ================= Helper function to calculate total paid for a loan =================
const calculateTotalPaid = (repayment, allRepayments) => {
  if (!repayment?.loanId) return 0;
  
  return allRepayments
    .filter(r => r.loanId === repayment.loanId)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
};

// ================= Helper function to calculate pending amount =================
const calculatePendingAmount = (repayment, allRepayments) => {
  const loanAmount = Number(repayment.loan?.amount) || 0;
  
  if (!repayment?.loanId) return loanAmount;
  
  // Get all repayments for this specific loan
  const loanRepayments = allRepayments.filter(
    r => r.loanId === repayment.loanId
  );
  
  // Calculate total paid (sum of all repayments for this loan)
  const totalPaid = loanRepayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  
  // Pending amount = Loan amount - Total paid
  const pending = loanAmount - totalPaid;
  
  // Ensure pending amount is not negative
  return Math.max(0, pending);
};

// ================= Helper function to calculate remaining installments =================
const calculateRemainingInstallments = (repayment, allRepayments) => {
  const totalInstallments = Number(repayment.loan?.installments) || 1;
  
  if (!repayment?.loanId) return totalInstallments;
  
  // Count how many repayments have been made for this loan
  const paidInstallments = allRepayments.filter(
    r => r.loanId === repayment.loanId && r.status === "PAID"
  ).length;
  
  return Math.max(0, totalInstallments - paidInstallments);
};

// ================= Editable Amount Component =================
function EditableAmount({ repayment, onUpdate, allRepayments }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(repayment.amount);
  const [loading, setLoading] = useState(false);

  const saveChange = async () => {
    if (Number(value) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    const pendingAmount = calculatePendingAmount(repayment, allRepayments);
    const currentRepaymentAmount = Number(repayment.amount) || 0;
    
    // Check if new amount would exceed pending amount
    if (Number(value) > pendingAmount + currentRepaymentAmount) {
      alert(`Amount cannot exceed pending amount of ₹${pendingAmount.toLocaleString()}`);
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
      setEditing(false);
      if (onUpdate) onUpdate();
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
    if (e.key === 'Enter') {
      saveChange();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return editing ? (
    <div className="flex items-center gap-2">
      <div className="relative">
        <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-28 h-8 text-sm pl-7"
          autoFocus
          min="0"
        />
      </div>
      <Button
        size="sm"
        className="h-7 px-2"
        onClick={saveChange}
        disabled={loading}
      >
        {loading ? "..." : "✓"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2"
        onClick={cancelEdit}
      >
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
          <p className="text-xs text-gray-500">Pending: ₹{calculatePendingAmount(repayment, allRepayments).toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ================= Edit Repayment Form =================
function EditRepaymentForm({ repayment, onUpdate, onClose, allRepayments }) {
  const [amount, setAmount] = useState(repayment.amount || 0);
  const [date, setDate] = useState(repayment.dueDate?.split('T')[0] || '');
  const [status, setStatus] = useState(repayment.status || 'PENDING');
  const [loading, setLoading] = useState(false);

  const pendingAmount = calculatePendingAmount(repayment, allRepayments);
  const totalPaid = calculateTotalPaid(repayment, allRepayments);
  const loanAmount = repayment.loan?.amount || 0;

  const handleSave = async () => {
    if (Number(amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    // Validate amount doesn't exceed pending amount when status is PAID
    if (status === "PAID" && Number(amount) > pendingAmount + (Number(repayment.amount) || 0)) {
      alert(`Amount cannot exceed pending amount of ₹${pendingAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: Number(amount),
          dueDate: date,
          status: status
        }),
      });
      if (!res.ok) throw new Error("Failed to update repayment");
      if (onUpdate) onUpdate();
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
          <Label>Amount (₹)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show calculation summary */}
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
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-gray-600 text-xs">Remaining Installments:</div>
          <div className="font-medium text-blue-600">
            {calculateRemainingInstallments(repayment, allRepayments)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ================= Main Component =================
export default function RepaymentTable() {
  const [repayments, setRepayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const fetchRepayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/repayments");
      const data = await res.json();
      setRepayments(data);
      setFiltered(data);
    } catch (error) {
      console.error("Failed to fetch repayments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, []);

  useEffect(() => {
    let data = [...repayments];

    if (search) {
      data = data.filter(
        (r) =>
          r.loan?.customer?.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
          r.loan?.customer?.aadhar?.toLowerCase().includes(search.toLowerCase()) ||
          r.loan?.customer?.customerName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== "ALL") {
      data = data.filter((r) => r.status === status);
    }

    if (fromDate)
      data = data.filter((r) => new Date(r.dueDate) >= new Date(fromDate));
    if (toDate)
      data = data.filter((r) => new Date(r.dueDate) <= new Date(toDate));

    // Apply sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nested properties and calculated fields
        if (sortConfig.key === 'aadhar') {
          aValue = a.loan?.customer?.aadhar;
          bValue = b.loan?.customer?.aadhar;
        } else if (sortConfig.key === 'pendingAmount') {
          aValue = calculatePendingAmount(a, repayments);
          bValue = calculatePendingAmount(b, repayments);
        } else if (sortConfig.key === 'totalPaid') {
          aValue = calculateTotalPaid(a, repayments);
          bValue = calculateTotalPaid(b, repayments);
        } else if (sortConfig.key === 'loanAmount') {
          aValue = a.loan?.amount || 0;
          bValue = b.loan?.amount || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFiltered(data);
  }, [search, status, fromDate, toDate, repayments, sortConfig]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = [
      "Customer ID",
      "Customer Name",
      "Aadhar Number",
      "Loan Amount",
      "This Repayment",
      "Total Paid",
      "Pending Amount",
      "Remaining Installments",
      "Due Date",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filtered.map((row) =>
        [
          `"${row.loan?.customer?.customerCode || ""}"`,
          `"${row.loan?.customer?.customerName || ""}"`,
          `"${row.loan?.customer?.aadhar || ""}"`,
          row.loan?.amount || 0,
          row.amount || 0,
          calculateTotalPaid(row, repayments),
          calculatePendingAmount(row, repayments),
          calculateRemainingInstallments(row, repayments),
          `"${formatDate(row.dueDate || "")}"`,
          `"${row.status || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `repayments_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortableHeader = ({ columnKey, children }) => (
    <div
      className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
      onClick={() => handleSort(columnKey)}
    >
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

  const columns = [
    {
      accessorKey: "customerCode",
      header: () => (
        <SortableHeader columnKey="customerCode">Customer ID</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-full">
            <User className="h-3.5 w-3.5 text-blue-700" />
          </div>
          <span className="font-medium text-sm">
            {row.original.loan?.customer?.customerCode || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: () => (
        <SortableHeader columnKey="customerName">Customer Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.loan?.customer?.customerName || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "aadhar",
      header: () => (
        <SortableHeader columnKey="aadhar">Aadhar Number</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {row.original.loan?.customer?.aadhar || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "loanAmount",
      header: () => (
        <div className="text-right">
          <SortableHeader columnKey="loanAmount">Loan Amount</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold">
          <IndianRupee className="h-3.5 w-3.5 inline mr-1" />
          {(row.original.loan?.amount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-right">
          <SortableHeader columnKey="amount">This Repayment</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <EditableAmount 
            repayment={row.original} 
            onUpdate={fetchRepayments}
            allRepayments={repayments}
          />
        </div>
      ),
    },
    {
      accessorKey: "totalPaid",
      header: () => (
        <div className="text-right">
          <SortableHeader columnKey="totalPaid">Total Paid</SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const totalPaid = calculateTotalPaid(row.original, repayments);
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
        <div className="text-right">
          <SortableHeader columnKey="pendingAmount">Pending Amount</SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const pendingAmount = calculatePendingAmount(row.original, repayments);
        return (
          <div className="text-right font-semibold text-red-600">
            <IndianRupee className="h-3.5 w-3.5 inline mr-1" />
            {pendingAmount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "remainingInstallments",
      header: () => (
        <div className="text-right">
          <SortableHeader columnKey="remainingInstallments">Remaining</SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const remaining = calculateRemainingInstallments(row.original, repayments);
        return (
          <div className="text-right font-medium text-blue-600">
            {remaining} installments
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: () => (
        <SortableHeader columnKey="dueDate">Due Date</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          {formatDate(row.original.dueDate)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const repayment = row.original;
        const [editDialogOpen, setEditDialogOpen] = useState(false);

        return (
          <div className="flex gap-2">
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
                  <DialogDescription>
                    View detailed information about this repayment
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Customer ID
                      </Label>
                      <p className="text-sm font-medium">
                        {repayment.loan?.customer?.customerCode || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Aadhar Number
                      </Label>
                      <p className="text-sm font-medium">
                        {repayment.loan?.customer?.aadhar || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Customer Name
                    </Label>
                    <p className="text-sm font-medium">
                      {repayment.loan?.customer?.customerName || "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Loan Amount
                      </Label>
                      <p className="text-sm font-medium">
                        {formatCurrency(repayment.loan?.amount || 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Total Paid
                      </Label>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(calculateTotalPaid(repayment, repayments))}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Pending Amount
                      </Label>
                      <p className="text-sm font-medium text-red-600">
                        {formatCurrency(calculatePendingAmount(repayment, repayments))}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        This Repayment
                      </Label>
                      <p className="text-sm font-medium">
                        {formatCurrency(repayment.amount || 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Due Date
                      </Label>
                      <p className="text-sm font-medium">
                        {formatDate(repayment.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Remaining Installments
                      </Label>
                      <p className="text-sm font-medium text-blue-600">
                        {calculateRemainingInstallments(repayment, repayments)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Status
                      </Label>
                      <div>{getStatusBadge(repayment.status)}</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
                  <DialogDescription>
                    Update repayment details
                  </DialogDescription>
                </DialogHeader>
                <EditRepaymentForm
                  repayment={repayment}
                  onUpdate={fetchRepayments}
                  onClose={() => setEditDialogOpen(false)}
                  allRepayments={repayments}
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Repayment Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all loan repayments in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 gap-1.5">
            <CreditCard className="h-4 w-4" />
            {filtered.length} repayment{filtered.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            onClick={handleExport}
            className="h-10 gap-2"
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Repayments
                </p>
                <h3 className="text-2xl font-bold mt-1">{repayments.length}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-700">Paid</p>
                <h3 className="text-2xl font-bold mt-1">
                  {repayments.filter((r) => r.status === "PAID").length}
                </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <BadgeCheck className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-amber-700">Pending</p>
                <h3 className="text-2xl font-bold mt-1">
                  {repayments.filter((r) => r.status === "PENDING").length}
                </h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-red-700">Overdue</p>
                <h3 className="text-2xl font-bold mt-1">
                  {repayments.filter((r) => r.status === "OVERDUE").length}
                </h3>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filters & Search
            </CardTitle>
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
              {(search || status !== "ALL" || fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatus("ALL");
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer code, name, or Aadhar number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Sort By</Label>
                  <Select
                    value={sortConfig.key || "dueDate"}
                    onValueChange={(value) => handleSort(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="amount">This Repayment</SelectItem>
                      <SelectItem value="totalPaid">Total Paid</SelectItem>
                      <SelectItem value="pendingAmount">Pending Amount</SelectItem>
                      <SelectItem value="loanAmount">Loan Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No repayments found
              </h3>
              <p className="text-gray-500">
                {repayments.length === 0
                  ? "No repayment records available."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}