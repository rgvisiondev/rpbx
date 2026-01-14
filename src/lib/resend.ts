import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey){
        throw new Error("RESEND_API_KEY not set")
    }

    if (!_resend){
        _resend = new Resend(apiKey);
    }

    return _resend;
}

export function getEmailFrom(){
    return(
        process.env.EMAIL_FROM ?? "RioPlex <notifications@rioplexbizx.com>"
    );
}