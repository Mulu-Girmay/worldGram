import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  selectAuthInitialized,
  selectIsAuthenticated,
} from "../Redux/userRedux/authSelector";
import {
  findChannel,
  joinChannelByInviteToken,
} from "../Redux/channelRedux/channelThunk";

const JoinChannel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authInitialized = useSelector(selectAuthInitialized);
  const inviteToken = useMemo(
    () => searchParams.get("token") || "",
    [searchParams],
  );
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!inviteToken) {
      setStatus("failed");
      setMessage("Invite token is missing.");
      return;
    }

    if (!authInitialized) return;

    if (!isAuthenticated) {
      sessionStorage.setItem("pendingChannelInviteToken", inviteToken);
      setStatus("needs-auth");
      setMessage("Log in to join this channel.");
      return;
    }

    let alive = true;
    const run = async () => {
      try {
        setStatus("loading");
        const result = await dispatch(
          joinChannelByInviteToken({ inviteToken }),
        ).unwrap();
        const channelId = result?.channelId || null;
        if (channelId) {
          await dispatch(findChannel(channelId));
          if (!alive) return;
          sessionStorage.removeItem("pendingChannelInviteToken");
          setStatus("success");
          setMessage("Channel joined successfully.");
          navigate("/channel", { replace: true });
          return;
        }
        setStatus("failed");
        setMessage("Could not resolve channel from invite link.");
      } catch (err) {
        setStatus("failed");
        setMessage(
          err?.payload?.err || err?.message || "Failed to join channel.",
        );
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [authInitialized, dispatch, inviteToken, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#eaf4e2] px-4 py-10 text-[rgba(23,3,3,0.87)]">
      <div className="mx-auto max-w-md rounded-3xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-6 shadow-[0_16px_35px_rgba(74,127,74,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4a7f4a]">
          Channel invite
        </p>
        <h1 className="mt-2 text-2xl font-bold">Join channel</h1>
        <p className="mt-2 text-sm text-[rgba(23,3,3,0.68)]">
          {status === "loading"
            ? "Joining the channel..."
            : message || "Open the invite link to join."}
        </p>

        {status === "needs-auth" && (
          <div className="mt-4 rounded-2xl border border-[#6fa63a]/20 bg-white/80 p-4">
            <p className="text-sm text-[rgba(23,3,3,0.75)]">
              You need to log in before joining this channel.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                to="/login"
                className="rounded-xl bg-[#4a7f4a] px-4 py-2 text-sm font-semibold text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl border border-[#6fa63a]/35 px-4 py-2 text-sm font-semibold text-[#2f5b2f]"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinChannel;
