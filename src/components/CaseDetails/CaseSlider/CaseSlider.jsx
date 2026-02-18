"use client";
import React, { useState } from "react";

import "./CaseSlider.scss";
import useIsMobile from "@/lib/helpers/useIsMobile";

export default function CaseSlider({ data }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const isMobile = useIsMobile();

  const visibleSlides = isMobile ? 1 : 5; // Adjust the number of visible slides based on screen size

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? data.length - visibleSlides : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev === data.length - visibleSlides ? 0 : prev + 1));
  };

  return (
    <section className="case-slider container">
      <div className="case-slider-scroll">
        <div
          className="case-slider-list"
          style={{ transform: `translateX(-${activeSlide * 20.25}em)` }}
        >
          {data.map((image, index) => (
            <div key={index} className="case-slider-item">
              <img
                src={image?.imageUrl}
                alt={`case-slider-${index}`}
                className="case-slider-image"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="arrows">
        <button className="arrow arrow--prev" onClick={handlePrevSlide}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <foreignObject x="-54" y="-54" width="156" height="156">
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  backdropFilter: "blur(27px)",
                  clipPath: "url(#bgblur_0_40000235_2890_clip_path)",
                  height: "100%",
                  width: "100%",
                }}
              ></div>
            </foreignObject>
            <path
              data-figma-bg-blur-radius="54"
              d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z"
              fill="#555555"
              fill-opacity="0.5"
            />
            <path
              d="M30.0107 24.3536C30.0107 24.0774 29.7869 23.8536 29.5107 23.8536L18.5107 23.8536C18.2346 23.8536 18.0107 24.0774 18.0107 24.3536C18.0107 24.6297 18.2346 24.8536 18.5107 24.8536L29.5107 24.8536C29.7869 24.8536 30.0107 24.6297 30.0107 24.3536Z"
              fill="white"
            />
            <path
              d="M23.6572 18.9142C23.4619 18.719 23.1453 18.719 22.95 18.9142L18.0003 23.864C17.805 24.0592 17.805 24.3758 18.0003 24.5711C18.1956 24.7663 18.5121 24.7663 18.7074 24.5711L23.6572 19.6213C23.8524 19.4261 23.8524 19.1095 23.6572 18.9142Z"
              fill="white"
            />
            <path
              d="M23.6572 29.5208C23.8524 29.3256 23.8524 29.009 23.6572 28.8137L18.7074 23.864C18.5121 23.6687 18.1956 23.6687 18.0003 23.864C17.805 24.0592 17.805 24.3758 18.0003 24.5711L22.95 29.5208C23.1453 29.7161 23.4619 29.7161 23.6572 29.5208Z"
              fill="white"
            />
            <path
              d="M18.0003 24.5711C18.1956 24.7663 18.5121 24.7663 18.7074 24.5711L23.6572 19.6213C23.8524 19.4261 23.8524 19.1095 23.6572 18.9142C23.4619 18.719 23.1453 18.719 22.95 18.9142L18.0003 23.864M18.0003 24.5711C17.805 24.3758 17.805 24.0592 18.0003 23.864M18.0003 24.5711L22.95 29.5208C23.1453 29.7161 23.4619 29.7161 23.6572 29.5208C23.8524 29.3256 23.8524 29.009 23.6572 28.8137L18.7074 23.864C18.5121 23.6687 18.1956 23.6687 18.0003 23.864M29.5107 24.8536L18.5107 24.8536C18.2346 24.8536 18.0107 24.6297 18.0107 24.3536C18.0107 24.0774 18.2346 23.8536 18.5107 23.8536L29.5107 23.8536C29.7869 23.8536 30.0107 24.0774 30.0107 24.3536C30.0107 24.6297 29.7869 24.8536 29.5107 24.8536Z"
              stroke="white"
              stroke-width="0.5"
            />
            <defs>
              <clipPath
                id="bgblur_0_40000235_2890_clip_path"
                transform="translate(54 54)"
              >
                <path d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z" />
              </clipPath>
            </defs>
          </svg>
        </button>
        <button className="arrow arrow--next" onClick={handleNextSlide}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <foreignObject x="-54" y="-54" width="156" height="156">
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  backdropFilter: "blur(27px)",
                  clipPath: "url(#bgblur_0_40000235_2893_clip_path)",
                  height: "100%",
                  width: "100%",
                }}
              ></div>
            </foreignObject>
            <path
              data-figma-bg-blur-radius="54"
              d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z"
              fill="#555555"
              fill-opacity="0.5"
            />
            <path
              d="M17.8535 24.3536C17.8535 24.0774 18.0774 23.8536 18.3535 23.8536L29.3535 23.8536C29.6297 23.8536 29.8535 24.0774 29.8535 24.3536C29.8535 24.6297 29.6297 24.8536 29.3535 24.8536L18.3535 24.8536C18.0774 24.8536 17.8535 24.6297 17.8535 24.3536Z"
              fill="white"
            />
            <path
              d="M24.2071 18.9142C24.4024 18.719 24.719 18.719 24.9142 18.9142L29.864 23.864C30.0592 24.0592 30.0592 24.3758 29.864 24.5711C29.6687 24.7663 29.3521 24.7663 29.1569 24.5711L24.2071 19.6213C24.0118 19.4261 24.0118 19.1095 24.2071 18.9142Z"
              fill="white"
            />
            <path
              d="M24.2071 29.5208C24.0118 29.3256 24.0118 29.009 24.2071 28.8137L29.1569 23.864C29.3521 23.6687 29.6687 23.6687 29.864 23.864C30.0592 24.0592 30.0592 24.3758 29.864 24.5711L24.9142 29.5208C24.719 29.7161 24.4024 29.7161 24.2071 29.5208Z"
              fill="white"
            />
            <path
              d="M29.864 24.5711C29.6687 24.7663 29.3521 24.7663 29.1569 24.5711L24.2071 19.6213C24.0118 19.4261 24.0118 19.1095 24.2071 18.9142C24.4024 18.719 24.719 18.719 24.9142 18.9142L29.864 23.864M29.864 24.5711C30.0592 24.3758 30.0592 24.0592 29.864 23.864M29.864 24.5711L24.9142 29.5208C24.719 29.7161 24.4024 29.7161 24.2071 29.5208C24.0118 29.3256 24.0118 29.009 24.2071 28.8137L29.1569 23.864C29.3521 23.6687 29.6687 23.6687 29.864 23.864M18.3535 24.8536L29.3535 24.8536C29.6297 24.8536 29.8535 24.6297 29.8535 24.3536C29.8535 24.0774 29.6297 23.8536 29.3535 23.8536L18.3535 23.8536C18.0774 23.8536 17.8535 24.0774 17.8535 24.3536C17.8535 24.6297 18.0774 24.8536 18.3535 24.8536Z"
              stroke="white"
              stroke-width="0.5"
            />
            <defs>
              <clipPath
                id="bgblur_0_40000235_2893_clip_path"
                transform="translate(54 54)"
              >
                <path d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z" />
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>
    </section>
  );
}
