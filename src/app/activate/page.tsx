
import NavBarActivate from "../components/NavBarActivate";


// Utils
import { createClientRSC } from "@/../utils/supabase/server"
import { redirect } from "next/navigation"

import { ActivateForm } from "./activateform";
// Icons
import { BadgeCheck } from 'lucide-react';
import { Network } from 'lucide-react';
import { Map } from 'lucide-react';
import { Goal } from 'lucide-react';

export default async function Activate() {
    const supabase = await createClientRSC();

    // Use getSession instead of getUser for better performance
    const { data: { session }, error } = await supabase.auth.getSession();

    // Only log non-authentication errors
    if (error && error.message !== 'Auth session missing!' && error.status !== 400) {
        console.error('Unexpected auth error:', error);
    }

    // Redirect if user is authenticated
    if (session?.user) {
        return redirect("/dashboard");
    }

    const points = [
        {
            icon: <Network color="#60BC9B" size={32} />, title: "Direct Networking", description: "Bypass gatekeepers, we give you direct access to decision-makers in your industry."
        },
        {
            icon: <Map color="#60BC9B" size={32} />, title: "Local Advantage", description: "RPBX connects you with investors who understand the local market and support local growth."
        },
        {
            icon: <Goal color="#60BC9B" size={32} />, title: "Targeted Exposure", description: "Our platform focuses on investors who are actively looking for opportunities like yours."
        }
    ];


    return (
        <div className="bg-white text-slate-800 antialiased min-h-screen flex flex-col font-sans">

            {/* Custom Styles for this page only */}
            <style>{`
        :root {
            --color-primary: #60BC9B;
            --color-primary-dark: #4da685;
        }
        
        .hero-bg {
            background-image: linear-gradient(to bottom right, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.85)), url('/images/header/building2.png');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            
        }
      `}</style>

            {/* Navigation - Transparent on dark bg */}
            <nav>
                <NavBarActivate />
            </nav>

            {/* Hero Section with Form */}
            <header className="relative hero-bg pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
                <div className="max-w-[1140px] container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center pb-10">

                    {/* Hero Copy */}
                    <div className="w-full relative z-10">
                        <div className="hidden lg:inline-block px-3 py-1 mb-6 border border-[#60BC9B]/50 bg-[#60BC9B]/20 rounded-full text-[#60BC9B] text-sm font-bold tracking-wide uppercase shadow-sm">
                            START WITH 30 DAYS FOR FREE
                        </div>
                        <h1 className="activatepage text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
                            Connect With Investors Today!
                        </h1>
                        <div className="text-slate-300 text-lg font-medium pb-8">
                            Get a professional business valuation at 50% off when you join RPBX. Know exactly what your company is worth so you can sell, raise capital, or scale with confidence.
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-slate-300 text-lg lg:text-sm  font-medium">
                            <div className="flex items-center gap-2">
                                <BadgeCheck /> Verified Partners
                            </div>
                            <div className="flex items-center gap-2">
                                <BadgeCheck /> Instant Access
                            </div>
                            <div className="flex items-center gap-2">
                                <BadgeCheck /> Secure Transactions
                            </div>
                        </div>
                    </div>

                    {/* Conversion Form */}
                    <div className="relative z-10 w-full mx-auto lg:ml-auto">
                        {/* Glow effect behind form */}
                        <div className="absolute -inset-1 bg-[#60BC9B] rounded-2xl blur opacity-20"></div>

                        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden p-5 md:p-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Start Your Free Trial</h2>
                                <p className="text-slate-500 text-sm mt-2">30 days free access for Business Owners.</p>
                            </div>

                            <ActivateForm />

                        </div>
                    </div>
                </div>

                {/* Bottom Curve Divider using CSS Mask to ensure seamless background pattern */}
                <div
                    className="absolute bottom-0 w-full h-[60px] md:h-[120px] z-10 leading-[0]"
                    style={{
                        backgroundImage: "url('/images/backgrounds/white-bg.png')",
                        backgroundRepeat: "repeat",
                        backgroundPosition: "bottom",
                        maskImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z' fill='black'/%3E%3C/svg%3E\")",
                        WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z' fill='black'/%3E%3C/svg%3E\")",
                        maskSize: "100% 100%",
                        WebkitMaskSize: "100% 100%",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat"
                    }}
                ></div>
            </header>

            {/* Value Proposition */}
            <section className="pb-20 bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
                <div className="max-w-[1140px] container mx-auto px-6">
                    <div className="text-center mb-16 mx-auto">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4 mt-2 lg:mt-0">Your Gateway To Local Investors</h2>
                        <p className="text-slate-600">RPBX gives your business direct access, local credibility, and targeted exposure to investors who are ready to engage.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {
                            points.map((point, index) => (
                                <div key={index} className="bg-slate-50 p-8 rounded-2xl text-center shadow-lg border-2 border-grey-500 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                                    <div className="w-14 h-14 bg-[#60BC9B]/20 rounded-xl shadow-sm flex items-center justify-center text-white text-2xl mb-6 mx-auto ">
                                        {point.icon}
                                    </div>
                                    <h4 className="large mb-3">{point.title}</h4>
                                    <p className="text-slate-500 leading-relaxed">{point.description}</p>
                                </div>
                            ))
                        }

                    </div>
                </div>
            </section>

        </div>
    );
}