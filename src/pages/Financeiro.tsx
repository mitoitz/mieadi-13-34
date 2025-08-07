import { FinancialDashboard } from "@/components/financial/FinancialDashboard";

export function Financeiro() {
  return (
    <div className="container mx-auto p-6">
      <FinancialDashboard userType="admin" />
    </div>
  );
}