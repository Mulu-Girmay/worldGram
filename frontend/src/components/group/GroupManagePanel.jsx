import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../ToastProvider";
import {
  addAdmin,
  addMember,
  findGroup,
  joinGroup,
  leaveGroup,
  listMembers,
  removeAdmin,
  removeMember,
  updatePermissions,
} from "../../Redux/groupRedux/groupThunk";
import {
  selectCurrentGroup,
  selectGroupError,
  selectGroupMembers,
  selectGroupMembersStatus,
  selectPermissionStatus,
} from "../../Redux/groupRedux/groupSelector";
import { resolveProfileUrl, toInitials } from "../../utils/media";

const GroupManagePanel = ({ groupId }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const currentGroup = useSelector(selectCurrentGroup);
  const members = useSelector(selectGroupMembers);
  const membersStatus = useSelector(selectGroupMembersStatus);
  const groupError = useSelector(selectGroupError);
  const permissionStatus = useSelector(selectPermissionStatus);

  const [memberUsername, setMemberUsername] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [removeAdminUsername, setRemoveAdminUsername] = useState("");
  const [permissionsLocal, setPermissionsLocal] = useState({
    canSendMessages: true,
    canSendMedia: true,
    canPinMessages: true,
    canAddMembers: true,
  });

  useEffect(() => {
    if (!groupId) return;
    dispatch(findGroup(groupId));
    dispatch(listMembers(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (currentGroup?.permissions) {
      setPermissionsLocal((prev) => ({
        ...prev,
        ...currentGroup.permissions,
      }));
    }
  }, [currentGroup]);

  const displayMembers = useMemo(
    () => (Array.isArray(members) ? members : []),
    [members],
  );

  const refreshGroupData = () => {
    if (!groupId) return;
    dispatch(findGroup(groupId));
    dispatch(listMembers(groupId));
  };

  const handleJoin = async () => {
    const result = await dispatch(joinGroup(groupId));
    if (joinGroup.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Joined group");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Join failed");
    }
  };

  const handleLeave = async () => {
    const result = await dispatch(leaveGroup(groupId));
    if (leaveGroup.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Left group");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Leave failed");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUsername.trim()) return;
    const result = await dispatch(
      addMember({ id: groupId, payload: { newMemberUsername: memberUsername } }),
    );
    if (addMember.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Member added");
      setMemberUsername("");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Add member failed");
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim()) return;
    const result = await dispatch(
      addAdmin({ id: groupId, payload: { newAdminUsername: adminUsername } }),
    );
    if (addAdmin.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Admin added");
      setAdminUsername("");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Add admin failed");
    }
  };

  const handleRemoveAdmin = async (e) => {
    e.preventDefault();
    if (!removeAdminUsername.trim()) return;
    const result = await dispatch(
      removeAdmin({ id: groupId, payload: { adminUsername: removeAdminUsername } }),
    );
    if (removeAdmin.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Admin removed");
      setRemoveAdminUsername("");
      refreshGroupData();
    } else {
      toast.error(
        result.payload?.err || result.payload?.message || "Remove admin failed",
      );
    }
  };

  const handleRemoveMember = async (memberId) => {
    const result = await dispatch(
      removeMember({ id: groupId, payload: { memberId } }),
    );
    if (removeMember.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Member removed");
      refreshGroupData();
    } else {
      toast.error(
        result.payload?.err || result.payload?.message || "Remove member failed",
      );
    }
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    const result = await dispatch(
      updatePermissions({ id: groupId, permissions: permissionsLocal }),
    );
    if (updatePermissions.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Permissions updated");
      refreshGroupData();
    } else {
      toast.error(
        result.payload?.err || result.payload?.message || "Permissions update failed",
      );
    }
  };

  if (!groupId) return null;

  return (
    <div className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#2f5b2f]">Group controls</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleJoin}
            className="rounded-lg bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white"
          >
            Join
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-lg border border-[#6fa63a]/40 px-3 py-1 text-xs font-semibold text-[#2f5b2f]"
          >
            Leave
          </button>
        </div>
      </div>

      {groupError && <p className="text-xs text-red-600">{groupError}</p>}

      <form className="flex gap-2" onSubmit={handleAddMember}>
        <input
          value={memberUsername}
          onChange={(e) => setMemberUsername(e.target.value)}
          placeholder="username to add member"
          className="flex-1 rounded-lg border border-[#6fa63a]/35 bg-white px-2 py-1.5 text-xs outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white"
        >
          Add member
        </button>
      </form>

      <form className="flex gap-2" onSubmit={handleAddAdmin}>
        <input
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
          placeholder="username to add admin"
          className="flex-1 rounded-lg border border-[#6fa63a]/35 bg-white px-2 py-1.5 text-xs outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white"
        >
          Add admin
        </button>
      </form>

      <form className="flex gap-2" onSubmit={handleRemoveAdmin}>
        <input
          value={removeAdminUsername}
          onChange={(e) => setRemoveAdminUsername(e.target.value)}
          placeholder="username to remove admin"
          className="flex-1 rounded-lg border border-[#6fa63a]/35 bg-white px-2 py-1.5 text-xs outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700"
        >
          Remove admin
        </button>
      </form>

      <div className="rounded-xl border border-[#6fa63a]/20 bg-white/70 p-2">
        <p className="text-xs font-semibold mb-1">Members</p>
        {membersStatus === "loading" && (
          <p className="text-xs text-[rgba(23,3,3,0.62)]">Loading members...</p>
        )}
        {membersStatus !== "loading" && displayMembers.length === 0 && (
          <p className="text-xs text-[rgba(23,3,3,0.62)]">No members</p>
        )}
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {displayMembers.map((member) => {
            const memberId = member?._id || "";
            const username = member?.identity?.username || "unknown";
            const fullName =
              `${member?.identity?.firstName || ""} ${member?.identity?.lastName || ""}`.trim() ||
              username;
            const avatar = resolveProfileUrl(member?.identity?.profileUrl);
            return (
              <div key={memberId} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName}
                      className="h-7 w-7 rounded-full border border-[#6fa63a]/25 object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#6fa63a]/25 bg-[#eaf4e2] text-[10px] font-semibold text-[#4a7f4a]">
                      {toInitials(fullName) || "U"}
                    </div>
                  )}
                  <span className="truncate text-xs">@{username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(memberId)}
                  className="rounded border border-red-300 px-2 py-0.5 text-[10px] text-red-700"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <form className="space-y-2" onSubmit={handleSavePermissions}>
        <p className="text-xs font-semibold">Permissions</p>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canSendMessages}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canSendMessages: e.target.checked,
              }))
            }
          />
          Can send messages
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canSendMedia}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canSendMedia: e.target.checked,
              }))
            }
          />
          Can send media
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canPinMessages}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canPinMessages: e.target.checked,
              }))
            }
          />
          Can pin messages
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canAddMembers}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canAddMembers: e.target.checked,
              }))
            }
          />
          Can add members
        </label>
        <button
          type="submit"
          disabled={permissionStatus === "loading"}
          className="rounded-lg bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {permissionStatus === "loading" ? "Saving..." : "Save permissions"}
        </button>
      </form>
    </div>
  );
};

export default GroupManagePanel;
