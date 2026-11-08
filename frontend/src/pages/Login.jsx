import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import FormField from "../components/ui/FormField";
import { login, selectIsAuthenticated } from "../store/slices/authSlice";
import { fetchCart } from "../store/slices/cartSlice";
import { hasErrors, validateLogin } from "../utils/validators";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector((state) => state.auth.loading);
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const from = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search ?? ""}`
    : "/";

  if (isAuthenticated && !loading) return <Navigate to={from} replace />;

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateLogin(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setServerError("");
    try {
      await dispatch(login({ username: form.username.trim(), password: form.password })).unwrap();
      dispatch(fetchCart());
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (message) {
      setServerError(typeof message === "string" ? message : "Could not sign in.");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">
        New here? <Link to="/register" state={location.state} className="font-medium underline">Create an account</Link>
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm">
        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}
        <FormField label="Username" name="username" autoComplete="username" value={form.username} onChange={handleChange} error={errors.username} />
        <FormField label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} error={errors.password} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
