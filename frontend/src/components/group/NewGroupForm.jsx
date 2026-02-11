import { ArrowLeft, Check, UploadIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const NewGroupForm = () => {
  const [fileName, setFileName] = React.useState("No cover selected");
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/home");
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "No cover selected");
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
            />{" "}
            <p className="text-sm font-semibold tracking-wide text-[#2f5b2f]">
              New group Setup
            </p>
          </div>
          <div className="flex justify-end">
            <Check size={20} className="text-[#4a7f4a]" type="submit" />
          </div>
        </div>

        <form className="grid gap-3">
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
              placeholder="group name"
              className="rounded-2xl h-10 mt-10 w-40 border border-[#6fa63a]/35 bg-white/85 px-3 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            />
          </div>
          <textarea
            name="description"
            rows="3"
            placeholder="Describe what this group is about..."
            className="resize-none rounded-2xl border border-[#6fa63a]/35 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
          />
        </form>
      </div>
    </div>
  );
};

export default NewGroupForm;
