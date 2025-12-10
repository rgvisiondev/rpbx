export async function verifyTurnstileToken(token: string): Promise<boolean>{
    
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret){
        console.error("TURNSTILE_SECRET_KEY is not set");
        return false;
    }

    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);

    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData
        });

        const data = (await res.json()) as {
            success: boolean,
            "error-codes"?: string[];
        };

        if (!data.success){
            console.warn("Turnstile verification failed:", data["error-codes"]);
        }

        return data.success;
    } catch (err){
        console.error("Error verifying Turnstile token:", err);
        return false;
    }
}