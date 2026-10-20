import { useState } from "react";
import ProductViewModal from "./ProductViewModal";

const ProductCard = ({
    productId,
    productName,
    image,
    description,
    quantity,
    price,
    discount,
    specialPrice,
}) => {

    const [openProductViewModal , setOpenProductViewModal] = useState(false);
    const btnLoader = false;
    const [selectedViewProduct,setSelectedViewProduct] = useState("");
    const isAvailable = quantity && Number(quantity) > 0;
    const handleProductView = (product)=>{
        setSelectedViewProduct(product);
        setOpenProductViewModal(true);
    };
    return (
    <div className = "overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors duration-200 hover:border-slate-300">
        <div
            
            onClick={()=>{
            handleProductView(
                {
                   id: productId,
                    productName,
                    image,
                    description,
                    quantity,
                    price,
                    discount,
                    specialPrice,
                }
            )
        }} className="cursor-pointer overflow-hidden bg-slate-50 aspect-square">
         <img className="h-full w-full object-contain  transition-transform duration-300 hover:scale-[1.02]" src={image} alt={productName}></img>
        </div>



        <div className="px-4 pt-4">

            <h2 onClick={()=>{}} className="truncate text-base font-medium text-slate-900">{productName}</h2>

            <div className="mt-1.5 text-sm leading-5 text-slate-500">
                <p className="line-clamp-2">{description}</p>
            </div>

        </div>

        <div className="mt-4 flex items-center gap-3 px-4 pb-4">

            {specialPrice
             ? (
                <div className="flex items-baseline gap-2">
                    <div>
                        <span className="text-xs text-slate-400 line-through">
                            ${Number(price).toFixed(2)}
                        </span>

                    </div>

                    <div>
                        <span className="text-base font-semibold text-slate-900">
                        ${Number(specialPrice).toFixed(2)}
                        </span>
                    </div>

                </div>
             )
             :(
                <div>
                    <div>
                        <span className="text-base font-semibold text-slate-900">
                        ${Number(price).toFixed(2)}
                        </span>
                    </div>
                </div>)
            }

             <button 
             disabled = {!isAvailable || btnLoader}
             onClick={()=>{}}
             className={`ml-auto rounded-md border px-3 py-2 text-sm font-medium transition-colors ${isAvailable ? "border-slate-900 bg-slate-900 text-white hover:bg-white hover:text-slate-900":"cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`}>
                {isAvailable ? "Add to Cart" : "Stock Out" }
             </button>

        </div>

        <ProductViewModal 
        open={openProductViewModal}
        setOpen={setOpenProductViewModal}
        product={selectedViewProduct}
        isAvailable={isAvailable} />

           

    </div>
  
    )
}

export default ProductCard;
