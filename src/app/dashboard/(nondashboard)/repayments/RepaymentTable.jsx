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
  User,
  CreditCard,
  BadgeCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// 🆕 ShadCN Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RepaymentTable() {
  const [repayments, setRepayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch repayments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/repayments");
        const data = await res.json();
        setRepayments(data);
        setFiltered(data);
      } catch (error) {
        console.error("Failed to fetch repayments:", error);
      }
    };
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let data = [...repayments];

    if (search) {
      data = data.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          r.loanCode?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== "ALL") {
      data = data.filter((r) => r.status === status);
    }

    if (fromDate) {
      data = data.filter((r) => new Date(r.date) >= new Date(fromDate));
    }
    if (toDate) {
      data = data.filter((r) => new Date(r.date) <= new Date(toDate));
    }

    setFiltered(data);
  }, [search, status, fromDate, toDate, repayments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <BadgeCheck className="h-3 w-3 mr-1" /> Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-300"
          >
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = ["Customer", "Loan Code", "Amount", "Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filtered.map((row) =>
        [
          `"${row.customerName || ""}"`,
          `"${row.loanCode || ""}"`,
          row.amount || 0,
          `"${formatDate(row.date || "")}"`,
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
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= COLUMNS =================
  const columns = [
    {
      accessorKey: "customerName",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {}}
          className="font-semibold flex items-center"
        >
          <User className="h-4 w-4 mr-2" />
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.customerName || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "loanCode",
      header: () => (
        <div className="flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Loan Code
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
          {row.original.loanCode || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-right font-semibold">
          {formatCurrency(row.original.amount || 0)}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: () => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Date
        </div>
      ),
      cell: ({ row }) => formatDate(row.original.date || ""),
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
        return (
          <div className="flex gap-2">
            {/* 👁️ View repayment details in Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Repayment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Customer:</span>{" "}
                    {repayment.customerName || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Loan Code:</span>{" "}
                    {repayment.loanCode || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span>{" "}
                    {formatCurrency(repayment.amount || 0)}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(repayment.date || "")}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusBadge(repayment.status)}
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* ✏️ Edit repayment inline dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 px-3">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Repayment</DialogTitle>
                </DialogHeader>
                <EditRepaymentForm repayment={repayment} />
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
          <h1 className="text-3xl font-bold text-gray-900">
            Repayment Records
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all loan repayments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <CreditCard className="h-4 w-4 mr-1" />
            {filtered.length} repayment{filtered.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="h-10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

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
            {/* Main search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name or loan code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full"
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
          Showing <span className="font-medium">{filtered.length}</span> of{" "}
          <span className="font-medium">{repayments.length}</span> repayments
        </p>
        {filtered.length === 0 && repayments.length > 0 && (
          <p className="text-sm text-amber-600">
            No repayments match your filters
          </p>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage={
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No repayment records found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {repayments.length === 0
                    ? "No repayments have been recorded yet"
                    : "Try adjusting your filters to see more results"}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ================= Edit Form Component =================
function EditRepaymentForm({ repayment }) {
  const [amount, setAmount] = useState(repayment.amount || 0);
  const [status, setStatus] = useState(repayment.status || "PENDING");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, status }),
      });

      if (!res.ok) throw new Error("Failed to update repayment");
      window.location.reload(); // 🔄 reload table after edit
    } catch (err) {
      console.error(err);
      alert("Error updating repayment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
