import React, { useState } from "react";
import { ProfileNav } from "../Profile";
import { ArrowLeft, Check, ListCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createChannel } from "../../Redux/channelRedux/channelThunk";

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
      console.log(result.payload);
      navigate("/channel");
    }
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

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(120deg,#f8fdf3_0%,#edf7e6_45%,#e2f0d7_100%)] p-5 shadow-[0_14px_30px_rgba(74,127,74,0.12)]">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#6fa63a]/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 h-40 w-40 rounded-full bg-[#4a7f4a]/10 blur-2xl" />

        <div className="mb-4 flex items-center justify-between border-b border-[#6fa63a]/25 pb-3">
          <div className="flex items-center gap-2">
            <ArrowLeft
              className="flex   items-center justify-center rounded-xl bg-[#6fa63a]/10 text-[#4a7f4a]"
              aria-label="dot menu"
              size={15}
              onClick={handleBack}
            />
            <p className="text-sm font-semibold tracking-wide text-[#2f5b2f]">
              New Channel Setup
            </p>
          </div>
          <div className="flex justify-end">
            <Check
              size={20}
              className="text-[#4a7f4a]"
              type="submit"
              onClick={handleSubmit}
            />
          </div>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              onChange={handleChange}
              type="text"
              name="name"
              value={formValues.name}
              placeholder="Channel name"
              className="rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            />
            <input
              onChange={handleChange}
              type="text"
              name="userName"
              value={formValues.userName}
              placeholder="Username"
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
            // value={fileName}
            name="media"
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            value={formValues.description}
            onChange={handleChange}
            name="description"
            rows="3"
            placeholder="Describe what this channel is about..."
            className="resize-none rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
          />
        </form>
      </div>
    </div>
  );
};

export default NewChannelForm;
