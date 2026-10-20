import {
  Button,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

function ProductViewModal({ open, setOpen, product, isAvailable }) {
  const {
    id,
    productName,
    image,
    description,
    quantity,
    price,
    discount,
    specialPrice,
  } = product || {};

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
    

      <Dialog
        open={open}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={handleClose}
        >
        <DialogBackdrop className="fixed inset-0 bg-gray-500/40"/>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-gray-800 p-6 duration-300 ease-out data-closed:scale-95 data-closed:opacity-0"
              > 

              {image && (
                <div>
                <img className="rounded-sm py-2" src={image} alt={productName}></img>
                </div>
              )}


              <div>
                <DialogTitle
                  as="h3"
                  className="text-base font-medium text-white"
                >
                  {productName}
                </DialogTitle>
              </div>


              <div>
                <p className="mt-2 text-sm text-white/50">
                  {description}
                </p>
              </div>

              <div>
                <div className="flex">
                  {specialPrice
                  ? (
                      <div>
                          <div>
                              <span className="line-through text-xs px-1 py-1 text-white">
                                  ${Number(price).toFixed(2)}
                              </span>

                          </div>

                          <div>
                              <span className="font-bold px-1 py-1 text-white ">
                              ${Number(specialPrice).toFixed(2)}
                              </span>
                          </div>

                      </div>
                  )
                  :(
                      <div>
                          <div>
                              <span>
                              ${Number(price).toFixed(2)}
                              </span>
                          </div>
                      </div>)
                  }


                  
                </div>
              </div>

              <div className="mt-4 flex">
                <Button
                  className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-600"
                  onClick={handleClose}
                >
                  Got it
                </Button>

                
                <button 
                  disabled = {!isAvailable}
                  onClick={()=>{}}
                  className={`bg-blue-600 ml-auto ${isAvailable ? "hover:bg-blue-800":"bg-slate-600 opacity-45"} 
                  text-white   px-3 rounded font-bold text-sm`}>
                    {isAvailable ? "Add to Cart" : "Stock Out" }
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default ProductViewModal;