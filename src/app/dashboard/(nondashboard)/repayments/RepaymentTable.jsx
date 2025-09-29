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

/* ================= Status Badge ================= */
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

/* ================= Formatters ================= */
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

/* ================= Helper function to calculate total paid for a loan ================= */
const calculateTotalPaid = (repayment, allRepayments) => {
  if (!repayment?.loanId) return 0;
  return allRepayments
    .filter((r) => r.loanId === repayment.loanId)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
};

/* ================= Use database pending amount instead of calculating ================= */
const getPendingAmount = (repayment) => {
  return Number(repayment.loan?.pendingAmount) || 0;
};

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

    const pendingAmount = getPendingAmount(repayment);
    const currentRepaymentAmount = Number(repayment.amount) || 0;

    // Check if new amount would exceed pending amount
    if (Number(value) > pendingAmount + currentRepaymentAmount) {
      alert(
        `Amount cannot exceed pending amount of ₹${pendingAmount.toLocaleString()}`
      );
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
    if (e.key === "Enter") {
      saveChange();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
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
          <p className="text-xs text-gray-500">
            Pending: ₹{getPendingAmount(repayment).toLocaleString()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ================= Edit Repayment Form ================= */
function EditRepaymentForm({ repayment, onUpdate, onClose, allRepayments }) {
  const [amount, setAmount] = useState(repayment.amount || 0);
  const [date, setDate] = useState(
    repayment.dueDate?.split("T")[0] || ""
  );
  const [status, setStatus] = useState(repayment.status || "PENDING");
  const [loading, setLoading] = useState(false);

  const pendingAmount = getPendingAmount(repayment);
  const totalPaid = calculateTotalPaid(repayment, allRepayments);
  const loanAmount = repayment.loan?.amount || 0;

  const handleSave = async () => {
    if (Number(amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    if (
      status === "PAID" &&
      Number(amount) > pendingAmount + (Number(repayment.amount) || 0)
    ) {
      alert(
        `Amount cannot exceed pending amount of ₹${pendingAmount.toLocaleString()}`
      );
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
          status: status,
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

      {/* Loan summary */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <Label className="text-sm font-medium">Loan Summary</Label>
        <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
          <div>
            <div className="text-gray-600">Loan Amount:</div>
            <div className="font-medium">
              ₹{loanAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Total Paid:</div>
            <div className="font-medium text-green-600">
              ₹{totalPaid.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Pending:</div>
            <div className="font-medium text-red-600">
              ₹{pendingAmount.toLocaleString()}
            </div>
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

/* ================= ActionButtons Component ================= */
function ActionButtons({ repayment, onUpdate, allRepayments }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
            <DialogDescription>
              View detailed information about this repayment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* --- basic info --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Customer ID
                </Label>
                <p className="text-sm font-medium">
                  {repayment.customer?.customerCode || repayment.customerCode || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Aadhar Number
                </Label>
                <p className="text-sm font-medium">
                  {repayment.customer?.aadhar || repayment.aadhar || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Customer Name
              </Label>
              <p className="text-sm font-medium">
                {repayment.customer?.customerName || repayment.customerName || "N/A"}
              </p>
            </div>

            {/* --- loan summary --- */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Loan Amount
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(repayment.loan?.amount || repayment.loanAmount || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Total Paid
                </Label>
                <p className="text-sm font-medium text-green-600">
                  {formatCurrency(calculateTotalPaid(repayment, allRepayments))}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Pending Amount
                </Label>
                <p className="text-sm font-medium text-red-600">
                  {formatCurrency(getPendingAmount(repayment))}
                </p>
              </div>
            </div>

            {/* --- repayment details --- */}
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

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Status
              </Label>
              <div>{getStatusBadge(repayment.status)}</div>
            </div>
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
            <DialogDescription>
              Update repayment details
            </DialogDescription>
          </DialogHeader>
          <EditRepaymentForm
            repayment={repayment}
            onUpdate={onUpdate}
            onClose={() => setEditDialogOpen(false)}
            allRepayments={allRepayments}
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
    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
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
        Showing{" "}
        {totalItems === 0
          ? 0
          : (currentPage - 1) * itemsPerPage + 1}{" "}
        to{" "}
        {(currentPage - 1) * itemsPerPage + currentItemsCount} of{" "}
        {totalItems} entries
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
                onClick={() =>
                  currentPage > 1 && onPageChange(currentPage - 1)
                }
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
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
                onClick={() =>
                  currentPage < totalPages && onPageChange(currentPage + 1)
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
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
export default function RepaymentTable() {
  /* ---------- state ---------- */
  const [repayments, setRepayments] = useState([]);
  const [customers, setCustomers] = useState([]);
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

  // URL filters (area / customer)
  const [urlFilters, setUrlFilters] = useState({ area: "", customer: "" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ---- derived pagination values ----
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // ----------------------------------

  /* ---------- Debug data structure ---------- */
  useEffect(() => {
    if (currentItems.length > 0) {
      console.log('Sample repayment data structure:', currentItems[0]);
      console.log('All repayments count:', repayments.length);
      console.log('All customers count:', customers.length);
      console.log('Filtered repayments count:', filtered.length);
    }
  }, [currentItems, repayments, customers, filtered]);

  /* ---------- URL query handling ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const area = params.get("area") || "";
    const customer = params.get("customer") || "";
    setUrlFilters({ area, customer });
    if (customer && !search) setSearch(customer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- fetch data from both APIs ---------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch repayments and customers simultaneously
      const [repaymentsRes, customersRes] = await Promise.all([
        fetch("/api/repayments"),
        fetch("/api/customers")
      ]);
      
      const repaymentsData = await repaymentsRes.json();
      const customersData = await customersRes.json();
      
      console.log("=== API RESPONSE DEBUG ===");
      console.log("Repayments API response:", repaymentsData);
      console.log("Customers API response:", customersData);
      
      if (repaymentsData.length > 0) {
        console.log("First repayment structure:", repaymentsData[0]);
        console.log("Repayment keys:", Object.keys(repaymentsData[0]));
      }
      
      if (customersData.length > 0) {
        console.log("First customer structure:", customersData[0]);
        console.log("Customer keys:", Object.keys(customersData[0]));
      }
      console.log("=== END DEBUG ===");
      
      setRepayments(repaymentsData);
      setCustomers(customersData);
      
      // Merge customer data with repayments
      const mergedData = repaymentsData.map(repayment => {
        // Find the customer for this repayment
        const customer = customersData.find(c => 
          c.id === repayment.customerId || 
          c.customerCode === repayment.customerCode ||
          c.loanId === repayment.loanId
        );
        
        return {
          ...repayment,
          customer: customer || null
        };
      });
      
      setFiltered(mergedData);
      
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRepaymentInState = (updatedRepayment) => {
    setRepayments((prev) =>
      prev.map((r) =>
        r.id === updatedRepayment.id ? updatedRepayment : r
      )
    );
    
    // Also update the filtered data
    setFiltered((prev) =>
      prev.map((r) =>
        r.id === updatedRepayment.id ? updatedRepayment : r
      )
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------- reset page on filter change ---------- */
  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? 1 : prev));
  }, [
    search,
    status,
    fromDate,
    toDate,
    sortConfig,
    urlFilters,
    totalPages,
  ]);

  /* ---------- filtering & sorting ---------- */
  useEffect(() => {
    let data = [...repayments].map(repayment => {
      const customer = customers.find(c => 
        c.id === repayment.customerId || 
        c.customerCode === repayment.customerCode ||
        c.loanId === repayment.loanId
      );
      
      return {
        ...repayment,
        customer: customer || null
      };
    });

    // URL filters
    if (urlFilters.area) {
      data = data.filter(
        (r) => r.customer?.areaId === urlFilters.area
      );
    }
    if (urlFilters.customer) {
      data = data.filter(
        (r) => r.customer?.customerCode === urlFilters.customer
      );
    }

    // Text search
    if (search) {
      const lc = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.customer?.customerCode?.toLowerCase().includes(lc) ||
          r.customer?.aadhar?.toLowerCase().includes(lc) ||
          r.customer?.customerName?.toLowerCase().includes(lc) ||
          r.customerCode?.toLowerCase().includes(lc) ||
          r.aadhar?.toLowerCase().includes(lc) ||
          r.customerName?.toLowerCase().includes(lc)
      );
    }

    // Status
    if (status !== "ALL") {
      data = data.filter((r) => r.status === status);
    }

    // Date range
    if (fromDate)
      data = data.filter(
        (r) => new Date(r.dueDate) >= new Date(fromDate)
      );
    if (toDate)
      data = data.filter(
        (r) => new Date(r.dueDate) <= new Date(toDate)
      );

    // Sorting (including computed columns)
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "aadhar") {
          aVal = a.customer?.aadhar || a.aadhar;
          bVal = b.customer?.aadhar || b.aadhar;
        } else if (sortConfig.key === "pendingAmount") {
          aVal = getPendingAmount(a);
          bVal = getPendingAmount(b);
        } else if (sortConfig.key === "totalPaid") {
          aVal = calculateTotalPaid(a, repayments);
          bVal = calculateTotalPaid(b, repayments);
        } else if (sortConfig.key === "loanAmount") {
          aVal = a.loan?.amount || a.loanAmount || 0;
          bVal = b.loan?.amount || b.loanAmount || 0;
        } else if (sortConfig.key === "customerCode") {
          aVal = a.customer?.customerCode || a.customerCode;
          bVal = b.customer?.customerCode || b.customerCode;
        } else if (sortConfig.key === "customerName") {
          aVal = a.customer?.customerName || a.customerName;
          bVal = b.customer?.customerName || b.customerName;
        }

        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    setFiltered(data);
  }, [
    search,
    status,
    fromDate,
    toDate,
    repayments,
    customers,
    sortConfig,
    urlFilters,
  ]);

  /* ---------- UI helpers ---------- */
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      direction = "descending";
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
      "Customer ID",
      "Customer Name",
      "Aadhar Number",
      "Loan Amount",
      "This Repayment",
      "Total Paid",
      "Pending Amount",
      "Due Date",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...filtered.map((row) =>
        [
          `"${row.customer?.customerCode || row.customerCode || ""}"`,
          `"${row.customer?.customerName || row.customerName || ""}"`,
          `"${row.customer?.aadhar || row.aadhar || ""}"`,
          row.loan?.amount || row.loanAmount || 0,
          row.amount || 0,
          calculateTotalPaid(row, repayments),
          getPendingAmount(row),
          `"${formatDate(row.dueDate || "")}"`,
          `"${row.status || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
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

  /* ---------- Updated column definitions using customer data ---------- */
  const columns = [
    {
      accessorKey: "customerCode",
      header: () => (
        <SortableHeader columnKey="customerCode">
          Customer ID
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const repayment = row.original;
        const customerCode = 
          repayment.customer?.customerCode ||
          repayment.customerCode ||
          "N/A";
        
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-full">
              <User className="h-3.5 w-3.5 text-blue-700" />
            </div>
            <span className="font-medium text-sm">
              {customerCode}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: () => (
        <SortableHeader columnKey="customerName">
          Customer Name
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const repayment = row.original;
        const customerName = 
          repayment.customer?.customerName ||
          repayment.customerName ||
          "N/A";
        
        return <span className="text-sm">{customerName}</span>;
      },
    },
    {
      accessorKey: "aadhar",
      header: () => (
        <SortableHeader columnKey="aadhar">Aadhar Number</SortableHeader>
      ),
      cell: ({ row }) => {
        const repayment = row.original;
        const aadhar = 
          repayment.customer?.aadhar ||
          repayment.aadhar ||
          "N/A";
        
        return (
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            {aadhar}
          </span>
        );
      },
    },
    {
      accessorKey: "loanAmount",
      header: () => (
        <div className="text-right">
          <SortableHeader columnKey="loanAmount">Loan Amount</SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const repayment = row.original;
        const loanAmount = 
          repayment.loan?.amount ||
          repayment.loanAmount ||
          0;
        
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
        <div className="text-right">
          <SortableHeader columnKey="amount">This Repayment</SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <EditableAmount
            repayment={row.original}
            onUpdate={updateRepaymentInState}
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
          <SortableHeader columnKey="pendingAmount">
            Pending Amount
          </SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const pending = getPendingAmount(row.original);
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
      cell: ({ row }) => (
        <ActionButtons
          repayment={row.original}
          onUpdate={updateRepaymentInState}
          allRepayments={repayments}
        />
      ),
    },
  ];

  /* ---------- render ---------- */
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
            {filtered.length} repayment
            {filtered.length !== 1 ? "s" : ""}
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

      {/* URL‑filter banner */}
      {(urlFilters.area || urlFilters.customer) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Active Filters
                </Badge>
                <div className="flex flex-wrap gap-2">
                  {urlFilters.area && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Area: {urlFilters.area}
                    </Badge>
                  )}
                  {urlFilters.customer && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <User className="h-3 w-3" />
                      Customer: {urlFilters.customer}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUrlFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Clear URL Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Repayments
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {repayments.length}
                </h3>
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
                <p className="text-sm font-medium text-amber-700">
                  Pending
                </p>
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
                <p className="text-sm font-medium text-red-700">
                  Overdue
                </p>
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

      {/* Filters card */}
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
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer code, name, or Aadhar number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Extra filter fields */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                {/* Status */}
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

                {/* From Date */}
                <div className="space-y-2">
                  <Label className="text-sm">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <Label className="text-sm">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                {/* Sort By */}
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
                      <SelectItem value="pendingAmount">
                        Pending Amount
                      </SelectItem>
                      <SelectItem value="loanAmount">Loan Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            /* Loading skeleton */
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
            /* Empty state */
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
            <>
              {/* Using SimpleTable instead of DataTable */}
              <SimpleTable columns={columns} data={currentItems} />

              {/* Pagination component */}
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