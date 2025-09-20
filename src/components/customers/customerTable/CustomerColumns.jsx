// components/customers/CustomerTable/CustomerColumns.js
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { User, MapPin, Calendar } from "lucide-react";

export const columns = (handleRowClick) => [
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
        onClick={() => handleRowClick(row.original)}
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