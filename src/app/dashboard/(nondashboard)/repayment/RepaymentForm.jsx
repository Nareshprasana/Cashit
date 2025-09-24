"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronsUpDown, Check, QrCode, User, MapPin, Calendar, CreditCard, DollarSign, ArrowLeft, Scan } from "lucide-react";
import { motion } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import QRScanner from "@/components/QRScanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RepaymentForm({ customerId }) {
  const [areas, setAreas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [openArea, setOpenArea] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [formData, setFormData] = useState({
    area: "",
    customerCode: "",
    amount: "",
    paymentMethod: "",
    loanAmount: "",
    pendingAmount: "",
    dueDate: "",
    loanId: "",
  });

  const fetchCustomerDetails = async (codeOrId) => {
    try {
      const res = await fetch(`/api/customers/${codeOrId}`);
      if (!res.ok) {
        toast.error(res.status === 404 ? "Customer not found. Please check the code or QR." : "Failed to load customer details.");
        return null;
      }
      return await res.json();
    } catch (error) {
      toast.error("An unexpected error occurred.");
      return null;
    }
  };

  useEffect(() => {
    fetch("/api/area")
      .then((res) => res.json())
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load areas"));
  }, []);

  useEffect(() => {
    if (!formData.area) {
      setCustomers([]);
      setFormData((prev) => ({ ...prev, customerCode: "" }));
      return;
    }
    fetch(`/api/customers/by-area/${formData.area}`)
      .then((res) => res.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error("Failed to load customers");
        setCustomers([]);
      });
  }, [formData.area]);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomerDetails(customerId).then((data) => {
      if (data) {
        const loan = data?.loans?.[0] || {};
        setCustomerDetails({ ...data, ...loan });
        setFormData({
          area: data.areaId || "",
          customerCode: data.customerCode || "",
          amount: "",
          paymentMethod: "",
          loanAmount: loan.loanAmount || "",
          pendingAmount: loan.pendingAmount || "",
          dueDate: loan.dueDate || "",
          loanId: loan.id || "",
        });
      }
    });
  }, [customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount" && customerDetails) {
      const enteredAmount = parseFloat(value || 0);
      const pending = parseFloat(customerDetails.pendingAmount) - enteredAmount;
      setFormData((prev) => ({
        ...prev,
        amount: value,
        pendingAmount: pending >= 0 ? pending.toString() : "0",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomerSelect = async (cust) => {
    setFormData((prev) => ({ ...prev, customerCode: cust.customerCode }));
    setOpenCustomer(false);

    // fetch customer details + auto populate loan info
    const data = await fetchCustomerDetails(cust.customerCode);
    if (data) {
      const loan = data?.loans?.[0] || {};
      setCustomerDetails({ ...data, ...loan });
      setFormData({
        area: data.areaId || "",
        customerCode: data.customerCode || "",
        amount: "",
        paymentMethod: "",
        loanAmount: loan.loanAmount || "",
        pendingAmount: loan.pendingAmount || "",
        dueDate: loan.dueDate || "",
        loanId: loan.id || "",
      });
    }
  };

  const handleClear = () => {
    setFormData({
      area: "",
      customerCode: "",
      amount: "",
      paymentMethod: "",
      loanAmount: "",
      pendingAmount: "",
      dueDate: "",
      loanId: "",
    });
    setCustomers([]);
    setCustomerDetails(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/repayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          loanAmount: formData.loanAmount,
          pendingAmount: formData.pendingAmount,
          dueDate: formData.dueDate,
          loanId: formData.loanId,
        }),
      });
      if (!res.ok) throw new Error("Failed to save repayment");
      await res.json();
      toast.success("Repayment added successfully!");
      handleClear();
    } catch {
      toast.error("Error saving repayment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repayment Entry</h1>
          <p className="text-gray-600">Record customer loan repayments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Repayment Details
            </CardTitle>
            <CardDescription>
              Enter customer repayment information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Area Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Area
                  </Label>
                  <Popover open={openArea} onOpenChange={setOpenArea}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-10">
                        {formData.area ? areas.find((a) => a.id === formData.area)?.areaName || areas.find((a) => a.id === formData.area)?.name : "Select Area"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search area..." />
                        <CommandList>
                          <CommandEmpty>No area found.</CommandEmpty>
                          <CommandGroup>
                            {areas.map((area) => (
                              <CommandItem key={area.id} value={area.areaName || area.name} onSelect={() => { setFormData((prev) => ({ ...prev, area: area.id })); setOpenArea(false); }}>
                                <Check className={cn("mr-2 h-4 w-4", formData.area === area.id ? "opacity-100" : "opacity-0")} />
                                {area.areaName || area.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer
                  </Label>
                  <div className="flex gap-2">
                    <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" disabled={!formData.area} className="flex-1 justify-between h-10">
                          {formData.customerCode ? customers.find((c) => c.customerCode === formData.customerCode)?.customerCode : "Select Customer"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search customer..." />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((cust) => (
                                <CommandItem key={cust.id} value={cust.customerCode} onSelect={() => handleCustomerSelect(cust)}>
                                  <Check className={cn("mr-2 h-4 w-4", formData.customerCode === cust.customerCode ? "opacity-100" : "opacity-0")} />
                                  {cust.customerCode} - {cust.customerName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button 
                      type="button" 
                      variant={scanning ? "default" : "outline"} 
                      onClick={() => setScanning((prev) => !prev)}
                      className="h-10 px-3"
                    >
                      {scanning ? <ArrowLeft className="h-4 w-4" /> : <Scan className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {scanning && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 border rounded-lg overflow-hidden"
                >
                  <div className="p-3 bg-gray-50 border-b">
                    <p className="text-sm font-medium text-gray-700">Scan QR Code</p>
                  </div>
                  <div className="p-4">
                    <QRScanner
                      onScan={async (code) => {
                        let customerCode = code;
                        try {
                          const url = new URL(code);
                          customerCode = url.pathname.split('/').pop();
                        } catch {}
                        const customerData = await fetchCustomerDetails(customerCode);
                        if (customerData) {
                          const customersRes = await fetch(`/api/customers/by-area/${customerData.areaId}`);
                          const customersForArea = await customersRes.json();
                          setCustomers(Array.isArray(customersForArea) ? customersForArea : []);
                          const loan = customerData?.loans?.[0] || {};
                          setCustomerDetails({ ...customerData, ...loan });
                          setFormData({
                            area: customerData.areaId || "",
                            customerCode: customerData.customerCode || "",
                            amount: "",
                            paymentMethod: "",
                            loanAmount: loan.loanAmount || "",
                            pendingAmount: loan.pendingAmount || "",
                            dueDate: loan.dueDate || "",
                            loanId: loan.id || "",
                          });
                          toast.success(`Details for customer ${customerData.customerCode} loaded successfully.`);
                        } else {
                          toast.error("Customer not found or unable to load details.");
                          setFormData(prev => ({ ...prev, customerCode: customerCode, area: "" }));
                          setCustomers([]);
                        }
                        setTimeout(() => { setScanning(false); }, 100);
                      }}
                      onError={(err) => toast.error(err)}
                    />
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Amount
                  </Label>
                  <Input 
                    name="amount" 
                    type="number" 
                    value={formData.amount} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter amount" 
                    className="h-10"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upi">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Loan Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Loan Amount</Label>
                  <Input 
                    name="loanAmount" 
                    type="number" 
                    value={formData.loanAmount} 
                    readOnly 
                    className="h-10 bg-gray-50"
                  />
                </div>

                {/* Pending Amount */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pending Amount</Label>
                  <Input 
                    name="pendingAmount" 
                    type="number" 
                    value={formData.pendingAmount} 
                    readOnly 
                    className="h-10 bg-gray-50"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  <Input 
                    name="dueDate" 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={handleChange} 
                    required 
                    className="h-10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClear}
                  className="h-10"
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-10 min-w-[140px]"
                >
                  {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {isSubmitting ? "Processing..." : "Save Repayment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Customer Info Sidebar */}
        <div className="space-y-4">
          {customerDetails ? (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{cust.customerName || "N/A"}</p>
                    <p className="text-sm text-gray-600">{customerDetails.customerCode}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Mobile</p>
                    <p className="text-sm font-medium">{customerDetails.mobile || "N/A"}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Area</p>
                    <p className="text-sm font-medium">
                      {areas.find(a => a.id === customerDetails.areaId)?.areaName || 
                       areas.find(a => a.id === customerDetails.areaId)?.name || 
                       "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Loan Status</p>
                    <Badge 
                      variant={customerDetails.pendingAmount > 0 ? "default" : "secondary"} 
                      className={customerDetails.pendingAmount > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
                    >
                      {customerDetails.pendingAmount > 0 ? "Active" : "Closed"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <User className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-sm">No customer selected</p>
                  <p className="text-xs">Select a customer to view details</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Loan Amount</span>
                <span className="font-semibold">₹{Number(formData.loanAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Payment</span>
                <span className="font-semibold text-blue-600">₹{Number(formData.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm text-gray-600">Remaining Balance</span>
                <span className="font-semibold text-green-600">₹{Number(formData.pendingAmount || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}