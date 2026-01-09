import Image from "next/image";
import { Mail } from "lucide-react";

type Expert = {
  image: string;
  name: string;
  description: string;
  title: string;
  email: string;
};

export function Experts(expert: Expert) {
  return (
    <div className="space-y-2">
      <Image
        src={expert.image}
        width={500}
        height={500}
        alt={expert.name}
        className="rounded-xl w-full"
      />
      <div className="mt-4">
        <h2>{expert.name}</h2>
        <div className="mt-2 flex justify-between">
          <div>
            <p>{expert.title}</p>
          </div>
          <div>
            <a
              href={`mailto:${expert.email}`}
              className="text-black hover:text-[#9ed3c3] transition-colors"
            >
              <Mail size={25} />
            </a>
          </div>
        </div>
      </div>
      <hr />
      <div className="mt-4">
        <p>{expert.description}</p>
      </div>
    </div>
  );
}
