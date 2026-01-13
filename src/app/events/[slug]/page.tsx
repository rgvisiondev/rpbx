import { type SanityDocument } from "next-sanity";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { eventClient } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import NavGate from "@/app/components/NavGate";
import NewsletterSignup from "../../../components/ui/newsletter";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

const POST_QUERY = `*[
  _type == "event" && slug.current == $slug
][0]{
  _id,
  title,
  slug,
  hosts,
  location,
  information,
  date,
  image {
    asset->{
      _id,
      url
    },
    alt
  }
}`;

const { projectId, dataset } = eventClient.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await eventClient.fetch<SanityDocument>(
    POST_QUERY,
    { slug }
  );

  return {
    title: post.title,
    description:
      post?.body?.[0]?.children?.[0]?.text ||
      "Read this post.",
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await eventClient.fetch<SanityDocument>(
    POST_QUERY,
    { slug },
    options
  );

  if (!post) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link href="/events" className="green-link hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  const postImageUrl = post.image?.asset?.url
    ? urlFor(post.image)?.width(1200).url()
    : null;

  // Format date/time
  const eventDate = post.date ? new Date(post.date) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";
const formattedTime = eventDate
 ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) 
 : "";

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top ">
      <div><NavGate /></div>

      <div className="flex flex-col md:flex-row w-full lg:max-w-[1140px] mx-auto py-10 gap-5 px-5 lg:px-2 min-h-screen">

        {/* LEFT COLUMN */}
        <div className="flex flex-col w-full md:w-1/2 lg:w-2/5">
          <div className="relative md:sticky md:top-24">
            {postImageUrl && (
              <a
                href={postImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={postImageUrl}
                  alt={post.image?.alt || post.title}
                  className="w-full h-auto rounded-xl cursor-zoom-in"
                />
              </a>
            )}
            <p className="small text-grey text-center pt-2">Click to view flyer</p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col w-full md:w-1/2 lg:w-3/5">

          <h1 className="text-4xl font-bold">{post.title}</h1>

          <span className="flex flex-col lg:flex-row gap-3 flex-wrap items-left text-grey mt-3">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Image src="/images/icons/calendar.png" alt="Date" width={16} height={16} />
                <p>{formattedDate}</p>
              </span>
            )}

            {formattedTime && (
              <>
                <span className="hidden lg:block"><p>•</p></span>
                <span className="flex items-center gap-1">
                  <Image src="/images/icons/clock.png" alt="Time" width={16} height={16} />
                  <p>{formattedTime}</p>
                </span>
              </>
            )}

            {post.hosts && (
              <>
                <span className="hidden lg:block"><p>•</p></span>
                <span className="flex items-center gap-1">
                  <Image src="/images/icons/user.png" alt="Host" width={16} height={16} />
                  <p>{Array.isArray(post.hosts) ? post.hosts.join(", ") : post.hosts}</p>
                </span>
              </>
            )}

            {post.location && (
              <>
                <span className="hidden lg:block"><p>•</p></span>
                <span className="flex items-center gap-1">
                  <Image src="/images/icons/location.png" alt="Location" width={16} height={16} />
                  <p>{post.location}</p>
                </span>
              </>
            )}
          </span>

          <div className="border-t border-gray-400 my-5"></div>

          <div className="prose">
            {post.information && <PortableText value={post.information} />}
          </div>

          <Link href="/events" className="green-link hover:underline pt-5">
            ← Back to events
          </Link>
        </div>
      </div>


      {/* Newsletter */}
      <NewsletterSignup />
    </div>
  );
}
