"use client";
import React, { useState, useEffect } from "react";
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
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Status badge component
const StatusBadge = ({ status, pendingAmount, loanAmount }) => {
  // Determine status based on pending amount if status is not explicitly provided
  const actualStatus = status || (pendingAmount > 0 ? "ACTIVE" : "CLOSED");
  
  switch (actualStatus) {
    case "ACTIVE":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-2 py-1">
          <Clock className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 py-1">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "NEVER_OPENED":
      return (
        <Badge variant="outline" className="text-gray-600 px-2 py-1">
          <XCircle className="h-3 w-3 mr-1" />
          Never Opened
        </Badge>
      );
    default:
      return <Badge variant="outline" className="px-2 py-1">{actualStatus}</Badge>;
  }
};

const LoanTable = ({ loans: initialLoans, loading }) => {
  const [loans, setLoans] = useState(initialLoans);
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // CRUD state
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    loanAmount: "",
    pendingAmount: "",
    rate: "",
    loanDate: "",
    status: "ACTIVE"
  });

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const customerData = await response.json();
          setCustomers(customerData);
        } else {
          console.error('Failed to fetch customers');
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Enrich loans with customer data
  const enrichedLoans = React.useMemo(() => {
    if (!customers.length) return loans;
    
    return loans.map(loan => {
      const customer = customers.find(c => c.id === loan.customerId) || {};
      return {
        ...loan,
        customer: {
          name: customer.name || "Unknown Customer",
          customerCode: customer.customerCode || "N/A",
          aadhar: customer.aadhar || "N/A",
          photoUrl: customer.photoUrl || null
        }
      };
    });
  }, [loans, customers]);

  // Sort function
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter loans based on search criteria
  const filteredLoans = enrichedLoans.filter((loan) => {
    const customerName = loan.customer?.name || "";
    const customerCode = loan.customer?.customerCode || "";
    const aadhar = loan.customer?.aadhar || "";

    const matchesGlobal =
      !globalFilter ||
      customerName.toLowerCase().includes(globalFilter.toLowerCase()) ||
      customerCode.toLowerCase().includes(globalFilter.toLowerCase()) ||
      aadhar.includes(globalFilter);

    // Determine status based on pending amount
    const loanStatus = loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED";
    const matchesStatus = !statusFilter || loanStatus === statusFilter;

    const loanDate = loan.loanDate ? new Date(loan.loanDate) : null;
    const matchesFromDate =
      !fromDate || (loanDate && loanDate >= new Date(fromDate));
    const matchesToDate =
      !toDate || (loanDate && loanDate <= new Date(toDate));

    return matchesGlobal && matchesStatus && matchesFromDate && matchesToDate;
  });

  // Sort filtered loans
  const sortedLoans = React.useMemo(() => {
    let sortableItems = [...filteredLoans];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'customerName') {
          const aValue = a.customer?.name || "";
          const bValue = b.customer?.name || "";
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === 'loanDate') {
          const aValue = new Date(a.loanDate || 0);
          const bValue = new Date(b.loanDate || 0);
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else {
          const aValue = a[sortConfig.key] || 0;
          const bValue = b[sortConfig.key] || 0;
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableItems;
  }, [filteredLoans, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedLoans.length / rowsPerPage) || 1;
  const paginatedLoans = sortedLoans.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // CRUD Operations
  const handleViewLoan = (loan) => {
    setSelectedLoan(loan);
    setIsViewDialogOpen(true);
  };

  const handleEditLoan = (loan) => {
    setSelectedLoan(loan);
    setFormData({
      customerId: loan.customerId || "",
      loanAmount: loan.loanAmount || "",
      pendingAmount: loan.pendingAmount || "",
      rate: loan.rate || "",
      loanDate: loan.loanDate ? new Date(loan.loanDate).toISOString().split('T')[0] : "",
      status: loan.pendingAmount > 0 ? "ACTIVE" : "CLOSED"
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteLoan = (loan) => {
    setSelectedLoan(loan);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateLoan = () => {
    setFormData({
      customerId: "",
      loanAmount: "",
      pendingAmount: "",
      rate: "",
      loanDate: new Date().toISOString().split('T')[0],
      status: "ACTIVE"
    });
    setIsCreateDialogOpen(true);
  };

  const confirmDelete = () => {
    setLoans(loans.filter(loan => loan.id !== selectedLoan.id));
    setIsDeleteDialogOpen(false);
    setSelectedLoan(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          loanAmount: parseFloat(formData.loanAmount),
          pendingAmount: parseFloat(formData.pendingAmount),
          rate: parseFloat(formData.rate),
          loanDate: formData.loanDate
        })
      });

      if (response.ok) {
        const updatedLoan = await response.json();
        setLoans(loans.map(loan => loan.id === selectedLoan.id ? updatedLoan : loan));
        setIsEditDialogOpen(false);
        setSelectedLoan(null);
      } else {
        console.error('Failed to update loan');
      }
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          loanAmount: parseFloat(formData.loanAmount),
          pendingAmount: parseFloat(formData.pendingAmount),
          rate: parseFloat(formData.rate),
          loanDate: formData.loanDate
        })
      });

      if (response.ok) {
        const newLoan = await response.json();
        setLoans([...loans, newLoan]);
        setIsCreateDialogOpen(false);
      } else {
        console.error('Failed to create loan');
      }
    } catch (error) {
      console.error('Error creating loan:', error);
    }
  };

  // Render pagination controls
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

  if (loading || isLoadingCustomers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Loan Management</h2>
          <p className="text-gray-600 mt-1">Manage all customer loans in one place</p>
        </div>
        <Button onClick={handleCreateLoan} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add New Loan
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Loans</p>
                <h3 className="text-2xl font-bold mt-1">{loans.length}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <h3 className="text-2xl font-bold mt-1">
                  {loans.filter(loan => loan.pendingAmount > 0).length}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Loans</p>
                <h3 className="text-2xl font-bold mt-1">
                  {loans.filter(loan => loan.pendingAmount <= 0).length}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <h3 className="text-2xl font-bold mt-1">
                  ₹{loans.reduce((sum, loan) => sum + (loan.pendingAmount || 0), 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Percent className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Filters & Search</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 border-gray-300"
              >
                {showFilters ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              {(globalFilter || statusFilter || fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGlobalFilter("");
                    setStatusFilter("");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                placeholder="Search by customer name, code, or Aadhar number..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="CLOSED">Completed</SelectItem>
                      <SelectItem value="NEVER_OPENED">Never Opened</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="text-sm border-gray-300 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="text-sm border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rows per page</Label>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder="Select rows" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 rows</SelectItem>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="20">20 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredLoans.length}</span> of{" "}
          <span className="font-medium">{loans.length}</span> loans
        </p>
        
        <div className="flex items-center gap-2">
          <Tabs defaultValue="all" className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Loans Table */}
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th 
                    className="text-left p-3 font-medium text-gray-700 cursor-pointer"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center">
                      Customer
                      {sortConfig.key === 'customerName' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">Customer Code</th>
                  <th className="text-left p-3 font-medium text-gray-700">Aadhar</th>
                  <th 
                    className="text-left p-3 font-medium text-gray-700 cursor-pointer"
                    onClick={() => handleSort('loanAmount')}
                  >
                    <div className="flex items-center">
                      Loan Amount
                      {sortConfig.key === 'loanAmount' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 font-medium text-gray-700 cursor-pointer"
                    onClick={() => handleSort('pendingAmount')}
                  >
                    <div className="flex items-center">
                      Pending Amount
                      {sortConfig.key === 'pendingAmount' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">Interest Rate</th>
                  <th 
                    className="text-left p-3 font-medium text-gray-700 cursor-pointer"
                    onClick={() => handleSort('loanDate')}
                  >
                    <div className="flex items-center">
                      Loan Date
                      {sortConfig.key === 'loanDate' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <User className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-600 font-medium">No loans found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {loan.customer?.photoUrl ? (
                            <img
                              src={loan.customer.photoUrl}
                              alt="Customer"
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {loan.customer?.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {loan.customer?.customerCode || "N/A"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{loan.customer?.aadhar || "N/A"}</td>
                      <td className="p-3 font-medium text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                          ₹{Number(loan.loanAmount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                          <span className={loan.pendingAmount > 0 ? "text-amber-600" : "text-green-600"}>
                            ₹{Number(loan.pendingAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-900">
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-1 text-gray-500" />
                          {Number(loan.rate || 0).toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {loan.loanDate
                            ? new Date(loan.loanDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge 
                          status={loan.status} 
                          pendingAmount={loan.pendingAmount} 
                          loanAmount={loan.loanAmount} 
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLoan(loan)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLoan(loan)}
                            className="flex items-center gap-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLoan(loan)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table Pagination Controls */}
      {filteredLoans.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
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
      )}

      {/* View Loan Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Loan Details</DialogTitle>
            <DialogDescription>
              View detailed information about this loan.
            </DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Customer Name</Label>
                <p className="font-medium text-gray-900">{selectedLoan.customer?.name || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Customer Code</Label>
                <p className="font-medium text-gray-900">{selectedLoan.customer?.customerCode || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Aadhar Number</Label>
                <p className="font-medium text-gray-900">{selectedLoan.customer?.aadhar || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Loan Amount</Label>
                <p className="font-medium text-gray-900">₹{Number(selectedLoan.loanAmount || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Pending Amount</Label>
                <p className="font-medium text-gray-900">₹{Number(selectedLoan.pendingAmount || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Interest Rate</Label>
                <p className="font-medium text-gray-900">{Number(selectedLoan.rate || 0).toFixed(1)}%</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Loan Date</Label>
                <p className="font-medium text-gray-900">
                  {selectedLoan.loanDate
                    ? new Date(selectedLoan.loanDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <p className="font-medium">
                  <StatusBadge 
                    status={selectedLoan.status} 
                    pendingAmount={selectedLoan.pendingAmount} 
                    loanAmount={selectedLoan.loanAmount} 
                  />
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Loan</DialogTitle>
            <DialogDescription>
              Update the loan information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerId" className="text-sm font-medium">Customer</Label>
                <Select 
                  name="customerId" 
                  value={formData.customerId} 
                  onValueChange={(value) => setFormData({...formData, customerId: value})}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanAmount" className="text-sm font-medium">Loan Amount (₹)</Label>
                <Input
                  id="loanAmount"
                  name="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pendingAmount" className="text-sm font-medium">Pending Amount (₹)</Label>
                <Input
                  id="pendingAmount"
                  name="pendingAmount"
                  type="number"
                  value={formData.pendingAmount}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate" className="text-sm font-medium">Interest Rate (%)</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.1"
                  value={formData.rate}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanDate" className="text-sm font-medium">Loan Date</Label>
                <Input
                  id="loanDate"
                  name="loanDate"
                  type="date"
                  value={formData.loanDate}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Loan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Loan</DialogTitle>
            <DialogDescription>
              Add a new loan to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-customerId" className="text-sm font-medium">Customer</Label>
                <Select 
                  name="customerId" 
                  value={formData.customerId} 
                  onValueChange={(value) => setFormData({...formData, customerId: value})}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-loanAmount" className="text-sm font-medium">Loan Amount (₹)</Label>
                <Input
                  id="create-loanAmount"
                  name="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-pendingAmount" className="text-sm font-medium">Pending Amount (₹)</Label>
                <Input
                  id="create-pendingAmount"
                  name="pendingAmount"
                  type="number"
                  value={formData.pendingAmount}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-rate" className="text-sm font-medium">Interest Rate (%)</Label>
                <Input
                  id="create-rate"
                  name="rate"
                  type="number"
                  step="0.1"
                  value={formData.rate}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-loanDate" className="text-sm font-medium">Loan Date</Label>
                <Input
                  id="create-loanDate"
                  name="loanDate"
                  type="date"
                  value={formData.loanDate}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Loan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the loan for{" "}
              {selectedLoan?.customer?.name || "this customer"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoanTable;