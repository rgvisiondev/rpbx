"use client"

import type React from "react"
import Image from "next/image"
import { forwardRef, useRef } from "react"

import { cn } from "@/lib/utils"
import { AnimatedBeam } from "../components/magicui/animated-beam"

const Circle = forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-16 items-center justify-center rounded-full border-2 bg-white p-2 shadow-md",
          className,
        )}
      >
        {children}
      </div>
    )
  },
)

Circle.displayName = "Circle"

export default function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-lg pb-10 px-5"
      ref={containerRef}
    >
      <div className="flex size-full max-h-[300px] max-w-lg flex-col items-stretch justify-between gap-16">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.user2 />
          </Circle>
          <Circle ref={div5Ref} className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.user4 />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref} className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.user1 />
          </Circle>
          <Circle ref={div4Ref} className="size-20 transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.rpbx />
          </Circle>
          <Circle ref={div6Ref} className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.user5 />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref} className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.user3 />
          </Circle>
          <Circle ref={div7Ref} className="transition-transform duration-300 hover:scale-105 hover:shadow-xl">
            <Icons.user6 />
          </Circle>
        </div>
      </div>

      <AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={div4Ref} curvature={-75} endYOffset={-10} />
      <AnimatedBeam containerRef={containerRef} fromRef={div2Ref} toRef={div4Ref} />
      <AnimatedBeam containerRef={containerRef} fromRef={div3Ref} toRef={div4Ref} curvature={75} endYOffset={10} />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam containerRef={containerRef} fromRef={div6Ref} toRef={div4Ref} reverse />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
      />
    </div>
  )
}

const Icons = {
  user1: () => (
    <Image
      src="/images/svg/building-solid-full.svg"
      alt="User Icon"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
  rpbx: () => (
    <Image
      src="/images/icons/Logo-Icon-Mint.png"
      alt="RPBX Logo"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
  user2: () => (
    <Image
      src="/images/svg/building-solid-full.svg"
      alt="User Icon"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
  user3: () => (
    <Image
      src="/images/svg/building-solid-full.svg"
      alt="User Icon"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
  user4: () => (
    <Image
      src="/images/svg/user-solid-full.svg"
      alt="User Icon"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
  user5: () => (
    <Image
      src="/images/svg/user-solid-full.svg"
      alt="User Icon"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
  user6: () => (
    <Image
      src="/images/svg/user-solid-full.svg"
      alt="User Icon"
      width={100}
      height={100}
      className="w-25 h-25 object-contain"
    />
  ),
}
