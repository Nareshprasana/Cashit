// components/customers/CustomerTable/utils.js
// Helper: calculate end date
export const calculateEndDate = (loanDate, tenure) => {
  if (!loanDate || tenure == null) return null;
  const date = new Date(loanDate);
  date.setMonth(date.getMonth() + Number(tenure));
  return date;
};

// Fetch customers from API
export const fetchCustomers = async () => {
  try {
    const res = await fetch("/api/customers");
    if (!res.ok) throw new Error("Failed to fetch customer data");
    let customers = await res.json();

    customers = customers.map((cust) => ({
      ...cust,
      endDate: cust.endDate
        ? new Date(cust.endDate)
        : cust.loanDate && cust.tenure
        ? calculateEndDate(cust.loanDate, cust.tenure)
        : null,
    }));

    return customers;
  } catch (err) {
    console.error("Error loading data:", err.message);
    throw err;
  }
};