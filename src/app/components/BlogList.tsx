"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { blogClient } from "@/sanity/client";
import type { SanityDocument } from "next-sanity";
import LogoLoaderDark from "../components/LogoLoaderDark"; // import your loader

export default function BlogList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize directly from URL instead of hardcoding defaults
  const initialCategory = searchParams.get("category") || "all";
  const initialSort = searchParams.get("sort") || "recent";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  const [posts, setPosts] = useState<SanityDocument[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true); // loading state

  const limit = 6;

  // Keep state in sync if query params change (e.g. back/forward nav)
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "all";
    const urlSort = searchParams.get("sort") || "recent";
    const urlPage = parseInt(searchParams.get("page") || "1", 10);

    if (urlCategory !== category) setCategory(urlCategory);
    if (urlSort !== sort) setSort(urlSort);
    if (urlPage !== page) setPage(urlPage);
  }, [searchParams]);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());

    router.replace(`/blog?${params.toString()}`);
  }, [category, sort, page, router]);

  // Fetch filtered posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true); // start loader

      const categoryFilter =
        category !== "all"
          ? `&& "${category}" in categories[]->slug.current`
          : "";
      const order = sort === "recent" ? "publishedAt desc" : "title asc";

      const start = (page - 1) * limit;
      const end = start + limit;

      const data = await blogClient.fetch(
        `*[_type == "post" && defined(slug.current) && defined(publishedAt) ${categoryFilter}] | order(${order})[${start}...${end}]{
          _id,
          title,
          slug,
          publishedAt,
          read,
          mainImage {
            asset->{url},
            alt
          }
        }`
      );
      setPosts(data);

      const totalCount = await blogClient.fetch(
        `count(*[_type == "post" && defined(slug.current) && defined(publishedAt) ${categoryFilter}])`
      );
      setTotalPages(Math.ceil(totalCount / limit));

      setLoading(false); // stop loader
    };

    fetchPosts();
  }, [category, sort, page]);

  return (
    <>
      {/* Filter + Sort dropdowns */}
      <div className="flex justify-end gap-4">
        <select
          className="w-52 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          disabled={loading} // disable while loading
        >
          <option value="all">All</option>
          <option value="entrepreneurship-and-growth-category">
            Entrepreneurship & Growth
          </option>
          <option value="local-market-insights-category">
            Local Market Insights
          </option>
          <option value="mergers-and-acquisitions-category">M&amp;A</option>
          <option value="exit-planning-category">Exit Planning</option>
          <option value="finance-and-valuation-category">
            Finance & Valuation
          </option>
          <option value="investor-relations-category">
            Investor Relations
          </option>
          <option value="business-selling-category">Selling</option>
          <option value="business-buying-category">Buying</option>
        </select>

        <select
          className="w-40 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          disabled={loading} // disable while loading
        >
          <option value="recent">Sort: Recent</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Blog grid or loader */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LogoLoaderDark />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-lg border transition-all duration-300 hover:scale-101 hover:shadow-xl">
              <img
                src={post.mainImage?.asset?.url}
                alt={post.mainImage?.alt || post.title}
                className="rounded-t-lg w-full h-[250px] object-cover"
              />
              <div className="p-5 gap-2 flex flex-col">
                <h4>{post.title}</h4>
                <span className="flex flex-row gap-3">
                  <p className="flex">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                  <p>•</p>
                  <p className="flex">{post.read} min read</p>
                </span>
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="green-link"
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        {page > 1 && (
          <button
            onClick={() => setPage(page - 1)}
            disabled={loading} // disable while loading 
            className="px-4 py-2 border rounded-xl bg-white shadow-lg hover:bg-[#60BC9B] hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
        )}

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            disabled={loading} // disable while loading
            className={`px-4 py-2 border rounded-xl shadow-lg disabled:opacity-50 ${
              page === i + 1
                ? "bg-[#60BC9B] text-white"
                : "hover:bg-[#60BC9B] hover:text-white bg-white"
            }`}
          >
            {i + 1}
          </button>
        ))}

        {page < totalPages && (
          <button
            onClick={() => setPage(page + 1)}
            disabled={loading} // disable while loading
            className="px-4 py-2 border rounded-xl bg-white shadow-lg hover:bg-[#60BC9B] hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </>
  );
}