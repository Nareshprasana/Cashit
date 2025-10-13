// AddArea.jsx
"use client";

import { useState, useEffect } from "react";
import { areaSchema } from "./validation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddArea({ onAreaCreated = () => {} }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    areaName: "",
    shortCode: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "shortCode" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setErrors({});

    const result = areaSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);

      toast.error("Please fill in all required fields correctly.", {
        description: "Validation failed",
      });
      return;
    }

    try {
      const response = await fetch("/api/area", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create area");
      }

      const data = await response.json();
      toast.success(`${data.areaName} has been successfully added.`, {
        description: "Area created",
      });
      onAreaCreated(data);

      setFormData({ areaName: "", shortCode: "", pincode: "" });
      setOpen(false);
    } catch (err) {
      toast.error("Failed to save area", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <Button variant="default" type="button" disabled>
        + Create New Area
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" type="button">
          + Create New Area
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[90vw] sm:max-w-[450px] w-full">
        <DialogHeader>
          <DialogTitle>Create New Area</DialogTitle>
          <DialogDescription>
            Add a new service area to organize customers and repayments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="areaName">Area Name</Label>
              <Input
                id="areaName"
                name="areaName"
                value={formData.areaName}
                onChange={handleChange}
                placeholder="Eg: Gandhipuram"
                disabled={loading}
                className={errors.areaName ? "border-red-500" : ""}
              />
              {errors.areaName && (
                <p className="text-red-500 text-xs">{errors.areaName}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shortCode">Short Code</Label>
              <Input
                id="shortCode"
                name="shortCode"
                value={formData.shortCode}
                onChange={handleChange}
                placeholder="Eg: GPM"
                maxLength={5}
                disabled={loading}
                className={errors.shortCode ? "border-red-500" : ""}
              />
              {errors.shortCode && (
                <p className="text-red-500 text-xs">{errors.shortCode}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Eg: 641012"
              disabled={loading}
              className={errors.pincode ? "border-red-500" : ""}
            />
            {errors.pincode && (
              <p className="text-red-500 text-xs">{errors.pincode}</p>
            )}
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save Area"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}