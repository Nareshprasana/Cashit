import { z } from "zod";

export const areaSchema = z.object({
  areaName: z.string().min(1, "Area name is required"),
  shortCode: z.string().min(1, "Short code is required"),
});