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

// Pagination imports
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Custom progress bar component since @/components/ui/progress is not available
const ProgressBar = ({ value, className = "" }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  );
};

export default function AllCustomerTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startEndDate, setStartEndDate] = useState("");
  const [endEndDate, setEndEndDate] = useState("");
  const [availableAreas, setAvailableAreas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Popover open state for Area filter
  const [areaOpen, setAreaOpen] = useState(false);

  // Pagination (TABLE ONLY)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repayments, setRepayments] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Dialog-in-Dialog actions state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const router = useRouter();

  // Helper: calculate end date
  const calculateEndDate = (loanDate, tenure) => {
    if (!loanDate || tenure == null) return null;
    const date = new Date(loanDate);
    date.setMonth(date.getMonth() + Number(tenure));
    return date;
  };

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (!res.ok) throw new Error("Failed to fetch customer data");
        let customers = await res.json();

        customers = customers.map((cust) => ({
          ...cust,
          endDate: cust.endDate
            ? new Date(cust.endDate)
            : cust.loanDate && cust.tenure
            ? calculateEndDate(cust.loanDate, cust.tenure)
            : null,
        }));

        setData(customers);
        const areas = [
          ...new Set(customers.map((c) => c.area).filter(Boolean)),
        ];
        setAvailableAreas(areas);
      } catch (err) {
        console.error("Error loading data:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer?.customerCode) {
      QRCode.toDataURL(selectedCustomer.customerCode)
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR Code Error:", err));

      fetch(`/api/repayments?customerId=${selectedCustomer.id}`)
        .then((res) => res.json())
        .then((data) => setRepayments(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error("Error loading repayments:", err);
          setRepayments([]);
        });
    } else {
      setQrCodeUrl("");
      setRepayments([]);
    }
  }, [selectedCustomer]);

  // Delete handler
  async function handleDelete(id) {
    try {
      console.log(
        "🔄 DELETE - Starting deletion with ID:",
        id,
        "Type:",
        typeof id
      );

      // Validate the ID - it should be a UUID string, not a number
      if (!id || typeof id !== "string") {
        console.error("❌ Invalid ID provided:", id);
        alert("Invalid customer ID. Please try again.");
        return;
      }

      // Check if it looks like a UUID (optional validation)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.warn("⚠️ ID doesn't match UUID format:", id);
        // Still proceed, as it might be a valid string ID
      }

      setDeletingId(id);

      const apiUrl = `/api/customers?id=${encodeURIComponent(id)}`;
      console.log("🌐 Calling API:", apiUrl);

      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📨 Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        throw new Error(
          errorData.error || errorData.message || "Failed to delete customer"
        );
      }

      const result = await res.json();
      console.log("✅ Success:", result);

      if (result.success) {
        setData((prev) => prev.filter((c) => c.id !== id));
        if (selectedCustomer?.id === id) {
          setDialogOpen(false);
          setSelectedCustomer(null);
        }
        alert("Customer deleted successfully!");
      } else {
        throw new Error(result.error || "Failed to delete customer");
      }
    } catch (e) {
      console.error("🔥 Delete error:", e);
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  // QR Code download handler
  const handleDownloadQRCode = () => {
    if (!qrCodeUrl || !selectedCustomer) return;

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `QRCode_${
      selectedCustomer.customerCode || selectedCustomer.name
    }.png`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Columns (no actions column)
  const columns = [
    {
      accessorKey: "photoUrl",
      header: "Photo",
      cell: ({ row }) => {
        const photo = row.original.photoUrl;
        return photo ? (
          <img
            src={photo}
            alt="Customer"
            className="h-10 w-10 rounded-full object-cover border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        );
      },
    },
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span
          onClick={() => {
            setSelectedCustomer(row.original);
            setDialogOpen(true);
          }}
          className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "aadhar",
      header: "Aadhar",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.aadhar || "N/A"}</span>
      ),
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => (
        <div className="flex items-center">
          <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
          <span className="text-sm">{row.original.area || "N/A"}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const customer = row.original;
        const totalPaid = customer.totalPaid || 0;
        const loanAmount = customer.loanAmount || 0;
        const isActive = totalPaid < loanAmount;
        return isActive ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600">
            Closed
          </Badge>
        );
      },
    },
    {
      accessorKey: "loanAmount",
      header: () => (
        <div className="text-right">
          <span>Loan Amount</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ₹{Number(row.original.loanAmount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        const endDate = row.original.endDate;
        return endDate ? (
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
            <span className="text-sm">
              {new Date(endDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
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
        const endDate = row.original.endDate
          ? new Date(row.original.endDate)
          : null;
        if (!endDate) return "N/A";
        const today = new Date();
        const diff = Math.floor(
          (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {diff} days
          </Badge>
        ) : (
          <span className="text-xs text-green-600">On time</span>
        );
      },
    },
  ];

  // Filters
  const filteredData = data.filter((cust) => {
    const matchesGlobal =
      !globalFilter ||
      cust.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      cust.customerCode?.toLowerCase().includes(globalFilter.toLowerCase());

    const totalPaid = cust.totalPaid || 0;
    const loanAmount = cust.loanAmount || 0;
    const isActive = totalPaid < loanAmount;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "closed" && !isActive);

    const matchesArea = !areaFilter || cust.area === areaFilter;
    const matchesMinAmount = !minAmount || loanAmount >= Number(minAmount);
    const matchesMaxAmount = !maxAmount || loanAmount <= Number(maxAmount);

    const endDateObj = cust.endDate ? new Date(cust.endDate) : null;
    const matchesStartDate =
      !startEndDate || (endDateObj && endDateObj >= new Date(startEndDate));
    const matchesEndDate =
      !endEndDate || (endDateObj && endDateObj <= new Date(endEndDate));

    return (
      matchesGlobal &&
      matchesStatus &&
      matchesArea &&
      matchesMinAmount &&
      matchesMaxAmount &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  // TABLE pagination only
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const numberOfRepayments = useMemo(() => repayments.length, [repayments]);

  const handleDownloadStatement = () => {
    if (!selectedCustomer) return;
    const headers = ["Date", "Amount", "Note"];
    const rows = repayments.map((r) => [
      r.date ? new Date(r.date).toISOString().split("T") : "",
      typeof r.amount === "number" ? r.amount : Number(r.amount || 0),
      r.note || "",
    ]);
    const csv =
      [headers, ...rows]
        .map((row) =>
          row
            .map((field) => {
              const s = String(field ?? "");
              if (s.includes(",") || s.includes('"') || s.includes("\n")) {
                return `"${s.replace(/"/g, '""')}"`;
              }
              return s;
            })
            .join(",")
        )
        .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const nameSafe =
      selectedCustomer.name?.replace(/[^a-z0-9-_]/gi, "_") ||
      selectedCustomer.customerCode ||
      "customer";
    const a = document.createElement("a");
    a.href = url;
    a.download = `Statement_${nameSafe}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  // helper to render number window
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
      if (start > 2) {
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let p = start; p <= end; p += 1) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all customer accounts and loan details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <User className="h-4 w-4 mr-1" />
            {data.length} customer{data.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <CreditCard className="h-4 w-4 mr-1" />
            {filteredData.length} filtered
          </Badge>
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
              {(globalFilter ||
                statusFilter ||
                areaFilter ||
                minAmount ||
                maxAmount ||
                startEndDate ||
                endEndDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGlobalFilter("");
                    setStatusFilter("");
                    setAreaFilter("");
                    setMinAmount("");
                    setMaxAmount("");
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
          <div className="flex flex-col gap-4">
            {/* Main search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or customer ID..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
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
                        className="w-full justify-between text-sm font-normal"
                      >
                        {areaFilter || "All Areas"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search area..." />
                        <CommandList>
                          <CommandEmpty>No area found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__all__"
                              onSelect={() => {
                                setAreaFilter("");
                                setAreaOpen(false);
                              }}
                            >
                              All Areas
                            </CommandItem>
                            {availableAreas.map((area) => (
                              <CommandItem
                                key={area}
                                value={area}
                                onSelect={() => {
                                  setAreaFilter(area);
                                  setAreaOpen(false);
                                }}
                              >
                                {area}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Loan Amount Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">End Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={startEndDate}
                      onChange={(e) => setStartEndDate(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={endEndDate}
                      onChange={(e) => setEndEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredData.length}</span> of{" "}
          <span className="font-medium">{data.length}</span> customers
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Rows per page:</Label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table with paginated data */}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={paginatedData} />
        </CardContent>
      </Card>

      {/* Table Pagination Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {renderPageWindow()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                aria-disabled={currentPage === totalPages || totalPages === 0}
                className={
                  currentPage === totalPages || totalPages === 0
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Customer Dialog with actions inside */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-2xl">Customer Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedCustomer?.name}
                </DialogDescription>
              </div>

              <div className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteOpen(true);
                      }}
                    >
                      Delete Customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          {selectedCustomer ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Profile & QR */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4">
                      {selectedCustomer.photoUrl ? (
                        <img
                          src={selectedCustomer.photoUrl}
                          alt="Customer"
                          className="h-24 w-24 rounded-full object-cover border-4 border-gray-100"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-gray-100 border-4 border-gray-100 flex items-center justify-center">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
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
                        <div className="p-2 bg-white border rounded-lg">
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="h-32 w-32"
                          />
                        </div>
                      ) : (
                        <div className="h-32 w-32 border rounded-lg flex items-center justify-center text-xs text-gray-500">
                          QR Loading...
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
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        if (!selectedCustomer?.customerCode) return;
                        navigator.clipboard.writeText(
                          selectedCustomer.customerCode
                        );
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Copy Customer ID
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setEditOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleDownloadQRCode}
                      disabled={!qrCodeUrl}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleDownloadStatement}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Statement
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Details & Repayments */}
              <div className="lg:col-span-3 space-y-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Customer Details</TabsTrigger>
                    <TabsTrigger value="repayments">
                      Repayments ({numberOfRepayments})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">
                            Mobile Number
                          </Label>
                          <div className="flex items-center font-medium">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedCustomer.mobile || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">
                            Aadhar Number
                          </Label>
                          <div className="font-medium">
                            {selectedCustomer.aadhar || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-500">Area</Label>
                          <div className="flex items-center font-medium">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedCustomer.area || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-sm text-gray-500">
                            Address
                          </Label>
                          <div className="font-medium">
                            {selectedCustomer.address || "N/A"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Loan Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm text-gray-500">
                              Loan Amount
                            </Label>
                            <div className="flex items-center font-medium text-lg">
                              <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                              ₹
                              {Number(
                                selectedCustomer.loanAmount || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-gray-500">
                              Total Paid
                            </Label>
                            <div className="flex items-center font-medium text-lg text-green-600">
                              <DollarSign className="h-4 w-4 mr-1" />₹
                              {Number(
                                selectedCustomer.totalPaid || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-gray-500">
                              Pending Amount
                            </Label>
                            <div className="flex items-center font-medium text-lg text-red-600">
                              <DollarSign className="h-4 w-4 mr-1" />₹
                              {Number(
                                (selectedCustomer.loanAmount || 0) -
                                  (selectedCustomer.totalPaid || 0)
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-gray-500">
                              End Date
                            </Label>
                            <div className="flex items-center font-medium">
                              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                              {selectedCustomer.endDate
                                ? new Date(
                                    selectedCustomer.endDate
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </div>
                          </div>
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
                  </TabsContent>

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
                          <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p>No repayment history found.</p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left p-3 font-medium">
                                    Date
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Amount
                                  </th>
                                  <th className="text-left p-3 font-medium">
                                    Note
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {repayments.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="p-3">
                                      {r.date
                                        ? new Date(r.date).toLocaleDateString(
                                            "en-IN",
                                            {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                            }
                                          )
                                        : "—"}
                                    </td>
                                    <td className="p-3 font-medium">
                                      ₹{Number(r.amount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                      {r.note || "—"}
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
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customer selected.
            </div>
          )}

          {/* Inline Edit Dialog inside details dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>
                  Update customer details and save changes.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedCustomer) return;
                  const fd = new FormData(e.currentTarget);
                  fd.set("id", String(selectedCustomer.id));
                  try {
                    const res = await fetch("/api/customers", {
                      method: "PUT",
                      body: fd,
                    });
                    if (!res.ok) throw new Error("Failed to update");
                    const { customer } = await res.json();
                    setData((prev) =>
                      prev.map((c) =>
                        c.id === customer.id ? { ...c, ...customer } : c
                      )
                    );
                    setSelectedCustomer((prev) =>
                      prev && prev.id === customer.id
                        ? { ...prev, ...customer }
                        : prev
                    );
                    setEditOpen(false);
                  } catch (err) {
                    console.error("Update error:", err);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    name="customerName"
                    defaultValue={selectedCustomer?.name || ""}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Mobile</Label>
                  <Input
                    name="mobile"
                    defaultValue={selectedCustomer?.mobile || ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Customer Code</Label>
                  <Input
                    name="customerCode"
                    defaultValue={selectedCustomer?.customerCode || ""}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation inside details dialog */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  customer account and remove all associated data from our
                  servers.
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
                      Deleting...
                    </>
                  ) : (
                    "Delete Customer"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AllCustomerTable };
