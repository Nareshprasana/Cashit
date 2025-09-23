"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import QRCode from "qrcode";
import {
  Search,
  Filter,
  Download,
  Copy,
  User,
  CreditCard,
  Calendar,
  Phone,
  FileText,
  IndianRupee,
  QrCode,
  Eye,
  X,
  RefreshCw,
  FileDown,
  MapPin,
  IdCard,
  Home,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ReportPage() {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedArea, setSelectedArea] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch areas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("/api/area");
        if (!res.ok) throw new Error("Failed to fetch areas");
        const data = await res.json();
        setAreas(data);
      } catch (error) {
        console.error("Failed to load areas", error);
      }
    };
    fetchAreas();
  }, []);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedArea && selectedArea !== "all") params.append("areaId", selectedArea);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load customers", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = () => fetchCustomers();

  const handleReset = () => {
    setSelectedArea("all");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    fetchCustomers();
  };

  const handleRowClick = async (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
    setCustomerLoading(true);
    
    try {
      const [qrData, repaymentsRes] = await Promise.all([
        QRCode.toDataURL(customer.customerCode),
        fetch(`/api/repayments?customerId=${customer.id}`).then(res => res.json())
      ]);
      
      setQrCodeUrl(qrData);
      setRepayments(Array.isArray(repaymentsRes) ? repaymentsRes : []);
    } catch (err) {
      console.error("Error loading customer details:", err);
      setQrCodeUrl("");
      setRepayments([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const numberOfRepayments = useMemo(() => repayments.length, [repayments]);

  const totalRepaidAmount = useMemo(() => 
    repayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0), 
    [repayments]
  );

  const handleDownloadStatement = () => {
    if (!selectedCustomer) return;

    const headers = ["Date", "Amount", "Note"];
    const rows = repayments.map((r) => [
      r.date ? new Date(r.date).toISOString().split("T")[0] : "",
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
    a.download = `Statement_${nameSafe}_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (customer) => {
    if (customer.pendingAmount <= 0) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
    } else if (new Date(customer.dueDate) < new Date()) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
    } else {
      return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is beyond 3
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show current page and neighbors
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                isActive={currentPage === i}
                onClick={() => handlePageChange(i)}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      // Show ellipsis if current page is not near the end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Reports</h1>
          <p className="text-gray-600 mt-1">Manage and analyze customer loan data</p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5 gap-1.5">
          <FileText className="h-4 w-4" />
          {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters
              </CardTitle>
              <CardDescription>Refine your customer search</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSearch}
                className="flex items-center gap-1"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, code, or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Area</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer List
              </CardTitle>
              <CardDescription>
                Showing {Math.min(customers.length, itemsPerPage)} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="itemsPerPage" className="text-sm whitespace-nowrap">Rows per page:</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : customers.length > 0 ? (
            <>
              <div className="rounded-lg border overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Customer", "Contact", "Loan Details", "Status", "Actions"].map((header) => (
                        <th key={header} className="text-left p-3 text-sm font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {customer.photoUrl ? (
                              <img
                                src={customer.photoUrl}
                                alt={customer.name}
                                className="h-10 w-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.customerCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-gray-500" />
                              {customer.mobile}
                            </div>
                            {customer.address && (
                              <div className="text-gray-500 mt-1 flex items-start gap-1">
                                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{customer.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="grid gap-1 text-sm">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                              <span className="font-medium">{formatCurrency(customer.loanAmount)}</span>
                              <span className="text-gray-500">loan</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wallet className="h-3.5 w-3.5 text-green-500" />
                              <span>{formatCurrency(customer.totalPaid)}</span>
                              <span className="text-gray-500">paid</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                              <span className="font-medium">{formatCurrency(customer.pendingAmount)}</span>
                              <span className="text-gray-500">pending</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(customer)}
                            {customer.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(customer.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRowClick(customer)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, customers.length)} of {customers.length} entries
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {getPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>

          {customerLoading ? (
            <div className="space-y-4 py-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-28 w-28 rounded-full" />
                <Skeleton className="h-32 w-32 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ) : selectedCustomer ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Customer Details</TabsTrigger>
                <TabsTrigger value="repayments">Repayment History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column - Photo & QR */}
                  <div className="flex flex-col items-center gap-4">
                    {selectedCustomer.photoUrl ? (
                      <img
                        src={selectedCustomer.photoUrl}
                        alt="Customer"
                        className="h-28 w-28 rounded-full object-cover border shadow"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center shadow">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                    )}

                    {qrCodeUrl ? (
                      <div className="border rounded-lg p-3 shadow-sm">
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="h-32 w-32 mx-auto"
                        />
                        <p className="text-center text-xs text-gray-500 mt-2">
                          Customer Code: {selectedCustomer.customerCode}
                        </p>
                      </div>
                    ) : (
                      <div className="h-32 w-32 border rounded flex items-center justify-center text-xs text-gray-500">
                        <QrCode className="h-8 w-8 mb-1" />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCustomer.customerCode);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </Button>
                      <Button 
                        onClick={handleDownloadStatement}
                        className="flex items-center gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Download Statement
                      </Button>
                    </div>
                  </div>

                  {/* Right Column - Details */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Name
                        </Label>
                        <p className="font-medium">{selectedCustomer.name}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Mobile
                        </Label>
                        <p className="font-medium">{selectedCustomer.mobile}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          Aadhar
                        </Label>
                        <p className="font-medium">{selectedCustomer.aadhar || "Not provided"}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Area
                        </Label>
                        <p className="font-medium">
                          {areas.find(a => a.id === selectedCustomer.areaId)?.areaName || "Not specified"}
                        </p>
                      </div>
                      
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          Address
                        </Label>
                        <p className="font-medium">{selectedCustomer.address || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Loan Information
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">Loan Amount</p>
                          <p className="font-bold text-lg">{formatCurrency(selectedCustomer.loanAmount)}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">Amount Paid</p>
                          <p className="font-bold text-lg">{formatCurrency(selectedCustomer.totalPaid)}</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm text-amber-700">Pending Amount</p>
                          <p className="font-bold text-lg">{formatCurrency(selectedCustomer.pendingAmount)}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">Status</p>
                          <div className="mt-1">{getStatusBadge(selectedCustomer)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="repayments" className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Repayment History</h3>
                  <Badge variant="outline">
                    {repayments.length} repayment{repayments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {repayments.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No repayment history found.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {repayments.map((repayment) => (
                          <tr key={repayment.id}>
                            <td className="p-3">
                              {repayment.date ? new Date(repayment.date).toLocaleDateString() : "—"}
                            </td>
                            <td className="p-3 font-medium">
                              {formatCurrency(repayment.amount || 0)}
                            </td>
                            <td className="p-3 text-gray-600">{repayment.note || "—"}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="p-3">Total</td>
                          <td className="p-3">{formatCurrency(totalRepaidAmount)}</td>
                          <td className="p-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-sm text-gray-600 py-6 text-center">No customer selected.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}