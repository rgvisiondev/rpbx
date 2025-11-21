// app/dashboard/_components/Resources.tsx
import Link from "next/link";

export default function Resources({ userType }: { userType: "business" | "investor" | "admin" }) {
  return (
    <section className="mt-8 mb-12">
      <h2 className="text-xl font-semibold mb-3">Resources</h2>
      <div className="grid lg:grid-cols-3 gap-4">
        <Link href="/help" className="p-4 border rounded-xl hover:bg-neutral-50">Help Center</Link>
        <Link href="/blog" className="p-4 border rounded-xl hover:bg-neutral-50">Blog</Link>
        <Link href="/contact" className="p-4 border rounded-xl hover:bg-neutral-50">
          {userType === "business" ? "Talk to Success Team" : "Talk to Support"}
        </Link>
      </div>
    </section>
  );
}
