import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const handleOnLogin = (e) => {
    e.preventDefault();
    navigate("/home");
  };
  return (
    <div className="min-h-screen bg-[#eaf4e2] text-[rgba(23,3,3,0.87)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-6 shadow-[0_10px_30px_rgba(74,127,74,0.15)]">
        <div className="mb-5">
          <h1 className="text-[28px] font-bold mb-1">Welcome newbie</h1>
          <p className="text-sm text-[rgba(23,3,3,0.7)]">
            Let&apos;s get you create your account
          </p>
        </div>
        <form className="grid gap-4 rounded-xl bg-[#6fa63a]/10 p-4">
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="fname"
            >
              First Name
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="fname"
              placeholder="Abebe"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="lname"
            >
              Last Name
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="lname"
              placeholder="Kebede"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="username"
            >
              User Name
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="username"
              placeholder="abe21"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="phone"
            >
              Phone Number
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="phone"
              placeholder="0909090909"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="pass"
            >
              Password
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="password"
              id="pass"
            />
          </div>

          <button
            className="rounded-[10px] bg-[#4a7f4a] px-4 py-3 font-semibold text-white"
            type="submit"
            onClick={handleOnLogin}
          >
            Sign up
          </button>
          <p className="text-center mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-[#4a7f4a] font-semibold">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
