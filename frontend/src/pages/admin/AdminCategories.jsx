import { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/api";
import useAsync from "../../hooks/useAsync";
import FormField from "../../components/ui/FormField";
import Modal from "../../components/ui/Modal";
import Spinner from "../../components/ui/Spinner";
import ErrorMessage from "../../components/ui/ErrorMessage";

function CategoryForm({ category, onSaved, onCancel }) {
  const [name, setName] = useState(category?.categoryName ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      setError("Category name must be 2 to 60 characters");
      return;
    }
    setSaving(true);
    try {
      if (category) await api.put(`/admin/categories/${category.categoryId}`, { categoryName: trimmed });
      else await api.post("/admin/categories", { categoryName: trimmed });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-label="Category form">
      <FormField label="Category name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} error={error} autoFocus />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminCategories() {
  const { data, loading, error, reload } = useAsync(
    async () => (await api.get("/public/categories?pageSize=100&sortBy=categoryName")).data.content,
    [],
  );
  const [editing, setEditing] = useState(null);

  const remove = async (category) => {
    if (!window.confirm(`Delete category "${category.categoryName}"?`)) return;
    try {
      await api.delete(`/admin/categories/${category.categoryId}`);
      toast.success("Category deleted");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading && !data) return <Spinner label="Loading categories..." />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories ({data.length})</h2>
        <button type="button" onClick={() => setEditing({})} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          + New category
        </button>
      </div>

      {data.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No categories yet. Create one before adding products.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
          {data.map((category) => (
            <li key={category.categoryId} className="flex items-center gap-4 p-3 text-sm">
              <span className="flex-1 font-medium">{category.categoryName}</span>
              <button type="button" onClick={() => setEditing(category)} className="font-medium underline">Rename</button>
              <button type="button" onClick={() => remove(category)} className="text-red-600 underline">Delete</button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.categoryId ? "Rename category" : "New category"}>
        {editing !== null && (
          <CategoryForm
            category={editing.categoryId ? editing : undefined}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              toast.success("Category saved");
              reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
