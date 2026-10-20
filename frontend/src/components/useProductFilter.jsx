// use the filter value for getting data from the backend
import { useSearchParams } from "react-router-dom";
import {useEffect} from "react";
import { useDispatch } from "react-redux";
import { fetchProducts } from "../store/actions";

const useProductFilter = () =>{
    const [ searchParams ] = useSearchParams();
    const dispatch = useDispatch();

    useEffect(()=>{
        const params = new URLSearchParams();

        const currentPage = searchParams.get("page") ? Number(searchParams.get("page")):1;
        const sortOrder = searchParams.get("sortOrder");
        const categoryParams = searchParams.get("category") || null;
        const keyword = searchParams.get("keyword") || null;
        params.set("sortBy","price");
        params.set("sortOrder",sortOrder);
        params.set("pageNumber",currentPage-1);
        if(categoryParams) params.set("category",categoryParams);
        if(keyword) params.set("keyword",keyword);
        const queryString = params.toString();
        console.log("queryString",queryString);

        dispatch(fetchProducts(queryString));
    },[dispatch,searchParams]);

};
export default useProductFilter;