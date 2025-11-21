"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <div>
    <div className="bg-[url('/images/backgrounds/footer-bg.png')] bg-cover bg-center flex justify-center py-10  px-4 lg:px-0">
      <div className="w-[1140px]">
        <p className="text-white">Follow us on:</p>
        <div className="flex justify-left gap-4 mt-2">
          <Link href="https://www.facebook.com/profile.php?id=61567482254380" target="_blank">
            <Image src="/images/icons/facebook.png" alt="Facebook" width={24} height={24} />
          </Link>
          <Link href="https://www.instagram.com/rioplexbe/" target="_blank">
            <Image src="/images/icons/instagram.png" alt="Instagram" width={24} height={24} />
          </Link>
          <Link href="https://www.linkedin.com/company/rioplex-business-exchange" target="_blank">
            <Image src="/images/icons/linkedin.png" alt="LinkedIn" width={24} height={24} />
          </Link>
        </div>

        <div className="mt-5 pt-4 flex flex-wrap gap-x-15 gap-y-2 lg:gap-y-0 text-white border-t-2 border-white">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/cookies">Cookie Policy</Link>
        <Link href="/languages">Languages</Link>
        <Link href="/support">Support</Link>
        <Link href="/faq">FAQ</Link>
        </div>


      <div className="mt-10 flex items-end justify-between">
        <div className="flex flex-col justify-end">
          <p className="text-white">(956) 322-5942</p>
          <p className="text-white">info@rioplexbizx.com</p>
        </div>

        <Image
          src="/images/logos/Rio-Plex-Logo-Main-White.png"
          alt="Footer Logo"
          width={150}
          height={50}
          className="object-contain"
        />
      </div>

      </div>
      </div>
      <div className="text-center bg-white py-2">
        <p className="black"><Link href="https://www.rgvisionmedia.com" target="_blank" className="hover:text-[#60BC9B]">RGVision Media</Link></p>
      </div>


    </div>
  );
}
