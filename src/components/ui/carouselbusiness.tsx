"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

type Slide = {
  link: string;
  num: number;
};

type CarouselBusinessProps = {
  variant?: "default" | "landing";
};

export default function CarouselBusiness({
  variant = "default",
}: CarouselBusinessProps) {
  const slides: Slide[] = [
    { link: "step1-RPBX", num: 1 },
    { link: "step2-business", num: 2 },
    { link: "step3-business", num: 3 },
  ];

  const landingSlides: Slide[] = [
    { link: "step1-business-landing", num: 1 },
    { link: "step2-business", num: 2 },
    { link: "step3-business-landing", num: 3 },
  ];

  const activeSlides = variant === "landing" ? landingSlides : slides;

  const minHeightClass =
    variant === "landing" ? "min-h-[250px] md:min-h-[500px] lg:min-h-[325px]" : "min-h-[250px] md:min-h-[500px] lg:min-h-[400px]";

  return (
    <Swiper
      modules={[Pagination, Autoplay]}
      spaceBetween={25}
      slidesPerView={1}
      pagination={{ clickable: true, dynamicBullets: true }}
      autoplay={{ delay: 5000 }}
      loop={false}
      className={`w-full ${minHeightClass}`}
    >
      {activeSlides.map((slide, i) => (
        <SwiperSlide key={i}>
          <div
            style={{
              backgroundImage: `url(/images/about-sliders/${slide.link}.png)`,
            }}
            className={`bg-cover bg-center rounded-lg ${minHeightClass} flex justify-end items-end p-3`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-[#61BD9C] rounded-full">
              <h4 className="text-white">{slide.num}</h4>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
