"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import CustomerDetailPage from "@/components/customers/CustomerDetailPage";

export default function CustomerDetailRoute() {
  return (
    <StaffLayout>
      <CustomerDetailPage />
    </StaffLayout>
  );
}
