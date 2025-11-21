'use client';

import { useState, ReactNode } from 'react';

type AccordionProps = {
  title: string;
  children: ReactNode;
};

export default function Accordion({ title, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl shadow-lg border-x-2 border-t-2 border-grey-500 transition-all duration-300 hover:translate-x-2 hover:shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left"
      >
        <span className="text-lg font-semibold">{title}</span>
        <span className=" text-xl">{isOpen ? '-' : '+'}</span>
      </button>

      <div
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    isOpen ? 'opacity-100 translate-y-0 border-t border-gray-300' : 'max-h-0 opacity-0 -translate-y-1'
  }`}
      >
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
