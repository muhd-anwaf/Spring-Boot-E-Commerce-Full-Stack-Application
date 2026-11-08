import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import FormField from "../components/ui/FormField";
import { register, selectIsAuthenticated } from "../store/slices/authSlice";
import { fetchCart } from "../store/slices/cartSlice";
import { hasErrors, validateRegister } from "../utils/validators";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector((state) => state.auth.loading);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  if (isAuthenticated && !loading) return <Navigate to="/" replace />;

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateRegister(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setServerError("");
    try {
      await dispatch(register(form)).unwrap();
      dispatch(fetchCart());
      toast.success("Account created. Welcome!");
      navigate("/", { replace: true });
    } catch (message) {
      setServerError(typeof message === "string" ? message : "Could not create your account.");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Already registered? <Link to="/login" state={location.state} className="font-medium underline">Sign in</Link>
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm">
        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}
        <FormField label="Username" name="username" autoComplete="username" value={form.username} onChange={handleChange} error={errors.username} />
        <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
