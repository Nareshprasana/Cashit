import { z } from "zod";
export const repaymentSchema = z.object({
  area: z.string().min(1, "Area is required"),
  customerCode: z.string().min(1, "Customer code is required"),
  amount: z.string().min(1, "Amount is required"),
  loanAmount: z.string(),
  pendingAmount: z.string(),
  dueDate: z.string().min(1, "Due date is required"),
});
