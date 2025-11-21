"use client";
import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function CardCarousel() {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const images = [
    "/images/biz/1.png",
    "/images/biz/2.png",
    "/images/biz/3.png",
    "/images/biz/4.png",
    "/images/biz/5.png",
    "/images/biz/6.png",
    "/images/biz/7.png",
    "/images/biz/8.png",
  ];

  return (
    <>
      {/* Main Swiper */}
      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards]}
        className="w-full max-w-[280px] h-[380px] lg:max-w-[270px] lg:h-[350px] mt-5 lg:mt-0"
      >
        {images.map((src, index) => (
          <SwiperSlide
            key={index}
            className="bg-white rounded-3xl shadow-md relative cursor-pointer"
            onClick={() => setModalIndex(index)}
          >
            <Image
              src={src}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover rounded-3xl"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Modal with swipe, navigation, and pagination */}
      {modalIndex !== null && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setModalIndex(null)}
        >
          <div
            className="relative w-[90%] max-w-3xl h-[80%]"
            onClick={(e) => e.stopPropagation()}
          >
            <Swiper
              initialSlide={modalIndex}
              spaceBetween={10}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true, dynamicBullets: true, }}
              modules={[Navigation, Pagination]}
              className="h-full"
            >
              {images.map((src, index) => (
                <SwiperSlide key={index} className="relative h-full">
                  <Image
                    src={src}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-contain"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </>
  );
}
