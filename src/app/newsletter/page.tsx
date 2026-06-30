import Navbar from "../components/Navbar";
import { NewsletterPageForm } from "@/components/NewsletterPageForm";
import { isValuationFeatureEnabled } from "@/lib/valuation/valuationAvailability";

export default async function Newsletter(){

    return(
        <div className= "flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center">
            <div>
                <Navbar isValuationEnabled={isValuationFeatureEnabled()} />
            </div>
            <div className="mt-20 mb-20 mx-auto">
                <NewsletterPageForm />
            </div>
        </div>
    );

}