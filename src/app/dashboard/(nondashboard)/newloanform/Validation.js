// Validation.js
import { z } from "zod";

export const LoanSchema = z.object({
  area: z.string().min(1, { message: "Area is required" }),
  customerId: z.string().min(1, { message: "Customer is required" }),
  
  amount: z.preprocess(
    (val) => Number(val),
    z.number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    }).min(100, { message: "Amount must be at least ₹100" })
  ),

  rate: z.preprocess(
    (val) => Number(val),
    z.number({
      required_error: "Rate is required",
      invalid_type_error: "Rate must be a number",
    }).positive({ message: "Interest rate must be greater than 0" })
  ),

  tenure: z.preprocess(
    (val) => Number(val),
    z.number({
      required_error: "Tenure is required",
      invalid_type_error: "Tenure must be a number",
    }).min(1, { message: "Tenure must be at least 1 month" })
  ),

  loanDate: z.string().min(1, { message: "Loan date is required" }),
});
