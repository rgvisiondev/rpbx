import Image from "next/image";
import ContactForm from "../ContactForm";

type Expert = {
  image: string;
  name: string;
  description: string;
  title: string;
  email: string;
  contactHeadline: string;
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
        </div>
      </div>
      <hr />
      <div className="mt-4">
        <p>{expert.description}</p>
      </div>
      <hr className="mb-6" />
      <h2 className="pb-5">Contact Form</h2>
      <div className="space-y-2">
        <h4 className="text-xl font-semibold">
          {expert.contactHeadline}
        </h4>
        <p className=" text-muted-foreground">
         Connect with {expert.name}, {expert.title}
        </p>
      </div>
      <ContactForm to={expert.email} name={expert.name} subject={`New RPBX Advisor Inquiry - ${expert.name}`}/>
    </div>
  );
}
