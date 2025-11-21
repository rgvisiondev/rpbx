'use client';

import { useState } from "react";
import Button from "./Button";

export default function Modal({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger (clickable element) */}
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Drawer */}
        <div
          className={`bg-white w-100 md:w-1/3 h-full shadow-lg relative transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Content (scrollable) */}
          <div className="p-6 h-full overflow-y-auto pb-16">
            {children}
          </div>

          {/* Close button at bottom right */}
          <div className="absolute bottom-0 w-full h-18 p-4 bg-white border-t">
            <div className="absolute bottom-4 right-4">
                <Button onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
