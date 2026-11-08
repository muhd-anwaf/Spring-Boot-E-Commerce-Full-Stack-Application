import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

export default function Modal({ open, onClose, title, children, wide = false }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/50" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl bg-white p-6 shadow-xl`}>
            <DialogTitle as="h3" className="mb-4 text-lg font-semibold text-slate-900">
              {title}
            </DialogTitle>
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
