import Link from 'next/link';

export default function AuthForm() {
  return (
    <>
  <Link href="/login" className="w-full">
  <button className="mt-5 w-full px-6 py-2 rounded-full font-medium transition bg-[#60BC9B] hover:bg-[var(--color-primary-hover)] text-white border border-gray-300 hover:border-transparent flex items-center justify-center gap-2">
    <img
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt="Google logo"
      className="w-6 h-6 p-1 bg-white rounded-full"
    />
    Continue With Google
  </button>
  </Link>
  <Link href="/login" className="w-full">
      <button className="mt-5 w-full px-6 py-2 rounded-full font-medium transition bg-white hover:bg-[var(--color-primary-hover)] text-black hover:text-white border border-gray-300 hover:border-transparent">
        Sign In With Email
      </button>
  </Link>
      <p className="mt-5 text-center small text-grey">
        By clicking Continue to join or sign in, you agree to RioPlex Business Exchange&apos;s <Link href="/terms" className="hover:underline">Terms of Service</Link>, <Link href="/privacy" className="hover:underline">Privacy Policy</Link>, and <Link href="/cookies" className="hover:underline">Cookie Policy</Link>.
      </p>
      <p className="mt-5 text-center">New to RPBX? <Link href="/pricing" className="green-link">Join Now</Link></p>
    </>
  );
}
