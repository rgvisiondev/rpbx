// app/blog/page.tsx
import NavGate from "../components/NavGate";
import NewsletterSignup from "../../components/ui/newsletter";
import BlogList from "../components/BlogList";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Blog | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
};

export default async function Blogs() {

  return (
    <div>
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div><NavGate /></div>

        <div className="flex flex-col w-full lg:w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-0">
          <h1 className="text-center">Blog</h1>

          {/* filter/sort/fetch */}
          <Suspense fallback={<div>Loading blogs...</div>}>
            <BlogList />
          </Suspense>
        </div>
      </div>

      <NewsletterSignup />
    </div>
  );
}