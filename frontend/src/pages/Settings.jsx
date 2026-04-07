import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Image,
  Loader2,
  Phone,
  Shield,
  UserMinus,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectAuthError,
  selectUpdatePrivacyStatus,
  selectUser,
} from "../Redux/userRedux/authSelector";
import {
  blockUserSetting,
  unblockUserSetting,
  updatePrivacySettings,
} from "../Redux/userRedux/authThunk";
import {
  selectRegisteredUsers,
  selectRegisteredUsersStatus,
} from "../Redux/contactRedux/contactSelector";
import { listRegisteredUsers } from "../Redux/contactRedux/contactThunk";
import { resolveProfileUrl, toInitials } from "../utils/media";
import { useToast } from "../components/ToastProvider";

const PRIVACY_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "contacts", label: "My Contacts" },
  { value: "nobody", label: "Nobody" },
];

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const settingsRows = [
  {
    key: "privacyLastSeen",
    title: "Last Seen & Online",
    description: "Control who can see your online state.",
    icon: Eye,
  },
  {
    key: "privacyProfilePhoto",
    title: "Profile Photo",
    description: "Choose who can view your profile picture.",
    icon: Image,
  },
  {
    key: "privacyPhoneNumber",
    title: "Phone Number",
    description: "Restrict phone visibility to your audience.",
    icon: Phone,
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const user = useSelector(selectUser);
  const users = useSelector(selectRegisteredUsers);
  const usersStatus = useSelector(selectRegisteredUsersStatus);
  const updatePrivacyStatus = useSelector(selectUpdatePrivacyStatus);
  const authError = useSelector(selectAuthError);

  const [privacyDraft, setPrivacyDraft] = useState({
    privacyLastSeen: "contacts",
    privacyProfilePhoto: "contacts",
    privacyPhoneNumber: "contacts",
  });
  const [blockCandidateId, setBlockCandidateId] = useState("");

  useEffect(() => {
    dispatch(listRegisteredUsers({ limit: 60 }));
  }, [dispatch]);

  useEffect(() => {
    setPrivacyDraft({
      privacyLastSeen: user?.privacySettings?.privacyLastSeen || "contacts",
      privacyProfilePhoto:
        user?.privacySettings?.privacyProfilePhoto || "contacts",
      privacyPhoneNumber:
        user?.privacySettings?.privacyPhoneNumber || "contacts",
    });
  }, [
    user?.privacySettings?.privacyLastSeen,
    user?.privacySettings?.privacyPhoneNumber,
    user?.privacySettings?.privacyProfilePhoto,
  ]);

  const currentUserId = normalizeId(user?._id || user?.id);

  const blockedIds = useMemo(() => {
    const raw = Array.isArray(user?.security?.blockedUsers)
      ? user.security.blockedUsers
      : [];
    return raw.map((id) => normalizeId(id)).filter(Boolean);
  }, [user?.security?.blockedUsers]);

  const usersMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((entry) => {
      const id = normalizeId(entry?._id || entry?.id);
      if (id) map.set(id, entry);
    });
    return map;
  }, [users]);

  const blockableUsers = useMemo(() => {
    return (users || []).filter((entry) => {
      const id = normalizeId(entry?._id || entry?.id);
      if (!id || id === currentUserId) return false;
      return !blockedIds.includes(id);
    });
  }, [blockedIds, currentUserId, users]);

  const blockedUsers = useMemo(() => {
    return blockedIds.map((id) => {
      const found = usersMap.get(id);
      if (found) return found;
      return {
        _id: id,
        identity: {
          username: "unknown",
          firstName: "",
          lastName: "",
          profileUrl: "",
        },
      };
    });
  }, [blockedIds, usersMap]);

  const hasPrivacyChanges = useMemo(() => {
    return (
      privacyDraft.privacyLastSeen !==
        (user?.privacySettings?.privacyLastSeen || "contacts") ||
      privacyDraft.privacyProfilePhoto !==
        (user?.privacySettings?.privacyProfilePhoto || "contacts") ||
      privacyDraft.privacyPhoneNumber !==
        (user?.privacySettings?.privacyPhoneNumber || "contacts")
    );
  }, [privacyDraft, user?.privacySettings]);

  const handlePrivacyChange = (key) => (event) => {
    const nextValue = event.target.value;
    setPrivacyDraft((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSavePrivacy = async () => {
    const result = await dispatch(updatePrivacySettings(privacyDraft));
    if (updatePrivacySettings.fulfilled.match(result)) {
      toast.success("Privacy settings updated");
      return;
    }
    toast.error(
      result.payload?.err || result.payload?.message || "Update failed",
    );
  };

  const handleBlockUser = async () => {
    const userId = blockCandidateId.trim();
    if (!userId) return;
    const result = await dispatch(blockUserSetting(userId));
    if (blockUserSetting.fulfilled.match(result)) {
      setBlockCandidateId("");
      toast.success("User blocked");
      return;
    }
    toast.error(
      result.payload?.err || result.payload?.message || "Block failed",
    );
  };

  const handleUnblockUser = async (userId) => {
    const result = await dispatch(unblockUserSetting(userId));
    if (unblockUserSetting.fulfilled.match(result)) {
      toast.success("User unblocked");
      return;
    }
    toast.error(
      result.payload?.err || result.payload?.message || "Unblock failed",
    );
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-[860px] space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
          <button
            type="button"
            onClick={() => navigate("/sidebar")}
            className="rounded-lg border border-[#6fa63a]/20 bg-white p-2 text-[#2f5b2f] transition-all hover:-translate-y-0.5 hover:shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={15} />
          </button>
          <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
            Privacy & Settings
          </p>
          <button
            type="button"
            onClick={() => navigate("/myprofile")}
            className="rounded-full border border-[#6fa63a]/25 bg-white px-3 py-1 text-xs font-semibold text-[#2f5b2f] transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            Open Profile
          </button>
        </div>

        <section className="rounded-3xl border border-[#6fa63a]/28 bg-[linear-gradient(145deg,#f8fdf3_0%,#edf8e7_55%,#e2f0d7_100%)] p-5 shadow-[0_16px_34px_rgba(74,127,74,0.11)]">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-[#2f5b2f] shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[rgba(23,3,3,0.9)]">
                Privacy Controls
              </h1>
              <p className="text-sm text-[rgba(23,3,3,0.66)]">
                Tune exactly who can see your profile information.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {settingsRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.key}
                  className="grid gap-2 rounded-xl border border-[#6fa63a]/20 bg-white/85 p-3 md:grid-cols-[1fr_180px] md:items-center"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-[rgba(23,3,3,0.88)]">
                      <Icon size={14} className="text-[#2f5b2f]" />
                      {row.title}
                    </p>
                    <p className="text-xs text-[rgba(23,3,3,0.62)]">
                      {row.description}
                    </p>
                  </div>
                  <select
                    value={privacyDraft[row.key]}
                    onChange={handlePrivacyChange(row.key)}
                    className="rounded-lg border border-[#6fa63a]/30 bg-[#f9fdf6] px-2 py-2 text-sm outline-none focus:border-[#4a7f4a]"
                  >
                    {PRIVACY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={updatePrivacyStatus === "loading" || !hasPrivacyChanges}
              onClick={handleSavePrivacy}
              className="inline-flex items-center gap-2 rounded-full bg-[#4a7f4a] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#3f6e3f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatePrivacyStatus === "loading" && (
                <Loader2 size={14} className="animate-spin" />
              )}
              {updatePrivacyStatus === "loading" ? "Saving..." : "Save Privacy"}
            </button>
            {!hasPrivacyChanges && (
              <p className="text-xs text-[rgba(23,3,3,0.62)]">
                All settings are up to date.
              </p>
            )}
          </div>

          {authError && (
            <p className="mt-2 text-xs text-red-600">{authError}</p>
          )}
        </section>

        <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.11)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
              Blocked Users
            </h2>
            <span className="rounded-full bg-[#6fa63a]/15 px-2 py-0.5 text-[11px] font-semibold text-[#2f5b2f]">
              {blockedIds.length}
            </span>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <select
              value={blockCandidateId}
              onChange={(event) => setBlockCandidateId(event.target.value)}
              disabled={
                usersStatus === "loading" || blockableUsers.length === 0
              }
              className="rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a] disabled:opacity-60"
            >
              <option value="">
                {usersStatus === "loading"
                  ? "Loading users..."
                  : blockableUsers.length === 0
                    ? "No users available to block"
                    : "Select a user to block"}
              </option>
              {blockableUsers.map((entry) => {
                const id = normalizeId(entry?._id || entry?.id);
                const name =
                  `${entry?.identity?.firstName || ""} ${entry?.identity?.lastName || ""}`.trim() ||
                  entry?.identity?.username ||
                  "Unknown";
                const username = entry?.identity?.username || "unknown";
                return (
                  <option key={id} value={id}>
                    {name} (@{username})
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={handleBlockUser}
              disabled={!blockCandidateId}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-all hover:-translate-y-0.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserMinus size={14} />
              Block
            </button>
          </div>

          {blockedUsers.length === 0 ? (
            <p className="text-xs text-[rgba(23,3,3,0.62)]">
              You have not blocked anyone.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((entry) => {
                const id = normalizeId(entry?._id || entry?.id);
                const displayName =
                  `${entry?.identity?.firstName || ""} ${entry?.identity?.lastName || ""}`.trim() ||
                  entry?.identity?.username ||
                  "Unknown";
                const username = entry?.identity?.username || "unknown";
                const avatarUrl = resolveProfileUrl(
                  entry?.identity?.profileUrl,
                );
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/85 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-9 w-9 rounded-full border border-[#6fa63a]/20 object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6fa63a]/20 bg-[#eaf4e2] text-xs font-semibold text-[#4a7f4a]">
                          {toInitials(displayName) || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[rgba(23,3,3,0.88)]">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-[rgba(23,3,3,0.62)]">
                          @{username}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblockUser(id)}
                      className="rounded-lg border border-[#6fa63a]/30 bg-[#f8fdf3] px-2 py-1 text-xs font-semibold text-[#2f5b2f] transition-all hover:-translate-y-0.5 hover:bg-white"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
