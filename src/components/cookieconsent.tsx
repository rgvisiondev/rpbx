'use client';

import CookieConsent from "react-cookie-consent";

export default function CookieConsentWrapper() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="rpbx_cookie_consent"
      style={{ background: "#272727", borderTop: "1px solid #7c7c7cff", width: "100%", maxWidth: "100%",}}
      buttonStyle={{
        background: "#60BC9B",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
        padding: "8px 16px",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "#272727",
        color: "#7c7c7cff",
        fontSize: "14px",
        borderRadius: "8px",
        padding: "8px 16px",
        marginLeft: "10px",
        cursor: "pointer",
      }}
      expires={150}
    >
      We use cookies to improve your experience. By continuing, you agree to our{" "}
      <a href="/privacy" className="underline">Privacy Policy</a>.
    </CookieConsent>
  );
}
