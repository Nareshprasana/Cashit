// components/customers/CustomerTable/index.js
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { User, CreditCard, Filter, X, Search, Loader2 } from "lucide-react";
import { CustomerDialog } from "./CustomerDialog";
import { CustomerFilters } from "./CustomerFilters";
import { columns } from "./CustomerColumns";
import { fetchCustomers, calculateEndDate } from "./utils";

export default function CustomerTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startEndDate, setStartEndDate] = useState("");
  const [endEndDate, setEndEndDate] = useState("");
  const [availableAreas, setAvailableAreas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const customers = await fetchCustomers();
        setData(customers);
        
        const areas = [...new Set(customers.map((c) => c.area).filter(Boolean))];
        setAvailableAreas(areas);
      } catch (err) {
        console.error("Error loading data:", err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  // Filter data
  const filteredData = data.filter((cust) => {
    const totalPaid = cust.totalPaid || 0;
    const loanAmount = cust.loanAmount || 0;
    const isActive = totalPaid < loanAmount;
    
    const matchesGlobal = !globalFilter ||
      cust.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      cust.customerCode?.toLowerCase().includes(globalFilter.toLowerCase());

    const matchesStatus = !statusFilter ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "closed" && !isActive);

    const matchesArea = !areaFilter || cust.area === areaFilter;
    const matchesMinAmount = !minAmount || loanAmount >= Number(minAmount);
    const matchesMaxAmount = !maxAmount || loanAmount <= Number(maxAmount);

    const endDateObj = cust.endDate ? new Date(cust.endDate) : null;
    const matchesStartDate = !startEndDate || (endDateObj && endDateObj >= new Date(startEndDate));
    const matchesEndDate = !endEndDate || (endDateObj && endDateObj <= new Date(endEndDate));

    return matchesGlobal && matchesStatus && matchesArea && 
           matchesMinAmount && matchesMaxAmount && 
           matchesStartDate && matchesEndDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleRowClick = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage all customer accounts and loan details</p>
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
      <CustomerFilters
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        areaFilter={areaFilter}
        setAreaFilter={setAreaFilter}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        startEndDate={startEndDate}
        setStartEndDate={setStartEndDate}
        endEndDate={endEndDate}
        setEndEndDate={setEndEndDate}
        availableAreas={availableAreas}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        areaOpen={areaOpen}
        setAreaOpen={setAreaOpen}
      />

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
          <DataTable 
            columns={columns(handleRowClick)} 
            data={paginatedData} 
          />
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
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                className={currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Customer Dialog */}
      <CustomerDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        setData={setData}
      />
    </div>
  );
}