// components/customers/CustomerTable/CustomerActions.js
export async function handleDelete(id, setData, setDialogOpen, setSelectedCustomer, setDeletingId) {
  try {
    if (!id || typeof id !== "string") {
      console.error("❌ Invalid ID provided:", id);
      alert("Invalid customer ID. Please try again.");
      return;
    }

    setDeletingId(id);

    const apiUrl = `/api/customers?id=${encodeURIComponent(id)}`;
    const res = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      throw new Error(
        errorData.error || errorData.message || "Failed to delete customer"
      );
    }

    const result = await res.json();

    if (result.success) {
      setData((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer?.id === id) {
        setDialogOpen(false);
        setSelectedCustomer(null);
      }
      alert("Customer deleted successfully!");
    } else {
      throw new Error(result.error || "Failed to delete customer");
    }
  } catch (e) {
    console.error("🔥 Delete error:", e);
    alert(`Delete failed: ${e.message}`);
  } finally {
    setDeletingId(null);
  }
}