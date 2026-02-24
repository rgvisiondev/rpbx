"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import ContactForm from "../ContactForm";

type ExpertProps = {
  image: string;
  name: string;
  description: string;
  title: string;
  email: string;
  contactHeadline?: string;
  defaultSection?: "bio" | "contact";
};

export function Experts(props: ExpertProps) {
  const {
    image,
    name,
    description,
    title,
    email,
    contactHeadline,
    defaultSection = "bio",
  } = props;

  const [section, setSection] = useState<"bio" | "contact">(defaultSection);

  const headline = useMemo(() => {
    if (contactHeadline?.trim()) return contactHeadline;
    return "Contact this advisor";
  }, [contactHeadline]);

  return (
    <div className="space-y-3">
      <Image
        src={image}
        width={500}
        height={500}
        alt={name}
        className="rounded-xl w-full"
      />

      <div className="mt-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="pb-2">{name}</h2>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>

          {/* Keep this mail icon if you still want mailto inside the modal */}
          <a
            href={`mailto:${email}`}
            className="text-black hover:text-[#9ed3c3] transition-colors"
            aria-label={`Email ${name}`}
          >
            <Mail size={22} />
          </a>
        </div>

        {/* Section tabs */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSection("bio")}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium border transition
              ${
                section === "bio"
                  ? "bg-[#272727] text-white border-[#272727]"
                  : "bg-white text-[#272727] border-neutral-200 hover:bg-neutral-50"
              }`}
          >
            Bio
          </button>

          <button
            type="button"
            onClick={() => setSection("contact")}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium border transition
              ${
                section === "contact"
                  ? "bg-[#272727] text-white border-[#272727]"
                  : "bg-white text-[#272727] border-neutral-200 hover:bg-neutral-50"
              }`}
          >
            Contact
          </button>
        </div>
      </div>

      <hr />

      {section === "bio" ? (
        <div className="mt-2">
          <p>{description}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="space-y-1">
            <h4 className="extralarge font-semibold">{headline}</h4>
            <p className="text-sm text-muted-foreground pt-2 pb-2">
              Connect with {name}, {title}
            </p>
          </div>

          <ContactForm
            to={email}
            name={name}
            subject={`New RPBX Advisor Inquiry - ${name}`}
          />
        </div>
      )}
    </div>
  );
}
