import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/api";
import useAsync from "../hooks/useAsync";
import AddressForm from "../components/AddressForm";
import FormField from "../components/ui/FormField";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import { userUpdated } from "../store/slices/authSlice";
import { hasErrors, validateProfile } from "../utils/validators";

function ProfileForm({ user }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: user.email ?? "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateProfile(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSaving(true);
    setServerError("");
    try {
      const payload = { email: form.email.trim() };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await api.put("/users/me", payload);
      dispatch(userUpdated(data));
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      toast.success("Profile updated");
    } catch (error) {
      setServerError(getErrorMessage(error, "Could not update your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl bg-white p-6 shadow-sm" aria-label="Profile form">
      <h2 className="text-lg font-semibold">Account details</h2>
      {serverError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
      <FormField label="Username" value={user.username} disabled readOnly className="opacity-70" />
      <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />

      <fieldset className="space-y-4 border-t border-slate-200 pt-4">
        <legend className="text-sm font-semibold text-slate-700">Change password (optional)</legend>
        <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={handleChange} error={errors.currentPassword} />
        <FormField label="New password" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={handleChange} error={errors.newPassword} />
        <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
      </fieldset>

      <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function AddressBook() {
  const { data: addresses, loading, error, reload } = useAsync(async () => (await api.get("/users/addresses")).data, []);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, address = edit

  const remove = async (address) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${address.addressId}`);
      toast.success("Address deleted");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm" aria-labelledby="addresses-heading">
      <div className="flex items-center justify-between">
        <h2 id="addresses-heading" className="text-lg font-semibold">Saved addresses</h2>
        <button type="button" onClick={() => setEditing({})} className="text-sm font-medium underline">+ Add address</button>
      </div>

      {loading ? (
        <Spinner label="Loading addresses..." className="py-6" />
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : addresses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">You have no saved addresses yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {addresses.map((address) => (
            <li key={address.addressId} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
              <p className="flex-1 text-slate-600">
                {address.buildingName}, {address.street}
                <br />
                {address.city}, {address.state} {address.pincode}, {address.country}
              </p>
              <button type="button" onClick={() => setEditing(address)} className="font-medium underline">Edit</button>
              <button type="button" onClick={() => remove(address)} className="text-red-600 underline">Delete</button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.addressId ? "Edit address" : "New address"} wide>
        {editing !== null && (
          <AddressForm
            address={editing.addressId ? editing : undefined}
            onSaved={() => {
              setEditing(null);
              toast.success("Address saved");
              reload();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </section>
  );
}

export default function Profile() {
  const user = useSelector((state) => state.auth.user);
  if (!user) return <Spinner label="Loading your profile..." />;

  return (
    <div>
      <h1 className="text-2xl font-semibold">My profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as <strong>{user.username}</strong>
        {user.roles?.includes("ROLE_ADMIN") && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Admin</span>}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProfileForm key={user.email} user={user} />
        <AddressBook />
      </div>
    </div>
  );
}
