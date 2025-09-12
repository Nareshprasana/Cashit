import { z } from "zod";

export const areaSchema = z.object({
  areaName: z.string().min(1, "Area name is required"),
  shortCode: z.string().min(1, "Short code is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits"),
});