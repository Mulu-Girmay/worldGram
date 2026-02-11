import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  selectAuthError,
  selectLoginStatus,
} from "../Redux/userRedux/authSelector";
import { loginUser } from "../Redux/userRedux/authThunk";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loginStatus = useSelector(selectLoginStatus);
  const error = useSelector(selectAuthError);
  const [formValues, setFormValues] = React.useState({
    phoneNumber: "",
    password: "",
  });
  const [formError, setFormError] = React.useState("");
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };
  const handleOnLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!formValues.phoneNumber.trim())
      return setFormError("Phone number is required");
    if (!formValues.password.trim())
      return setFormError("Password is required");
    if (formValues.password.length < 6)
      return setFormError("Password must be at least 6 characters");
    const result = await dispatch(loginUser(formValues));
    if (loginUser.fulfilled.match(result)) {
      navigate("/home");
    }
  };
  const isLoading = loginStatus === "loading";

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
          onSubmit={handleOnLogin}
        >
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
              name="phoneNumber"
              placeholder="0909090909"
              value={formValues.phoneNumber}
              onChange={handleChange}
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
            {isLoading ? "Logging in..." : "Log in"}
          </button>
          <p className="text-center mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#4a7f4a] font-semibold">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
