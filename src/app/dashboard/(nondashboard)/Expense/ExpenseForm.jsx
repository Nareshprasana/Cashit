"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, Download, Plus } from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";

export default function ExpenseForm() {
  const [form, setForm] = useState({
    invoiceNumber: "",
    title: "",
    amount: "",
    date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const res = await fetch("/api/expense");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setExpenses([]);
      }
    }
    fetchExpenses();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save expense");
      setExpenses((prev) => [...prev, data]);
      setForm({
        invoiceNumber: "",
        title: "",
        amount: "",
        date: "",
        notes: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error saving expense");
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!expenses.length) return;
    const csvEscape = (v = "") => `"{String(v).replace(/"/g, '""')}"`;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Invoice Number,Title,Amount,Date,Notes",
        ...expenses.map((e) =>
          [e.invoiceNumber, e.title, e.amount, e.date, e.notes || ""]
            .map(csvEscape)
            .join(",")
        ),
      ].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "expenses.csv";
    link.click();
  }

  const filteredExpenses = expenses.filter((exp) => {
    const matchesInvoice = exp.invoiceNumber
      ?.toLowerCase()
      .includes(filterInvoice.toLowerCase());
    const matchesTitle = exp.title
      .toLowerCase()
      .includes(filterTitle.toLowerCase());
    const matchesStartDate = filterStartDate
      ? new Date(exp.date) >= new Date(filterStartDate)
      : true;
    const matchesEndDate = filterEndDate
      ? new Date(exp.date) <= new Date(filterEndDate)
      : true;
    const matchesMinAmount = filterMinAmount
      ? Number(exp.amount) >= Number(filterMinAmount)
      : true;

    return (
      matchesInvoice &&
      matchesTitle &&
      matchesStartDate &&
      matchesEndDate &&
      matchesMinAmount
    );
  });

  const totalAmount = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Expense Tracker</h1>
        {expenses.length > 0 && (
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
          <h2 className="text-xl font-semibold text-gray-800">Add New Expense</h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              name="invoiceNumber"
              value={form.invoiceNumber}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="INV-001"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Expense title"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Additional notes (optional)"
            />
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Filters + Table */}
      {expenses.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          {/* Header with search and filter toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">Expense History</h2>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="Filter by invoice"
                    value={filterInvoice}
                    onChange={(e) => setFilterInvoice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Date From</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Date To</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Min Amount</label>
                  <input
                    type="number"
                    placeholder="Min amount"
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results summary */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredExpenses.length}</span> of <span className="font-medium">{expenses.length}</span> expenses
            </p>
            <p className="text-sm text-gray-600">
              Total: <span className="font-medium text-blue-600">{totalAmount.toFixed(2)}</span>
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-3 text-sm font-medium text-gray-900">{exp.invoiceNumber}</td>
                      <td className="p-3 text-sm text-gray-700">{exp.title}</td>
                      <td className="p-3 text-sm text-right font-medium text-blue-600">
                        {Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {exp.date ? new Date(exp.date).toLocaleDateString() : ""}
                      </td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{exp.notes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No expenses found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot className="bg-blue-50 border-t border-gray-200">
                  <tr>
                    <td className="p-3 text-sm font-medium text-right" colSpan={2}>
                      Total:
                    </td>
                    <td className="p-3 text-sm font-medium text-right text-blue-600">
                      {totalAmount.toFixed(2)}
                    </td>
                    <td className="p-3" colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}