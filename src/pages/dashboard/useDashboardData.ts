import { useQuery } from "@tanstack/react-query";
import { financeApi, loansApi, transactionsApi } from "../../api/finance";
import { groupsApi } from "../../api/groups";

/** Loads every dataset the dashboard renders for the given group. */
export function useDashboardData(groupId?: string) {
  const { data: summary } = useQuery({
    queryKey: ["finance-summary", groupId],
    queryFn: () => financeApi.getSummary(),
  });
  const { data: activeLoans } = useQuery({
    queryKey: ["loans", groupId, "Active"],
    queryFn: () => loansApi.getAll({ status: "Active" }),
  });
  const { data: recentTransactions } = useQuery({
    queryKey: ["transactions", groupId, "recent"],
    queryFn: () => transactionsApi.getAll({ page: 1, pageSize: 5 }),
  });
  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.getById(groupId!),
    enabled: !!groupId,
  });
  return { summary, activeLoans, recentTransactions, group };
}
