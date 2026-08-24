import { useQuery } from "@tanstack/react-query";
import { financeApi, loansApi, depositsApi } from "../../api/finance";
import { groupsApi, membersApi } from "../../api/groups";

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
  const { data: recentDeposits } = useQuery({
    queryKey: ["deposits", groupId],
    queryFn: () => depositsApi.getDeposits(),
  });
  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.getById(groupId!),
    enabled: !!groupId,
  });
  const { data: members } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => membersApi.getAll({ roles: ['Member', 'Admin'] }),
    enabled: !!groupId,
  });

  return { summary, activeLoans, recentDeposits, group, members };
}
