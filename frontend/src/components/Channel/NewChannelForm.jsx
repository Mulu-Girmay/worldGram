import React, { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createChannel } from "../../Redux/channelRedux/channelThunk";
import {
  selectChannelError,
  selectCreateStatus,
} from "../../Redux/channelRedux/channelSelector";

const NewChannelForm = () => {
  const initials = {
    name: "",
    userName: "",
    description: "",
  };
  const [formValues, setFormValues] = useState(initials);
  const [formError, setFormError] = useState("");
  const [fileName, setFileName] = React.useState("No cover selected");
  const [mediaFile, setMediaFile] = React.useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const createStatus = useSelector(selectCreateStatus);
  const createError = useSelector(selectChannelError);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!formValues.name.trim())
      return setFormError("Channel name is required");

    if (!formValues.userName.trim())
      return setFormError("Username is required");

    // prepare multipart form data
    const formData = new FormData();
    formData.append("name", formValues.name);
    formData.append("userName", formValues.userName);
    formData.append("description", formValues.description || "");
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    const result = await dispatch(createChannel(formData));
    if (createChannel.fulfilled.match(result)) {
      navigate("/channel");
      return;
    }
    setFormError(
      result.payload?.err ||
        result.payload?.message ||
        "Failed to create channel",
    );
  };
  const handleBack = (e) => {
    e.preventDefault();
    navigate("/home");
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "No cover selected");
    setMediaFile(file || null);
  };

  const isLoading = createStatus === "loading";

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(120deg,#f8fdf3_0%,#edf7e6_45%,#e2f0d7_100%)] p-5 shadow-[0_14px_30px_rgba(74,127,74,0.12)]">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#6fa63a]/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 h-40 w-40 rounded-full bg-[#4a7f4a]/10 blur-2xl" />

        <div className="mb-4 flex items-center justify-between border-b border-[#6fa63a]/25 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6fa63a]/10 text-[#4a7f4a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6fa63a]/15 active:scale-95"
            >
              <ArrowLeft size={15} />
            </button>
            <p className="text-sm font-semibold tracking-wide text-[#2f5b2f]">
              New Channel Setup
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              form="new-channel-form"
              disabled={isLoading}
              aria-label="Create channel"
              className="disabled:opacity-60"
            >
              <Check size={20} className="text-[#4a7f4a]" />
            </button>
          </div>
        </div>

        <form
          id="new-channel-form"
          className="grid gap-3"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="sr-only" htmlFor="channel-name">
              Channel name
            </label>
            <input
              onChange={handleChange}
              type="text"
              id="channel-name"
              name="name"
              value={formValues.name}
              placeholder="Channel name"
              autoComplete="organization"
              required
              className="rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            />
            <label className="sr-only" htmlFor="channel-username">
              Channel username
            </label>
            <input
              onChange={handleChange}
              type="text"
              id="channel-username"
              name="userName"
              value={formValues.userName}
              placeholder="Username"
              autoComplete="username"
              required
              className="rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            />
          </div>

          <label
            htmlFor="channelMedia"
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#4a7f4a]/45 bg-[#f6fbefff] px-4 py-3 transition hover:bg-[#eef7e6]"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-[#4a7f4a]">
                Channel cover
              </p>
              <p className="mt-0.5 text-sm text-[rgba(23,3,3,0.8)]">
                {fileName}
              </p>
            </div>
            <span className="rounded-xl border border-[#6fa63a]/40 bg-[#6fa63a]/15 px-3 py-1 text-xs font-semibold text-[#2f5b2f] transition group-hover:bg-[#6fa63a]/25">
              Choose file
            </span>
          </label>
          <input
            id="channelMedia"
            type="file"
            name="media"
            accept="image/*"
            aria-label="Choose channel cover image"
            className="hidden"
            onChange={handleFileChange}
          />

          <label className="sr-only" htmlFor="channel-description">
            Channel description
          </label>
          <textarea
            id="channel-description"
            value={formValues.description}
            onChange={handleChange}
            name="description"
            rows="3"
            placeholder="Describe what this channel is about..."
            aria-label="Channel description"
            className="resize-none rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
          />

          {(formError || createError) && (
            <p className="text-sm text-red-600">{formError || createError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-[10px] bg-[#4a7f4a] px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {isLoading ? "Creating channel..." : "Create channel"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewChannelForm;
