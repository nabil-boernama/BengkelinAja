"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import CustomerSearchPage from "@/components/customers/CustomerSearchPage";

export default function CustomersPage() {
  return (
    <StaffLayout>
      <CustomerSearchPage />
    </StaffLayout>
  );
}
