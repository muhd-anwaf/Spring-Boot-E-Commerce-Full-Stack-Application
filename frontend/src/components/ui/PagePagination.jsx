import { Pagination as MuiPagination } from "@mui/material";

/** page is 1-based. Renders nothing when there is only one page. */
export default function PagePagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="mt-6 flex justify-center">
      <MuiPagination
        page={page}
        count={totalPages}
        onChange={(_, value) => onChange(value)}
        shape="rounded"
        showFirstButton
        showLastButton
      />
    </div>
  );
}
