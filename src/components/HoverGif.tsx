'use client'

import { useState } from 'react'
import Image from 'next/image'

type HoverGifProps = {
  staticSrc: string
  gifSrc: string
  alt: string
  width: number
  height: number
}

export default function HoverGif({
  staticSrc,
  gifSrc,
  alt,
  width,
  height,
}: HoverGifProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width, height }}
    >
      <Image
        src={isHovered ? gifSrc : staticSrc}
        alt={alt}
        width={width}
        height={height}
      />
    </div>
  )
}
