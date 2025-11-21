"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function CarouselInvestor() {
  const slides = [{link: "step1-RPBX", num: 1}, {link: "step2-investor", num: 2 }, {link: "step3-investor", num: 3 }];

  return (
    <Swiper
      modules={[Pagination, Autoplay]}
      spaceBetween={25}
      slidesPerView={1}
      pagination={{ clickable: true, dynamicBullets: true }}
      autoplay={{ delay: 5000 }}
      loop={false}
      className="w-full h-[250px] lg:h-[370px]"
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>
          <div
            style={{
              backgroundImage: `url(/images/about-sliders/${slide.link}.png)`,
            }}
            className="bg-cover bg-center rounded-lg h-full flex justify-end items-end p-3"
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
