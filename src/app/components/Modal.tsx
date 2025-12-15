'use client';

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export default function Modal({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex justify-end bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* Drawer */}
        <div
          className={`bg-white w-[95%] md:w-1/2 lg:w-1/3 h-full shadow-2xl relative transform transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          {/* Scrollable content */}
          <div className="p-6 h-full overflow-y-auto pb-20">
            {children}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 w-full p-4 bg-white border-t">
            <div className="flex justify-end">
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Portal */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
