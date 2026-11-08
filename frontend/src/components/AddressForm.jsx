import { useState } from "react";
import api, { getErrorMessage } from "../api/api";
import FormField from "./ui/FormField";
import { hasErrors, validateAddress } from "../utils/validators";

const EMPTY = { street: "", buildingName: "", city: "", state: "", country: "", pincode: "" };

/** Create or edit an address. Calls onSaved(address) after the API accepts it. */
export default function AddressForm({ address, onSaved, onCancel }) {
  const [form, setForm] = useState(address ? { ...EMPTY, ...address } : EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const validation = validateAddress(form);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSaving(true);
    setServerError("");
    try {
      const payload = {
        street: form.street.trim(),
        buildingName: form.buildingName.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        pincode: form.pincode.trim(),
      };
      const { data } = address?.addressId
        ? await api.put(`/addresses/${address.addressId}`, payload)
        : await api.post("/addresses", payload);
      onSaved(data);
    } catch (error) {
      setServerError(getErrorMessage(error, "Could not save the address."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-label="Address form">
      {serverError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Street" name="street" value={form.street} onChange={handleChange} error={errors.street} autoComplete="address-line1" />
        <FormField label="Building / apartment" name="buildingName" value={form.buildingName} onChange={handleChange} error={errors.buildingName} autoComplete="address-line2" />
        <FormField label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} autoComplete="address-level2" />
        <FormField label="State" name="state" value={form.state} onChange={handleChange} error={errors.state} autoComplete="address-level1" />
        <FormField label="Country" name="country" value={form.country} onChange={handleChange} error={errors.country} autoComplete="country-name" />
        <FormField label="Pincode / ZIP" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} autoComplete="postal-code" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save address"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
