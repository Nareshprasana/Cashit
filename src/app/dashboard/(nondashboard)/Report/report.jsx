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
import QRCode from "qrcode";

export default function ReportPage() {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [repayments, setRepayments] = useState([]);

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
      const params = new URLSearchParams();
      if (selectedArea) params.append("areaId", selectedArea);
      if (minValue) params.append("min", minValue);
      if (maxValue) params.append("max", maxValue);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = () => fetchCustomers();

  const handleReset = () => {
    setSelectedArea("");
    setMinValue("");
    setMaxValue("");
    fetchCustomers();
  };

  const handleRowClick = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  // Fetch QR + repayments when customer selected
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

  const numberOfRepayments = useMemo(() => repayments.length, [repayments]);

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
    a.download = `Statement_${nameSafe}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Filter Section */}
      <div className="p-6 rounded-2xl shadow bg-white border space-y-4">
        <h2 className="text-lg font-semibold">Filter Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="mb-1 block">Area</Label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {areas.length > 0 ? (
                  areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.areaName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No areas available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 block">Min Amount</Label>
            <Input
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="Enter min"
            />
          </div>

          <div>
            <Label className="mb-1 block">Max Amount</Label>
            <Input
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              placeholder="Enter max"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleSearch} className="flex-1">
              Search
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="p-6 rounded-2xl shadow bg-white border">
        <h2 className="text-lg font-semibold mb-4">All Customers</h2>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {[
                  "Code",
                  "Name",
                  "Mobile",
                  "Loan",
                  "Paid",
                  "Pending",
                  "Due Date",
                  "Action",
                ].map((col) => (
                  <th
                    key={col}
                    className="p-2 border text-left text-sm font-semibold"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="p-2 border">{c.customerCode}</td>
                    <td className="p-2 border">{c.name}</td>
                    <td className="p-2 border">{c.mobile}</td>
                    <td className="p-2 border">₹{c.loanAmount}</td>
                    <td className="p-2 border">₹{c.totalPaid}</td>
                    <td className="p-2 border">₹{c.pendingAmount}</td>
                    <td className="p-2 border">
                      {c.dueDate
                        ? new Date(c.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-2 border text-center">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRowClick(c)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="p-4 border text-center text-gray-500"
                    colSpan={8}
                  >
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Customer Details
            </DialogTitle>
            <DialogDescription>
              Info and QR for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left */}
              <div className="md:col-span-1 flex flex-col items-center gap-4">
                {selectedCustomer.photoUrl ? (
                  <img
                    src={selectedCustomer.photoUrl}
                    alt="Customer"
                    className="h-28 w-28 rounded-full object-cover border shadow"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 shadow">
                    No Photo
                  </div>
                )}

                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="h-32 w-32 border rounded shadow"
                  />
                ) : (
                  <div className="h-32 w-32 border rounded flex items-center justify-center text-xs text-gray-500">
                    QR Loading...
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        selectedCustomer.customerCode
                      )
                    }
                  >
                    Copy Code
                  </Button>
                  <Button variant="outline" onClick={handleDownloadStatement}>
                    Download Statement
                  </Button>
                </div>
              </div>

              {/* Right */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p>
                    <strong>Mobile:</strong> {selectedCustomer.mobile}
                  </p>
                  <p>
                    <strong>Aadhar:</strong> {selectedCustomer.aadhar}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedCustomer.address}
                  </p>
                  <p>
                    <strong>Loan:</strong> ₹{selectedCustomer.loanAmount}
                  </p>
                  <p>
                    <strong>Paid:</strong> ₹{selectedCustomer.totalPaid}
                  </p>
                  <p>
                    <strong>Pending:</strong> ₹{selectedCustomer.pendingAmount}
                  </p>
                  <p>
                    <strong>Due Date:</strong>{" "}
                    {selectedCustomer.dueDate
                      ? new Date(
                          selectedCustomer.dueDate
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                  <p>
                    <strong>Repayments:</strong> {numberOfRepayments}
                  </p>
                </div>

                <div>
                  <div className="font-semibold mb-2">Repayments</div>
                  {repayments.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      No repayments found.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-auto border rounded shadow">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2">Date</th>
                            <th className="text-left px-3 py-2">Amount</th>
                            <th className="text-left px-3 py-2">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repayments.map((r) => (
                            <tr key={r.id} className="border-t">
                              <td className="px-3 py-2">
                                {r.date
                                  ? new Date(r.date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">
                                ₹{Number(r.amount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-2">{r.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No customer selected.</div>
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
