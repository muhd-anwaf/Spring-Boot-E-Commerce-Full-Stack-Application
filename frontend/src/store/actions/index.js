import api, { getErrorMessage } from "../../api/api";

export const fetchProducts = (queryString) => async (dispatch) => {
    try {
        dispatch({ type: "IS_FETCHING" });
        const { data } = await api.get(`/public/products?${queryString}`);
        dispatch({
            type: "FETCH_PRODUCTS",
            payload: data.content,
            pageNumber: data.pageNumber,
            pageSize: data.pageSize,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            lastPage: data.lastPage,
        });
        dispatch({ type: "IS_SUCCESS" });
    } catch (error) {
        dispatch({
            type: "IS_ERROR",
            payload: getErrorMessage(error, "Failed to fetch products"),
        });
    }
};

export const fetchCategories = () => async (dispatch) => {
    try {
        const { data } = await api.get("/public/categories?pageSize=100&sortBy=categoryName");
        dispatch({ type: "FETCH_CATEGORIES", payload: data.content });
    } catch {
        // The filter still works without the list; products keep loading.
        dispatch({ type: "FETCH_CATEGORIES", payload: [] });
    }
};
