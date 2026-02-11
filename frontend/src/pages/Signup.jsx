import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  selectAuthError,
  selectRegisterStatus,
} from "../Redux/userRedux/authSelector";
import { registerUser } from "../Redux/userRedux/authThunk";

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const registerStatus = useSelector(selectRegisterStatus);
  const error = useSelector(selectAuthError);
  const initials = {
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    password: "",
  };
  const [formValues, setFormValues] = useState(initials);
  const [formError, setFormError] = useState("");
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!formValues.firstName.trim())
      return setFormError("First name is required");
    if (!formValues.lastName.trim())
      return setFormError("Last name is required");
    if (!formValues.username.trim())
      return setFormError("Username is required");
    if (!formValues.phoneNumber.trim())
      return setFormError("Phone number is required");
    if (!formValues.password.trim())
      return setFormError("Password is required");
    if (formValues.password.length < 6)
      return setFormError("Password must be at least 6 characters");

    const result = await dispatch(registerUser(formValues));
    if (registerUser.fulfilled.match(result)) {
      navigate("/home");
    }
  };
  const isLoading = registerStatus === "loading";

  return (
    <div className="min-h-screen bg-[#eaf4e2] text-[rgba(23,3,3,0.87)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-6 shadow-[0_10px_30px_rgba(74,127,74,0.15)]">
        <div className="mb-5">
          <h1 className="text-[28px] font-bold mb-1">Welcome newbie</h1>
          <p className="text-sm text-[rgba(23,3,3,0.7)]">
            Let&apos;s get you create your account
          </p>
        </div>
        <form
          className="grid gap-4 rounded-xl bg-[#6fa63a]/10 p-4"
          onSubmit={onSubmit}
        >
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="firstName"
            >
              First Name
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="firstName"
              name="firstName"
              placeholder="Abebe"
              value={formValues.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="lastName"
            >
              Last Name
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Kebede"
              value={formValues.lastName}
              onChange={handleChange}
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
              name="username"
              placeholder="abe21"
              value={formValues.username}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="phoneNumber"
            >
              Phone Number
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              placeholder="0909090909"
              value={formValues.phoneNumber}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-semibold text-[rgba(23,3,3,0.8)]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="rounded-[10px] border border-[#6fa63a]/35 bg-white px-3 py-2 outline-none"
              type="password"
              id="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
            />
          </div>
          {(formError || error) && (
            <p className="text-sm text-red-600">{formError || error}</p>
          )}

          <button
            className="rounded-[10px] bg-[#4a7f4a] px-4 py-3 font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </button>
          <p className="text-center mt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-[#4a7f4a] font-semibold">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
