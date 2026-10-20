
import { CgAirplane } from "react-icons/cg";
import ProductCard from "./ProductCard";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchProducts } from "../store/actions";
import Filter from "./Filter";
import useProductFilter from "./useProductFilter";

const Products = () =>{

  const { isLoading , errorMessage } = useSelector(
      (state) => state.errors);




    const {products} = useSelector(
      (state) => state.products
    )
    

    const dispatch = useDispatch(); 
    
    useProductFilter();

    

    // useEffect (()=>{
    //   dispatch(fetchProducts());
    // },[dispatch])


    
    

return (
  <div className="px-4 py-14 sm:px-8 lg:px-14 2xl:mx-auto 2xl:w-[90%] bg-amber-500">
    <Filter />
    
    {isLoading ? ( <p>It is loading...</p> )
                : errorMessage ? (
                                    <div className="  h-50 ">
                                      <CgAirplane className="text-8xl text-red-600 mb-4"/>
                                      <span className="text-1xl text-slate-500 mt-4">
                                        <strong className="text-black">404. </strong> That's an error.
                                      </span>
                                      <p className="mt-4">The Request has an error : <strong>{errorMessage}</strong></p>
                                    </div> 
                                  )
                              : (
      <div className="min-h-175  ">
        <div className="grid gap-x-6 gap-y-6 pb-6 pt-14 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {products?.map(({
            productId,
            productName,
            image,
            description,
            quantity,
            price,
            discount,
            specialPrice,
          }) => (
            <ProductCard
              key={productId}
              productId={productId}
              productName={productName}
              image={image}
              description={description}
              quantity={quantity}
              price={price}
              discount={discount}
              specialPrice={specialPrice}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);
}

export default Products;
