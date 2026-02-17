import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../ToastProvider";
import {
  addAdmin,
  addMember,
  boostGroup,
  convertGroupToBroadcast,
  createGroupTopic,
  deleteGroupTopic,
  endGroupLiveStream,
  findGroup,
  getGroupRecentActions,
  joinGroup,
  leaveGroup,
  listGroupTopics,
  listMembers,
  removeAdmin,
  removeMember,
  setGroupViewMode,
  startGroupLiveStream,
  updateGroupAdminProfile,
  updateGroupSlowMode,
  updateMemberException,
  updateGroupTopic,
  updatePermissions,
} from "../../Redux/groupRedux/groupThunk";
import {
  selectCurrentGroup,
  selectGroupError,
  selectGroupMembers,
  selectGroupMembersStatus,
  selectGroupRecentActions,
  selectGroupRecentActionsStatus,
  selectGroupTopics,
  selectGroupTopicsStatus,
  selectGroupBoostStatus,
  selectGroupLiveStreamStatus,
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
  const topics = useSelector(selectGroupTopics);
  const topicsStatus = useSelector(selectGroupTopicsStatus);
  const recentActions = useSelector(selectGroupRecentActions);
  const recentActionsStatus = useSelector(selectGroupRecentActionsStatus);
  const boostStatus = useSelector(selectGroupBoostStatus);
  const liveStreamStatus = useSelector(selectGroupLiveStreamStatus);

  const [memberUsername, setMemberUsername] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [removeAdminUsername, setRemoveAdminUsername] = useState("");
  const [permissionsLocal, setPermissionsLocal] = useState({
    canSendMessages: true,
    canSendMedia: true,
    canPinMessages: true,
    canAddMembers: true,
    canEmbedLinks: true,
    canCreatePolls: true,
    canChangeChatInfo: false,
  });
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [viewMode, setViewMode] = useState("message");
  const [slowModeSeconds, setSlowModeSeconds] = useState(0);
  const [adminProfileUsername, setAdminProfileUsername] = useState("");
  const [adminCustomTitle, setAdminCustomTitle] = useState("");
  const [adminAnonymous, setAdminAnonymous] = useState(false);
  const [exceptionMemberId, setExceptionMemberId] = useState("");
  const [exceptionCanSendMedia, setExceptionCanSendMedia] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    dispatch(findGroup(groupId));
    dispatch(listMembers(groupId));
    dispatch(listGroupTopics(groupId));
    dispatch(getGroupRecentActions({ id: groupId, params: { limit: 20 } }));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (currentGroup?.permissions) {
      setPermissionsLocal((prev) => ({
        ...prev,
        ...currentGroup.permissions,
      }));
    }
    if (currentGroup?.settings?.defaultViewMode) {
      setViewMode(currentGroup.settings.defaultViewMode);
    }
    setSlowModeSeconds(Number(currentGroup?.settings?.slowModeSeconds || 0));
  }, [currentGroup]);

  const displayMembers = useMemo(
    () => (Array.isArray(members) ? members : []),
    [members],
  );

  const refreshGroupData = () => {
    if (!groupId) return;
    dispatch(findGroup(groupId));
    dispatch(listMembers(groupId));
    dispatch(listGroupTopics(groupId));
    dispatch(getGroupRecentActions({ id: groupId, params: { limit: 20 } }));
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

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    const result = await dispatch(
      createGroupTopic({
        id: groupId,
        payload: { name: topicName.trim(), description: topicDescription.trim() },
      }),
    );
    if (createGroupTopic.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Topic created");
      setTopicName("");
      setTopicDescription("");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Create topic failed");
    }
  };

  const handleDeleteTopic = async (topicId) => {
    const result = await dispatch(deleteGroupTopic({ id: groupId, topicId }));
    if (deleteGroupTopic.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Topic deleted");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Delete topic failed");
    }
  };

  const handleUpdateTopic = async (topic) => {
    const result = await dispatch(
      updateGroupTopic({
        id: groupId,
        topicId: topic._id,
        payload: { isClosed: !topic.isClosed },
      }),
    );
    if (updateGroupTopic.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Topic updated");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Update topic failed");
    }
  };

  const handleSetViewMode = async (mode) => {
    const result = await dispatch(setGroupViewMode({ id: groupId, viewMode: mode }));
    if (setGroupViewMode.fulfilled.match(result)) {
      toast.success(result.payload?.message || "View mode updated");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "View mode update failed");
    }
  };

  const handleSaveSlowMode = async () => {
    const result = await dispatch(
      updateGroupSlowMode({ id: groupId, slowModeSeconds: Number(slowModeSeconds) }),
    );
    if (updateGroupSlowMode.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Slow mode updated");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Slow mode update failed");
    }
  };

  const handleConvertBroadcast = async () => {
    const result = await dispatch(convertGroupToBroadcast(groupId));
    if (convertGroupToBroadcast.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Group converted");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Conversion failed");
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    if (!adminProfileUsername.trim()) return;
    const result = await dispatch(
      updateGroupAdminProfile({
        id: groupId,
        payload: {
          adminUsername: adminProfileUsername.trim(),
          customTitle: adminCustomTitle.trim() || "Admin",
          isAnonymous: adminAnonymous,
        },
      }),
    );
    if (updateGroupAdminProfile.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Admin profile updated");
      setAdminProfileUsername("");
      setAdminCustomTitle("");
      setAdminAnonymous(false);
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Admin profile update failed");
    }
  };

  const handleSaveMemberException = async (e) => {
    e.preventDefault();
    if (!exceptionMemberId.trim()) return;
    const result = await dispatch(
      updateMemberException({
        id: groupId,
        memberId: exceptionMemberId.trim(),
        overrides: { canSendMedia: exceptionCanSendMedia },
      }),
    );
    if (updateMemberException.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Member exception updated");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Member exception failed");
    }
  };

  const handleBoost = async () => {
    const result = await dispatch(boostGroup(groupId));
    if (boostGroup.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Group boosted");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Boost failed");
    }
  };

  const handleLiveStart = async () => {
    const result = await dispatch(startGroupLiveStream(groupId));
    if (startGroupLiveStream.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Live stream started");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Failed to start live stream");
    }
  };

  const handleLiveEnd = async () => {
    const result = await dispatch(endGroupLiveStream(groupId));
    if (endGroupLiveStream.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Live stream ended");
      refreshGroupData();
    } else {
      toast.error(result.payload?.err || result.payload?.message || "Failed to end live stream");
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
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canEmbedLinks}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canEmbedLinks: e.target.checked,
              }))
            }
          />
          Can embed links
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canCreatePolls}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canCreatePolls: e.target.checked,
              }))
            }
          />
          Can create polls/quizzes
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!permissionsLocal.canChangeChatInfo}
            onChange={(e) =>
              setPermissionsLocal((prev) => ({
                ...prev,
                canChangeChatInfo: e.target.checked,
              }))
            }
          />
          Can change chat info
        </label>
        <button
          type="submit"
          disabled={permissionStatus === "loading"}
          className="rounded-lg bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {permissionStatus === "loading" ? "Saving..." : "Save permissions"}
        </button>
      </form>

      <form className="space-y-2" onSubmit={handleCreateTopic}>
        <p className="text-xs font-semibold">Topics</p>
        <div className="flex gap-2">
          <input
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="new topic name"
            className="flex-1 rounded-lg border border-[#6fa63a]/35 bg-white px-2 py-1.5 text-xs outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white"
          >
            Add
          </button>
        </div>
        <input
          value={topicDescription}
          onChange={(e) => setTopicDescription(e.target.value)}
          placeholder="topic description"
          className="w-full rounded-lg border border-[#6fa63a]/35 bg-white px-2 py-1.5 text-xs outline-none"
        />
        {topicsStatus === "loading" && <p className="text-xs">Loading topics...</p>}
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {topics.map((topic) => (
            <div key={topic._id} className="flex items-center justify-between text-xs">
              <span>
                #{topic.name} {topic.isClosed ? "(closed)" : ""}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleUpdateTopic(topic)}
                  className="rounded border px-2 py-0.5"
                >
                  Toggle
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTopic(topic._id)}
                  className="rounded border border-red-300 px-2 py-0.5 text-red-700"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-semibold">View Mode</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSetViewMode("topic")}
            className={`rounded px-2 py-1 text-xs ${viewMode === "topic" ? "bg-[#4a7f4a] text-white" : "border"}`}
          >
            Topic View
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode("message")}
            className={`rounded px-2 py-1 text-xs ${viewMode === "message" ? "bg-[#4a7f4a] text-white" : "border"}`}
          >
            Message View
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Slow Mode</p>
        <div className="flex gap-2">
          <select
            value={slowModeSeconds}
            onChange={(e) => setSlowModeSeconds(Number(e.target.value))}
            className="rounded border px-2 py-1 text-xs"
          >
            {[0, 10, 30, 60, 300, 900, 3600].map((s) => (
              <option key={s} value={s}>
                {s === 0 ? "Off" : `${s}s`}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleSaveSlowMode} className="rounded border px-2 py-1 text-xs">
            Save
          </button>
        </div>
      </div>

      <form className="space-y-2" onSubmit={handleSaveAdminProfile}>
        <p className="text-xs font-semibold">Admin profile</p>
        <input
          value={adminProfileUsername}
          onChange={(e) => setAdminProfileUsername(e.target.value)}
          placeholder="admin username"
          className="w-full rounded border px-2 py-1 text-xs"
        />
        <input
          value={adminCustomTitle}
          onChange={(e) => setAdminCustomTitle(e.target.value)}
          placeholder="custom title"
          className="w-full rounded border px-2 py-1 text-xs"
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={adminAnonymous}
            onChange={(e) => setAdminAnonymous(e.target.checked)}
          />
          Anonymous mode
        </label>
        <button type="submit" className="rounded border px-2 py-1 text-xs">
          Save admin profile
        </button>
      </form>

      <form className="space-y-2" onSubmit={handleSaveMemberException}>
        <p className="text-xs font-semibold">Member exception</p>
        <input
          value={exceptionMemberId}
          onChange={(e) => setExceptionMemberId(e.target.value)}
          placeholder="member userId"
          className="w-full rounded border px-2 py-1 text-xs"
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={exceptionCanSendMedia}
            onChange={(e) => setExceptionCanSendMedia(e.target.checked)}
          />
          Can send media
        </label>
        <button type="submit" className="rounded border px-2 py-1 text-xs">
          Save exception
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Boost and Live Stream</p>
        <div className="flex gap-2">
          <button type="button" onClick={handleBoost} className="rounded border px-2 py-1 text-xs">
            {boostStatus === "loading" ? "Boosting..." : "Boost"}
          </button>
          <button type="button" onClick={handleLiveStart} className="rounded border px-2 py-1 text-xs">
            {liveStreamStatus === "loading" ? "..." : "Start Live"}
          </button>
          <button type="button" onClick={handleLiveEnd} className="rounded border px-2 py-1 text-xs">
            End Live
          </button>
          <button type="button" onClick={handleConvertBroadcast} className="rounded border px-2 py-1 text-xs">
            Broadcast
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold">Recent actions (48h)</p>
        {recentActionsStatus === "loading" && <p className="text-xs">Loading...</p>}
        <div className="max-h-24 overflow-y-auto space-y-1">
          {recentActions.slice(0, 20).map((action) => (
            <p key={action._id} className="text-[11px] text-[rgba(23,3,3,0.72)]">
              {action.action}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupManagePanel;
