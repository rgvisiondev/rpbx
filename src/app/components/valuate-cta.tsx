import Link from "next/link";
import EvaluationCheckoutButton from "./EvaluationCheckoutButton";

export default function ValuateCta() {
return (
    <section className="max-w-[1140px] mx-auto px-3 lg:px-1 py-10">
        <div className="bg-[url('/images/backgrounds/footer-bg.png')] bg-fixed bg-center rounded-[40px] p-8 text-white grid lg:grid-cols-2 gap-2 lg:gap-12 items-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4da685]/20 rounded-full blur-3xl"></div>
            
            <div>
                <h2 className="text-white mb-6">Valuate Your Business Today</h2>
                <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-5 h-5 bg-[#60BC9B] rounded-full flex items-center justify-center text-slate-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                        Reduce Lowball Offers
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-5 h-5 bg-[#60BC9B] rounded-full flex items-center justify-center text-slate-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                        Negotiate With Confidence
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-5 h-5 bg-[#60BC9B] rounded-full flex items-center justify-center text-slate-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                        Know What Drives Your Value
                    </li>
                </ul>
            </div>

            <div className="space-y-4">
                <div className="p-5 bg-white/10 border border-white/10 rounded-3xl hover:bg-white/15 transition group">
                    <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                            <span className="text-xs font-bold text-[#60BC9B] uppercase tracking-widest">Recommended</span>
                            <h4 className="text-xl font-bold text-white">RPBX Membership</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold">50% Off</span>
                            <p className="text-[10px] text-white uppercase">Valuations</p>
                        </div>
                    </div>
                    <Link href="/subscribe/business_monthly?trial=30">
                    <button className="w-full py-4 bg-[#60BC9B] hover:bg-[#4da685] text-slate-900 text-white font-bold rounded-2xl hover:cursor-pointer transition ">
                        Start 30-Day Free Trial
                    </button>
                    </Link>
                </div>

                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition group text-center lg:text-left">
                    <div className="lg:flex-col items-center">
                        <h4 className="font-bold text-slate-300 text-white pb-2">One-time Valuation</h4>
                        <EvaluationCheckoutButton variant="text" />
                    </div>
                </div>
            </div>
        </div>
    </section>
);
}