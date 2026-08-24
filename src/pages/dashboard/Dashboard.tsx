import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, membersApi } from "../../api/groups";
import { useAuth } from "../../context/AuthContext";
import { useDashboardData } from "./useDashboardData";
import DashboardHeader from "./DashboardHeader";
import GroupInfoBar from "./GroupInfoBar";
import KpiSection from "./KpiSection";
import MembersTable from "./MembersTable";
import ActiveLoansCard from "./ActiveLoansCard";
import RecentDepositsCard from "./RecentDepositsCard";
import AddMemberModal, { type MemberFormValues } from "./AddMemberModal";
import GroupSettingsModal, { type GroupFormValues } from "./GroupSettingsModal";

type ApiError = { response?: { data?: { detail?: string } } };

export default function Dashboard() {
  const { user, isGroupAdmin } = useAuth();
  const isAdmin = isGroupAdmin;
  const groupId = user?.activeGroupId;
  const qc = useQueryClient();

  const [showGroupEdit, setShowGroupEdit] = useState(false);
  const [groupEditError, setGroupEditError] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const { summary, activeLoans, recentDeposits, group, members } =
    useDashboardData(groupId);

  const updateGroupMutation = useMutation({
    mutationFn: (form: GroupFormValues) => groupsApi.update(groupId!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      setShowGroupEdit(false);
      setGroupEditError("");
    },
    onError: (e: ApiError) =>
      setGroupEditError(e.response?.data?.detail ?? "Failed to update group"),
  });

  const addMemberMutation = useMutation({
    mutationFn: (form: MemberFormValues) =>
      membersApi.create({
        groupRole: "Member",
        ...form,
        phoneNumber: form.phoneNumber || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", groupId] });
      qc.invalidateQueries({ queryKey: ["finance-summary", groupId] });
      setShowAddMember(false);
      setMemberError("");
    },
    onError: (e: ApiError) =>
      setMemberError(e.response?.data?.detail ?? "Failed to add member"),
  });

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        isAdmin={isAdmin}
        onAddMember={() => {
          setMemberError("");
          setShowAddMember(true);
        }}
        onEditGroup={() => {
          setGroupEditError("");
          setShowGroupEdit(true);
        }}
      />

      {isAdmin && group && <GroupInfoBar group={group} />}

      <KpiSection
        summary={summary}
        memberCount={group?.memberCount ?? 0}
        activeLoanCount={activeLoans?.length ?? 0}
      />

      {isAdmin && <MembersTable members={members} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveLoansCard loans={activeLoans} />
        <RecentDepositsCard deposits={recentDeposits} />
      </div>

      {showAddMember && (
        <AddMemberModal
          error={memberError}
          isPending={addMemberMutation.isPending}
          onClose={() => setShowAddMember(false)}
          onSubmit={(form) => addMemberMutation.mutate(form)}
        />
      )}

      {showGroupEdit && group && (
        <GroupSettingsModal
          group={group}
          error={groupEditError}
          isPending={updateGroupMutation.isPending}
          onClose={() => setShowGroupEdit(false)}
          onSubmit={(form) => updateGroupMutation.mutate(form)}
        />
      )}
    </div>
  );
}
