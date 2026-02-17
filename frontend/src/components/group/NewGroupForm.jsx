import { ArrowLeft, Check, UploadIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createGroup } from "../../Redux/groupRedux/groupThunk";
import {
  selectCreateGroupStatus,
  selectGroupError,
} from "../../Redux/groupRedux/groupSelector";
import { createGroupChat, listChats } from "../../Redux/chatRedux/chatThunk";
import { setCurrentChat } from "../../Redux/chatRedux/chatSlice";

const NewGroupForm = () => {
  const dispatch = useDispatch();
  const createStatus = useSelector(selectCreateGroupStatus);
  const groupError = useSelector(selectGroupError);

  const [formValues, setFormValues] = React.useState({
    name: "",
    userName: "",
    description: "",
  });
  const [formError, setFormError] = React.useState("");
  const [fileName, setFileName] = React.useState("No cover selected");
  const [mediaFile, setMediaFile] = React.useState(null);
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/home");
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "No cover selected");
    setMediaFile(file || null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formValues.name.trim()) return setFormError("Group name is required");
    if (!formValues.userName.trim()) return setFormError("Username is required");

    const payload = {
      name: formValues.name.trim(),
      userName: formValues.userName.trim(),
      description: formValues.description?.trim() || "",
      groupPhoto: mediaFile?.name || "",
    };

    const groupResult = await dispatch(createGroup(payload));
    if (!createGroup.fulfilled.match(groupResult)) return;

    const groupId = groupResult.payload?.groupId;
    if (!groupId) return navigate("/home");

    const chatResult = await dispatch(createGroupChat({ groupId, payload: {} }));
    if (createGroupChat.fulfilled.match(chatResult)) {
      const chatId = chatResult.payload?.chatId || null;
      const listResult = await dispatch(listChats({ limit: 50 }));
      if (listChats.fulfilled.match(listResult)) {
        const matched = (listResult.payload?.items || []).find(
          (chat) =>
            String(chat?.groupId?._id || chat?.groupId || "") === String(groupId),
        );
        if (matched) {
          dispatch(setCurrentChat(matched));
        }
      }
      return navigate("/chat", { state: { chatId } });
    }

    navigate("/home");
  };

  const isLoading = createStatus === "loading";

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
            />{" "}
            <p className="text-sm font-semibold tracking-wide text-[#2f5b2f]">
              New group Setup
            </p>
          </div>
          <div className="flex justify-end">
            <button type="submit" form="new-group-form" disabled={isLoading}>
              <Check size={20} className="text-[#4a7f4a]" />
            </button>
          </div>
        </div>

        <form id="new-group-form" className="grid gap-3" onSubmit={handleSubmit}>
          <div className="flex gap-7">
            <label
              htmlFor="groupMedia"
              className="group flex cursor-pointer items-center justify-between rounded-full border border-dashed border-[#4a7f4a]/45 bg-[#f6fbefff] px-4 py-3 transition w-27 hover:bg-[#eef7e6]"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-[#4a7f4a]">
                  group cover
                </p>
                <p className="mt-0.5 text-sm text-[rgba(23,3,3,0.8)]">
                  {fileName}
                </p>
              </div>
              <UploadIcon size={18} className="text-[#4a7f4a]" />
            </label>
            <input
              id="groupMedia"
              type="file"
              name="media"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              placeholder="group name"
              className="rounded-2xl h-10 mt-10 w-40 border border-[#6fa63a]/35 bg-white/85 px-3 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            />
          </div>
          <input
            type="text"
            name="userName"
            value={formValues.userName}
            onChange={handleChange}
            placeholder="group username"
            className="rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
          />
          <textarea
            name="description"
            value={formValues.description}
            onChange={handleChange}
            rows="3"
            placeholder="Describe what this group is about..."
            className="resize-none rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
          />

          {(formError || groupError) && (
            <p className="text-sm text-red-600">{formError || groupError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-[10px] bg-[#4a7f4a] px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {isLoading ? "Creating group..." : "Create group"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewGroupForm;
