"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function Carousel() {
  const slides = [
    {
      number: "2.3M",
      title: "Businesses at stake",
      text: "In the United States, baby boomers own about 40% of small businesses—roughly 2.3 million. As this generation nears retirement, many will be sold or closed, affecting millions of jobs and marking a major shift in business ownership over the next decade.",
    },
    {
      number: "40%",
      title: "Owned by baby boomers",
      text: "Nearly 40% of small businesses are currently owned by baby boomers. As they move toward retirement, the economy faces the challenge of transferring these businesses to new owners or risk losing them entirely.",
    },
    {
      number: "10 Years",
      title: "Critical transition period",
      text: "The next decade will be a critical period for succession planning. Proper preparation can ensure business continuity, preserve jobs, and create opportunities for new entrepreneurs and investors.",
    },
  ];

  return (
    <Swiper
      modules={[ Pagination, Autoplay]}
      spaceBetween={25}
      slidesPerView={1}
      pagination={{ clickable: true, dynamicBullets: true, }}
      autoplay={{ delay: 5000 }}
      loop
      className="w-full h-[340px]"
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>
          <div className="flex flex-col items-center justify-center text-center px-6 h-full">
            <h3 className="giant">{slide.number}</h3>
            <h4 className="text-lg font-semibold">{slide.title}</h4>
            <p className="mt-3 w-full lg:w-[500px] pb-10">
              {slide.text}
            </p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
