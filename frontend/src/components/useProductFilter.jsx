import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../store/actions";

export const PAGE_SIZE = 12;

// Reads the filter values from the URL query string and loads the matching products.
const useProductFilter = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();

    useEffect(() => {
        const params = new URLSearchParams();

        const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
        const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
        const category = searchParams.get("category");
        const keyword = searchParams.get("keyword");

        params.set("sortBy", "specialPrice");
        params.set("sortOrder", sortOrder);
        params.set("pageNumber", currentPage - 1);
        params.set("pageSize", PAGE_SIZE);
        if (category) params.set("category", category);
        if (keyword) params.set("keyword", keyword);

        dispatch(fetchProducts(params.toString()));
    }, [dispatch, searchParams]);
};

export default useProductFilter;
