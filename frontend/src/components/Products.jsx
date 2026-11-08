import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Filter from "./Filter";
import ProductCard from "./ProductCard";
import PagePagination from "./ui/PagePagination";
import Spinner from "./ui/Spinner";
import ErrorMessage from "./ui/ErrorMessage";
import EmptyState from "./ui/EmptyState";
import useProductFilter from "./useProductFilter";
import { fetchProducts } from "../store/actions";

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoading, errorMessage } = useSelector((state) => state.errors);
  const { products, pagination } = useSelector((state) => state.products);

  useProductFilter();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const goToPage = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 1) next.delete("page");
    else next.set("page", String(value));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retry = () => dispatch(fetchProducts(searchParams.toString()));

  return (
    <div className="rounded-xl bg-amber-500 px-4 py-8 sm:px-8">
      <Filter />

      {isLoading ? (
        <Spinner label="Loading products..." />
      ) : errorMessage ? (
        <div className="mt-8">
          <ErrorMessage message={errorMessage} onRetry={retry} />
        </div>
      ) : !products || products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No products found"
            message="Try a different search or clear the filters."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-x-6 gap-y-6 pb-2 pt-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.productId} {...product} />
            ))}
          </div>
          <PagePagination page={page} totalPages={pagination?.totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  );
};

export default Products;
