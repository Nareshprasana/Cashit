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
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ================= Status Badge =================
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
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      );
    case "OVERDUE":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" /> Overdue
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Active
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Closed
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

// ================= Editable Amount Component =================
function EditableAmount({ repayment, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(repayment.amount);

  const saveChange = async () => {
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(value) }),
      });

      if (!res.ok) throw new Error("Failed");
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error updating repayment");
    }
  };

  return editing ? (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 h-8 text-sm"
      />
      <Button size="sm" className="h-7 px-2" onClick={saveChange}>
        Save
      </Button>
    </div>
  ) : (
    <div
      className="text-right font-semibold cursor-pointer hover:underline"
      onClick={() => setEditing(true)}
    >
      {formatCurrency(repayment.amount || 0)}
    </div>
  );
}

// ================= Edit Repayment Form =================
function EditRepaymentForm({ repayment }) {
  const [amount, setAmount] = useState(repayment.amount || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error("Failed to update repayment");
      window.location.reload();
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

      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
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
          r.customerCode?.toLowerCase().includes(search.toLowerCase()) ||
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

  // Export CSV
  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = ["Customer", "Loan Code", "Amount", "Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filtered.map((row) =>
        [
          `"${row.customerCode || ""}"`,
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

  // Columns
  const columns = [
    {
      accessorKey: "customerCode",
      header: "Customer ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
          {row.original.customerCode}
        </span>
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
      cell: ({ row }) => <EditableAmount repayment={row.original} />,
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
                    {repayment.customerCode || "N/A"}
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
          <h1 className="text-3xl font-bold text-gray-900">Repayment Records</h1>
          <p className="text-gray-600 mt-1">Manage and track all loan repayments</p>
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
        <CardHeader className="pb-3 flex justify-between items-center">
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
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer code or loan code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

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
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
