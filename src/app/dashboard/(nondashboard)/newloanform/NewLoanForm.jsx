/* -----------------------------------------------------------------
   NewLoanForm.jsx
----------------------------------------------------------------- */
import React, { useEffect, useState } from "react";
import { LoanSchema } from "./Validation";
import { motion } from "framer-motion";

import {
  Loader2,
  Upload,
  FileText,
  X,
  DollarSign,
  User,
  ClipboardList,
  ArrowLeft,
  Scan,
  Calendar,
  MapPin,
  Percent,
  Clock,
  Check,
  ChevronsUpDown,
  Phone,
  IdCard,
  Home,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import QRScanner from "@/components/QRScanner";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { toast } from "sonner";

/* -------------------------------------------------
   Props:
   - onCustomerSelect: fn(customerObject)  // optional
------------------------------------------------- */
const NewLoanForm = ({ onCustomerSelect }) => {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    area: "",
    customerId: "",
    customerCode: "",
    amount: "",
    rate: "",
    tenure: "",
    loanDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [openArea, setOpenArea] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);

  /* ---------- FETCH AREA LIST ---------- */
  useEffect(() => {
    fetch("/api/area")
      .then((res) => res.json())
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to fetch areas"));
  }, []);

  /* ---------- FETCH CUSTOMERS WHEN AREA CHANGES ---------- */
  useEffect(() => {
    if (!form.area) {
      setCustomers([]);
      setForm((prev) => ({ ...prev, customerId: "", customerCode: "" }));
      return;
    }

    fetch(`/api/customers/by-area/${form.area}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.customers)
          ? data.customers
          : [];
        setCustomers(list);
      })
      .catch(() => {
        toast.error("Failed to fetch customers");
        setCustomers([]);
      });
  }, [form.area]);

  /* ---------- HELPERS ---------- */
  const getFieldValue = (obj, fieldNames) => {
    for (const f of fieldNames) {
      if (obj[f] !== undefined && obj[f] !== null && obj[f] !== "") {
        return obj[f];
      }
    }
    return "N/A";
  };

  /* ---------- INPUT HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "area") {
      setOpenArea(false);
      setCustomerDetails(null);
      setForm((prev) => ({ ...prev, customerId: "", customerCode: "" }));
    } else if (name === "customerId") {
      setOpenCustomer(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    // keep the local form state
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerCode: customer.customerCode || customer.code,
    }));
    setCustomerDetails(customer);
    setOpenCustomer(false);

    // tell the parent component (if it supplied a callback)
    if (onCustomerSelect) onCustomerSelect(customer);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5 MB");
      return;
    }
    setDocumentFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setDocumentFile(null);
    setPreviewUrl(null);
  };

  const fetchCustomerDetails = async (codeOrId) => {
    try {
      const res = await fetch(`/api/customers/${codeOrId}`);
      if (!res.ok) {
        toast.error(
          res.status === 404
            ? "Customer not found. Check the code/QR."
            : "Failed to load customer details."
        );
        return null;
      }
      return await res.json();
    } catch {
      toast.error("Unexpected error while loading customer.");
      return null;
    }
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = LoanSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        rate: Number(form.rate),
        tenure: Number(form.tenure),
        documentUrl: documentFile ? documentFile.name : null,
      };

      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Loan successfully submitted! ✅");
        // reset form
        setForm({
          area: "",
          customerId: "",
          customerCode: "",
          amount: "",
          rate: "",
          tenure: "",
          loanDate: new Date().toISOString().split("T")[0],
        });
        setDocumentFile(null);
        setPreviewUrl(null);
        setCustomers([]);
        setCustomerDetails(null);
      } else if (res.status === 409) {
        toast.error(data.error);
      } else {
        toast.error(data.error || "Server error while creating loan.");
      }
    } catch {
      toast.error("Something went wrong while submitting the loan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 flex items-center justify-center">
      <motion.div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">New Loan Application</h1>
              <p className="text-blue-100 text-sm mt-1">
                Complete all fields to create a new loan record
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-1">
          <div className="bg-white rounded-lg">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* ---------- QR SCANNER ---------- */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Scan className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">
                        Quick Customer Scan
                      </h3>
                    </div>

                    <p className="text-sm text-blue-600 mb-2">
                      Scan a customer's QR code to automatically fill their
                      information
                    </p>

                    <Button
                      type="button"
                      variant={scanning ? "default" : "outline"}
                      onClick={() => setScanning((p) => !p)}
                      className="flex items-center gap-2 h-10 w-full"
                    >
                      {scanning ? (
                        <ArrowLeft className="h-4 w-4" />
                      ) : (
                        <Scan className="h-4 w-4" />
                      )}
                      {scanning ? "Close Scanner" : "Scan Customer QR"}
                    </Button>

                    {scanning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 border rounded-lg overflow-hidden"
                      >
                        <div className="p-3 bg-gray-50 border-b">
                          <p className="text-sm font-medium text-gray-700">
                            Scan QR Code
                          </p>
                        </div>
                        <div className="p-4">
                          <QRScanner
                            onScan={async (code) => {
                              // -------------------------------------------------
                              // Extract the code (plain text or last segment of URL)
                              // -------------------------------------------------
                              let custCode = code;
                              try {
                                const u = new URL(code);
                                custCode = u.pathname
                                  .split("/")
                                  .filter(Boolean)
                                  .pop() || code;
                              } catch {}
                              // -------------------------------------------------
                              // Load the full customer record
                              // -------------------------------------------------
                              const cust = await fetchCustomerDetails(custCode);
                              if (!cust) {
                                // nothing found – keep the raw code in the form
                                setForm((p) => ({
                                  ...p,
                                  customerCode: custCode,
                                  area: "",
                                }));
                                setCustomers([]);
                                setCustomerDetails(null);
                                toast.error("Customer not found.");
                              } else {
                                // Populate the area selector + customer selector
                                const customersRes = await fetch(
                                  `/api/customers/by-area/${cust.areaId}`
                                );
                                const custList = await customersRes.json();
                                setCustomers(
                                  Array.isArray(custList)
                                    ? custList
                                    : Array.isArray(custList.customers)
                                    ? custList.customers
                                    : []
                                );

                                setForm((p) => ({
                                  ...p,
                                  area: cust.areaId || "",
                                  customerCode:
                                    cust.customerCode || cust.code || "",
                                  customerId: cust.id || "",
                                }));
                                setCustomerDetails(cust);
                                toast.success(
                                  `Customer ${
                                    cust.customerCode || cust.code
                                  } loaded.`
                                );
                              }
                              // close scanner after a short delay
                              setTimeout(() => setScanning(false), 100);
                            }}
                            onError={(err) => {
                              console.error(err);
                              toast.error("QR scan failed: " + err.message);
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ---------- CUSTOMER INFO ---------- */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Customer Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AREA SELECT */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Area <span className="text-red-500">*</span>
                    </Label>
                    <Popover open={openArea} onOpenChange={setOpenArea}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openArea}
                          className="w-full justify-between h-11"
                        >
                          {form.area
                            ? areas.find((a) => a.id === form.area)
                                ?.areaName ||
                              areas.find((a) => a.id === form.area)?.name
                            : "Select area…"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search area…" />
                          <CommandList>
                            <CommandEmpty>No area found.</CommandEmpty>
                            <CommandGroup>
                              {areas.map((area) => (
                                <CommandItem
                                  key={area.id}
                                  onSelect={() =>
                                    handleSelectChange("area", area.id)
                                  }
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.area === area.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {area.areaName || area.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.area && (
                      <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                    )}
                  </div>

                  {/* CUSTOMER SELECT */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Customer <span className="text-red-500">*</span>
                    </Label>
                    <Popover
                      open={openCustomer}
                      onOpenChange={setOpenCustomer}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCustomer}
                          className="w-full justify-between h-11"
                          disabled={!form.area}
                        >
                          {form.customerId
                            ? customers.find((c) => c.id === form.customerId)
                                ?.customerCode ||
                              customers.find((c) => c.id === form.customerId)
                                ?.code
                            : form.area
                            ? "Select customer…"
                            : "First select an area"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search customer…" />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((cust) => (
                                <CommandItem
                                  key={cust.id}
                                  value={cust.customerCode || cust.code}
                                  onSelect={() => handleCustomerSelect(cust)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.customerId === cust.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {(cust.customerCode || cust.code)} –{" "}
                                  {cust.customerName ||
                                    cust.name ||
                                    "Unnamed"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.customerId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.customerId}
                      </p>
                    )}
                  </div>
                </div>

                {/* SHOW SELECTED CUSTOMER DETAILS (same card you already had) */}
                {customerDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                              >
                                Code:{" "}
                                {getFieldValue(customerDetails, [
                                  "customerCode",
                                  "code",
                                ])}
                              </Badge>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">
                                Full Name
                              </Label>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getFieldValue(customerDetails, [
                                  "customerName",
                                  "name",
                                  "fullName",
                                ])}
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">
                                Mobile
                              </Label>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {getFieldValue(customerDetails, [
                                  "mobile",
                                  "phone",
                                  "contactNumber",
                                  "contact",
                                ])}
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">
                                Aadhar
                              </Label>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <IdCard className="h-3 w-3" />
                                {getFieldValue(customerDetails, [
                                  "aadhar",
                                  "aadhaar",
                                  "aadharNumber",
                                  "aadhaarNumber",
                                ])}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-500">
                                Area
                              </Label>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {areas.find(
                                  (a) => a.id === customerDetails.areaId
                                )?.areaName ||
                                  areas.find(
                                    (a) => a.id === customerDetails.areaId
                                  )?.name ||
                                  getFieldValue(customerDetails, [
                                    "areaName",
                                    "area",
                                  ])}
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">
                                Address
                              </Label>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                {getFieldValue(customerDetails, [
                                  "address",
                                  "fullAddress",
                                  "residenceAddress",
                                ])}
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">
                                Status
                              </Label>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                Active Customer
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Optional document badges */}
                        {(customerDetails.aadharDocumentUrl ||
                          customerDetails.incomeProofUrl ||
                          customerDetails.residenceProofUrl) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Label className="text-xs text-gray-500 mb-2 block">
                              Documents
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {customerDetails.aadharDocumentUrl && (
                                <Badge variant="outline" className="bg-gray-50">
                                  <IdCard className="h-3 w-3 mr-1" />
                                  Aadhar
                                </Badge>
                              )}
                              {customerDetails.incomeProofUrl && (
                                <Badge variant="outline" className="bg-gray-50">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  Income Proof
                                </Badge>
                              )}
                              {customerDetails.residenceProofUrl && (
                                <Badge variant="outline" className="bg-gray-50">
                                  <Home className="h-3 w-3 mr-1" />
                                  Residence Proof
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* ---------- LOAN DETAILS ---------- */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Loan Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Loan Amount <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full h-11 pl-10"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-500 text-xs">{errors.amount}</p>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Interest Rate (%) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="rate"
                        name="rate"
                        type="number"
                        value={form.rate}
                        onChange={handleChange}
                        placeholder="0.0"
                        className="w-full h-11 pl-10"
                      />
                    </div>
                    {errors.rate && (
                      <p className="text-red-500 text-xs">{errors.rate}</p>
                    )}
                  </div>

                  {/* Tenure */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Tenure (Months) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="tenure"
                        name="tenure"
                        type="number"
                        value={form.tenure}
                        onChange={handleChange}
                        placeholder="12"
                        className="w-full h-11 pl-10"
                      />
                    </div>
                    {errors.tenure && (
                      <p className="text-red-500 text-xs">{errors.tenure}</p>
                    )}
                  </div>

                  {/* Loan Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Loan Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        id="loanDate"
                        name="loanDate"
                        value={form.loanDate}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- DOCUMENT UPLOAD ---------- */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Upload Document
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      id="file-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF (max 5 MB)
                      </p>
                      {/* <Button 
                        variant="outline" 
                        className="mt-2"
                        type="button"
                        onChange={handleFileChange}
                        id="file-upload"
                      >
                        Select File
                      </Button> */}
                    </label>
                  </div>

                  {/* preview for images */}
                  {previewUrl && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700">
                        Preview
                      </Label>
                      <div className="relative mt-2 inline-block">
                        <div className="w-48 h-48 border rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={previewUrl}
                            alt="preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removeFile}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* non‑image files */}
                  {documentFile && !previewUrl && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium truncate max-w-xs">
                          {documentFile.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ---------- SUBMIT ---------- */}
              <div className="pt-6 border-t border-gray-200 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-8 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Submit Loan
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewLoanForm;