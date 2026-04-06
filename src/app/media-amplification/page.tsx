import ContactForm from "../components/ContactForm";
import Link from "next/link";
import NavGate from "../components/NavGate";
import Button from "../components/Button";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Media Amplification | RioPlex Business Exchange",
    description: "Strategic storytelling and media exposure to elevate your business and attract investor interest."
};

const cards = [
    {
        title: "Starter Visibility",
        description: [
            {
                subtitle: "Editorial Feature:",
                point: "Professionally written business profile distributed across digital media channels."
            },
            {
                subtitle: "Social Amplification:",
                point: "Coordinated release across partner networks."
            }
        ],
        price: "$2,500",
    },
    {
        title: "Growth Authority",
        description: [
            {
                subtitle: "Editorial Feature:",
                point: "Professionally written business profile distributed across digital media channels."
            },
            {
                subtitle: "Social Amplification:",
                point: "Coordinated release across partner networks."
            },
            {
                subtitle: "Short-Form Video Story:",
                point: "60–120 second professionally produced video optimized for multi-platform distribution."
            }
        ],
        price: "$4,500",
    },
    {
        title: "Signature Market Leader",
        description: [
            {
                subtitle: "Everything in Growth:",
                point: "Editorial Feature + Video Story."
            },
            {
                subtitle: "Audio / Broadcast Interview:",
                point: "Featured interview segment with repurposed content for extended reach."
            },
            {
                subtitle: "Full Media Campaign:",
                point: "Maximum exposure across editorial, video, audio, and social channels."
            }
        ],
        price: "$7,500",
    }
];

export default async function MediaAmplification() {
    return (
        <div>
            <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen">
                <NavGate />

                <div className="mx-auto w-full lg:max-w-[1140px] py-10 px-4 lg:px-0">
                    <h1 className="text-3xl font-semibold text-center">
                        RPBX Featured Story & Media Amplification
                    </h1>

                    <p className="mt-2 mb-8 text-sm text-neutral-500 text-center">
                        Elevate your business through strategic storytelling and cross-platform media exposure.
                        This service transforms your story into earned media, brand authority, and deal-flow visibility
                        across editorial, video, social, and broadcast channels.
                    </p>

                    <div className="px-4 md:px-2 mx-auto flex flex-col md:flex-row gap-y-6 md:gap-y-0 md:gap-x-5 py-10">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                            >
                                <div>
                                    <h4 className="large">{card.title}</h4>

                                    <div className="my-6 flex flex-row md:flex-col lg:flex-row items-baseline gap-1">
                                        <h3 className="text-2xl font-bold">{card.price}</h3>
                                        <p>/ Investment</p>
                                    </div>

                                    {card.description.map((desc, descIndex) => (
                                        <div key={descIndex} className="mb-2">
                                            <p className="font-semibold">{desc.subtitle}</p>
                                            <p>{desc.point}</p>
                                            <hr className="my-2" />
                                        </div>
                                    ))}
                                </div>

                                <Link href="#contact">
                                    <Button className="w-full mt-2 cursor-pointer">
                                        Request Feature
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div
                className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center bg-fixed py-10 px-2"
                id="contact"
            >
                <div className="bg-white flex flex-col items-center w-full lg:w-[900px] rounded-2xl px-6 pt-6 mx-4 shadow-lg border-2 border-grey-500 transition-transform duration-300 hover:scale-101 hover:shadow-xl">
                    <h2>Request A Feature</h2>

                    <p className="text-center my-2">
                        Drive your business forward with a professionally managed media presence.
                        From editorial features to broadcast exposure, we position your story to reach
                        the audiences that matter most.
                    </p>

                    <ContactForm
                        to="info@rioplexbizx.com"
                        name="RPBX"
                        subject="RPBX Contact Form Submission - Marketing Inquiry"
                    />
                </div>
            </div>
        </div>
    );
}