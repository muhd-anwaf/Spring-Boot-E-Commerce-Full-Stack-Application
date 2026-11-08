import { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/api";
import useAsync from "../../hooks/useAsync";
import FormField from "../../components/ui/FormField";
import Modal from "../../components/ui/Modal";
import PagePagination from "../../components/ui/PagePagination";
import Spinner from "../../components/ui/Spinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { formatPrice, onImageError } from "../../utils/format";
import { hasErrors, validateProduct } from "../../utils/validators";

const EMPTY = { productName: "", description: "", price: "", discount: "0", quantity: "0", categoryId: "" };

function ProductForm({ product, categories, onSaved, onCancel }) {
  const editing = Boolean(product);
  const [form, setForm] = useState(
    editing
      ? {
          productName: product.productName,
          description: product.description,
          price: String(product.price),
          discount: String(product.discount),
          quantity: String(product.quantity),
          categoryId: String(product.categoryId ?? ""),
        }
      : { ...EMPTY, categoryId: String(categories[0]?.categoryId ?? "") },
  );
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateProduct(form);
    if (!form.categoryId) validation.categoryId = "Choose a category";
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSaving(true);
    setServerError("");
    const payload = {
      productName: form.productName.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      discount: Number(form.discount),
      quantity: Number(form.quantity),
    };
    try {
      let saved;
      if (editing) {
        saved = (await api.put(`/admin/products/${product.productId}`, payload)).data;
        if (Number(form.categoryId) !== product.categoryId) {
          await api.patch(`/admin/products/${product.productId}/categories/${form.categoryId}`);
        }
      } else {
        saved = (await api.post(`/admin/categories/${form.categoryId}/product`, payload)).data;
      }
      if (image) {
        const data = new FormData();
        data.append("image", image);
        await api.put(`/admin/products/${saved.productId}/image`, data);
      }
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error, "Could not save the product."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-label="Product form">
      {serverError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
      <FormField label="Name" name="productName" value={form.productName} onChange={handleChange} error={errors.productName} />
      <FormField label="Description" name="description" as="textarea" rows={3} value={form.description} onChange={handleChange} error={errors.description} />
      <FormField label="Category" name="categoryId" as="select" value={form.categoryId} onChange={handleChange} error={errors.categoryId}>
        {categories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
        ))}
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} error={errors.price} />
        <FormField label="Discount %" name="discount" type="number" min="0" max="100" step="0.1" value={form.discount} onChange={handleChange} error={errors.discount} />
        <FormField label="Stock" name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} error={errors.quantity} />
      </div>
      <div>
        <label htmlFor="product-image" className="mb-1 block text-sm font-medium text-slate-700">Image (JPEG, PNG, WebP or GIF, max 5 MB)</label>
        <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="block w-full text-sm" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {saving ? "Saving..." : editing ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null closed, {} new, product edit
  const products = useAsync(
    async () => (await api.get(`/public/products?pageNumber=${page - 1}&pageSize=10&sortBy=productId&sortOrder=desc`)).data,
    [page],
  );
  const categories = useAsync(async () => (await api.get("/public/categories?pageSize=100&sortBy=categoryName")).data.content, []);

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.productName}"?`)) return;
    try {
      await api.delete(`/admin/products/${product.productId}`);
      toast.success("Product deleted");
      products.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (products.loading && !products.data) return <Spinner label="Loading products..." />;
  if (products.error) return <ErrorMessage message={products.error} onRetry={products.reload} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products ({products.data.totalElements})</h2>
        <button
          type="button"
          disabled={!categories.data || categories.data.length === 0}
          title={categories.data?.length === 0 ? "Create a category first" : undefined}
          onClick={() => setEditing({})}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          + New product
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th>
              <th className="p-3">Stock</th><th className="p-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.data.content.map((product) => (
              <tr key={product.productId}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt="" onError={onImageError} className="h-10 w-10 rounded bg-slate-50 object-contain" />
                    <span className="font-medium">{product.productName}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600">{product.categoryName}</td>
                <td className="p-3">
                  {formatPrice(product.specialPrice)}
                  {product.discount > 0 && <span className="ml-1 text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>}
                </td>
                <td className={`p-3 ${product.quantity === 0 ? "font-semibold text-red-600" : ""}`}>{product.quantity}</td>
                <td className="space-x-3 p-3 text-right">
                  <button type="button" onClick={() => setEditing(product)} className="font-medium underline">Edit</button>
                  <button type="button" onClick={() => remove(product)} className="text-red-600 underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PagePagination page={page} totalPages={products.data.totalPages} onChange={setPage} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.productId ? "Edit product" : "New product"} wide>
        {editing !== null && categories.data && (
          <ProductForm
            product={editing.productId ? editing : undefined}
            categories={categories.data}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              toast.success("Product saved");
              products.reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
