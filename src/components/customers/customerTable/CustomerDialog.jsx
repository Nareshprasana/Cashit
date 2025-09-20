// components/customers/CustomerTable/CustomerDialog.js
"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { CustomerDetails } from "./CustomerDetails";
import { CustomerEditDialog } from "./CustomerEditDialog";
import { handleDelete } from "./CustomerActions";

export function CustomerDialog({ dialogOpen, setDialogOpen, selectedCustomer, setSelectedCustomer, setData }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [repayments, setRepayments] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  return (
    <>
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
            <CustomerDetails 
              selectedCustomer={selectedCustomer} 
              qrCodeUrl={qrCodeUrl}
              repayments={repayments}
              onEdit={() => setEditOpen(true)}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customer selected.
            </div>
          )}

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
                    await handleDelete(selectedCustomer.id, setData, setDialogOpen, setSelectedCustomer, setDeletingId);
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

      {/* Edit Dialog */}
      <CustomerEditDialog
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        setData={setData}
      />
    </>
  );
}