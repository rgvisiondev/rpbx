// components/LogoLoader.tsx
import Image from "next/image";

export default function LogoLoader() {
  return (
    <div className="flex justify-center items-center flex-col space-y-4">
      <Image
        src="/images/icons/Logo-Icon-White.png"
        alt="Loading..."
        width={60}
        height={60}
        className="flex animate-[stepRotate_1s_steps(6)_infinite]"
      />
      <p className="flex text-white">Loading...</p>
    </div>
  );
}
