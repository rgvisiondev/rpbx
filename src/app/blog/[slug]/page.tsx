import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { blogClient } from "@/sanity/client";
import Link from "next/link";
import NavGate from "@/app/components/NavGate";
import NewsletterSignup from "../../../components/ui/newsletter";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  publishedAt,
  body,
  read,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  }
}`;

const { projectId, dataset } = blogClient.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({ params }: PostPageProps) {

  const { slug } = await params;

  const post = await blogClient.fetch<SanityDocument>(
    POST_QUERY,
    { slug },
    options
  );

  const postImageUrl = post.mainImage
    ? urlFor(post.mainImage)?.width(1200).url()
    : null; 
  return (

      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
        <div>
            <NavGate />
        </div>


    
    <div className="flex flex-col w-full lg:w-[1140px] mx-auto py-10 gap-3 px-5 lg:px-0 min-h-screen">

      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>

      <span className="flex flex-row gap-3"><p className="flex">Published: {new Date(post.publishedAt).toLocaleDateString()}</p> <p>•</p> <p className="flex">{post.read} min read</p></span>
      <div className="border-t-1 border-gray-400 my-5"></div>

      {postImageUrl && (
        <img
          src={postImageUrl}
          alt={post.mainImage?.alt || post.title}
          className="w-full h-auto rounded-xl "
        />
      )}

      <div className="prose">
            {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>

      <Link href="/blog" className="green-link hover:underline">
        ← Back to posts
      </Link>

    </div>

      {/* Newsletter */}
      <NewsletterSignup />

     </div>
  );
}
