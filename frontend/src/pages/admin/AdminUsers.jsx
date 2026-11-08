import { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/api";
import useAsync from "../../hooks/useAsync";
import PagePagination from "../../components/ui/PagePagination";
import Spinner from "../../components/ui/Spinner";
import ErrorMessage from "../../components/ui/ErrorMessage";

const ROLES = ["ROLE_USER", "ROLE_SELLER", "ROLE_ADMIN"];

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    async () => (await api.get(`/admin/users?pageNumber=${page - 1}&pageSize=20`)).data,
    [page],
  );

  const toggleRole = async (user, role) => {
    const roles = user.roles.includes(role) ? user.roles.filter((r) => r !== role) : [...user.roles, role];
    if (roles.length === 0) {
      toast.error("A user needs at least one role");
      return;
    }
    try {
      await api.put(`/admin/users/${user.id}/roles`, { roles });
      toast.success(`Roles updated for ${user.username}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    reload();
  };

  if (loading && !data) return <Spinner label="Loading users..." />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  return (
    <div>
      <h2 className="text-lg font-semibold">Users ({data.totalElements})</h2>
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Roles</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.content.map((user) => (
              <tr key={user.id}>
                <td className="p-3 font-medium">{user.username}</td>
                <td className="p-3 text-slate-600">{user.email}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-4">
                    {ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={user.roles.includes(role)}
                          onChange={() => toggleRole(user, role)}
                          aria-label={`${role.replace("ROLE_", "")} role for ${user.username}`}
                        />
                        {role.replace("ROLE_", "").toLowerCase()}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PagePagination page={page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}
