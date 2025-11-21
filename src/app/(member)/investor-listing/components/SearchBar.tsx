"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {

    const searchParams = useSearchParams();
    const router = useRouter();

    //Initialize from URL
    const initialQ = searchParams.get("q") ?? "";
    const [value, setValue] = useState(initialQ);

    // Debouce input & update url
    useEffect(() =>{
        const id = setTimeout(() =>{
            const params = new URLSearchParams(Array.from(searchParams.entries()));
            
            if (value.trim()) {
                params.set("q", value.trim());
            } else {
                params.delete("q");
            }

            router.replace(`?${params.toString()}`, {scroll: false});
        }, 250) //250ms debounce

        return () => clearTimeout(id);
    }, [value]);

    return (
            <div className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search investors..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none bg-white"
            />
            <button className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-blue-600">
                {/* Magnifying Glass Icon (Heroicons or your own SVG) */}
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5"
                >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
            </button>
            </div>
    )


}