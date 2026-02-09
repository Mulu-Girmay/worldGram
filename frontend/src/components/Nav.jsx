import React from "react";
import { Menu, Search } from "lucide-react";
import { LayoutGrid, FolderLock, FolderKey, FolderOpen } from "lucide-react";

const Nav = () => {
  return (
    <div>
      <nav className="flex items-center gap-4 rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-4 py-3 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <Menu
          size={16}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6fa63a]/10 text-[#4a7f4a]"
          aria-label="Open menu"
        />

        <h3 className="text-lg font-semibold">WorldGram</h3>
        <div className="relative ml-auto w-full max-w-[320px]">
          <Search
            size={18}
            color="#666"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-xl border border-[#6fa63a]/35 bg-white py-2 pl-10 pr-3 text-sm outline-none"
          />
        </div>
      </nav>
      <nav className="flex items-center gap-4 rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-4 py-3 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <div className="flex flex-row gap-8">
          <div className="flex items-center gap-2">
            <LayoutGrid size={20} />
          </div>
          <div className="flex items-center gap-2">
            <FolderLock size={20} color="#0e0d0d" />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Nav;
