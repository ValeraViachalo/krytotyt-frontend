"use client";
import React, { useEffect, useRef, useState } from "react";

import "./Header.scss";
import Link from "next/link";
import clsx from "clsx";
import useIsMobile from "@/lib/helpers/useIsMobile";
import { AnimatePresence, motion } from "framer-motion";
import { anim, logoAnim, MenuAnim } from "@/lib/helpers/anim";
import { usePathname } from "next/navigation";
import SoundcloudPlayer from "../SoundcloudPlayer/SoundcloudPlayer";
import { useAudio } from "@/lib/providers/AudioContext/AudioContext";
import { useFormPopUp } from "../FormPopUp/context";
import Image from "next/image";

const staticData = {
  nav: [
    {
      title: "про нас",
      href: "/about",
    },
    {
      title: "кейси",
      href: "/cases",
    },
    {
      title: "сервіси",
      href: "/services",
    },
  ],
  contactButton: "замовити проєкт",
  radioTitle: "радіо",
};

const presence = (isActiveItem) => ({
  variants: logoAnim,
  initial: "initial",
  animate: isActiveItem ? "animate" : "exit",
});

export default function Header({ locale, headerData }) {
  const socials = headerData?.socials ?? [];
  const [activeLogo, setActiveLogo] = useState(1);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const { isMuted, setIsMuted, isPlayerReady, next, prev } = useAudio();
  const { openForm } = useFormPopUp();
  const pathname = usePathname();

  const isMobile = useIsMobile();

  const isFirstRender = useRef(true);
  const headerRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (!isMenuActive) return;

    const handleClickOutside = (e) => {
      const inHeader = headerRef.current?.contains(e.target);
      const inMobileMenu = mobileMenuRef.current?.contains(e.target);
      if (!inHeader && !inMobileMenu) {
        setIsMenuActive(false);
      }
    };

    const handleScroll = () => {
      setIsMenuActive(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuActive]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setActiveLogo(activeLogo !== 3 ? activeLogo + 1 : 1);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className={clsx("header", {
          "header--active": isMenuActive,
        })}
      >
        <div className="header-content">
          <div className="left">
            <Link
              href="/"
              className={clsx("logo-wrapper", {
                "logo-wrapper--active": isMenuActive,
              })}
              onClick={() => setIsMenuActive(false)}
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.img
                  key="logo-1"
                  {...presence(activeLogo === 1)}
                  src={`/assets/logo-1.svg`}
                  alt=""
                  className="logo"
                />
                <motion.img
                  key="logo-2"
                  {...presence(activeLogo === 2)}
                  src={`/assets/logo-2.svg`}
                  alt=""
                  className="logo"
                />
                <motion.img
                  key="logo-3"
                  {...presence(activeLogo === 3)}
                  src={`/assets/logo-3.svg`}
                  alt=""
                  className="logo"
                />
              </AnimatePresence>
            </Link>

            <div className="nav">
              {staticData.nav.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={clsx("nav-item", {
                    "nav-item--active": pathname.includes(item.href),
                  })}
                >
                  {item.title}
                </Link>
              ))}
            </div>

            <button
              className={clsx("header-menu-button", {
                "header-menu-button--active": isMenuActive,
              })}
              onClick={() => setIsMenuActive(!isMenuActive)}
            >
              <span className="line"></span>
              <span className="line"></span>
            </button>
          </div>
          {!isMobile && (
            <div className="right">
              <button
                className={clsx("header-button", {
                  "header-button--playing": !isMuted,
                })}
                onClick={() => setIsMuted(!isMuted)}
                disabled={!isPlayerReady}
              >
                {isMuted ? (
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 21 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="header-button__icon"
                  >
                    <path
                      d="M12.6 2.10005C12.6 1.9762 12.5672 1.85456 12.5048 1.74754C12.4425 1.64052 12.3529 1.55196 12.2451 1.4909C12.1374 1.42983 12.0154 1.39845 11.8915 1.39995C11.7677 1.40146 11.6464 1.43579 11.5402 1.49945L4.7068 5.59725H2.1C0.9394 5.59725 0 6.53525 0 7.69725V13.3C0 14.4607 0.938 15.4001 2.1 15.4001H4.7068L11.5388 19.5007C11.6451 19.5647 11.7664 19.5993 11.8905 19.601C12.0145 19.6027 12.1368 19.5713 12.2448 19.5102C12.3528 19.4491 12.4425 19.3604 12.505 19.2532C12.5674 19.146 12.6002 19.0241 12.6 18.9001V2.10005ZM18.4912 10.4944L20.468 12.474L19.4782 13.4638L17.5 11.4843L15.5204 13.4625L14.5306 12.4727L16.5102 10.4944L14.5306 8.51625L15.5204 7.52645L17.5 9.50465L19.481 7.52645L20.4694 8.51625L18.4912 10.4944Z"
                      fill="white"
                    />
                  </svg>
                ) : (
                  <svg
                    width="21"
                    height="21"
                    className="header-button__icon"
                    viewBox="0 0 21 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.2444 1.49098C12.3523 1.55194 12.442 1.64044 12.5045 1.74743C12.567 1.85443 12.5999 1.97609 12.6 2.09998V18.9C12.6 19.0238 12.5672 19.1455 12.5048 19.2525C12.4425 19.3595 12.3529 19.4481 12.2451 19.5091C12.1374 19.5702 12.0154 19.6016 11.8915 19.6001C11.7677 19.5986 11.6464 19.5642 11.5402 19.5006L4.7068 15.4H2.1C1.54305 15.4 1.0089 15.1787 0.615076 14.7849C0.221249 14.3911 0 13.8569 0 13.3L0 7.69578C0.000371141 7.13907 0.221784 6.60529 0.61557 6.21177C1.00936 5.81824 1.54329 5.59718 2.1 5.59718H4.7068L11.5388 1.49938C11.6451 1.43562 11.7665 1.40124 11.8905 1.39977C12.0144 1.39829 12.1366 1.42977 12.2444 1.49098ZM19.3956 5.80158L18.9 5.30738L17.9102 6.29718L18.4016 6.78998L18.4058 6.79278L18.4338 6.82358C18.4618 6.85532 18.5038 6.90758 18.5598 6.98038C18.6676 7.12458 18.8202 7.35138 18.9742 7.65938C19.2822 8.27398 19.6 9.21618 19.6 10.4944C19.6 11.7726 19.2808 12.7148 18.9742 13.3294C18.8575 13.5689 18.7183 13.7967 18.5584 14.0098C18.5098 14.074 18.4584 14.1362 18.4044 14.196L18.4016 14.2002L17.9102 14.6902L18.9 15.6814L19.3956 15.1872L19.397 15.1844L19.3998 15.1816L19.4068 15.1746L19.4264 15.155L19.4866 15.0878C19.537 15.0318 19.6009 14.9525 19.6784 14.8498C19.8324 14.6454 20.0298 14.3458 20.2258 13.9552C20.6178 13.1712 21 12.0148 21 10.4944C21 8.97398 20.6192 7.81898 20.2258 7.03358C20.0722 6.71897 19.8894 6.41946 19.6798 6.13898C19.6002 6.03379 19.5156 5.93241 19.4264 5.83518L19.4068 5.81418L19.3998 5.80718L19.397 5.80438C19.397 5.80298 19.3942 5.80158 18.9 6.29718L19.3956 5.80158Z"
                      fill="white"
                    />
                  </svg>
                )}
              </button>

              <button
                className="header-button"
                onClick={prev}
                disabled={!isPlayerReady}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="header-button__icon"
                >
                  <path
                    d="M22 4.99996V19C22 19.86 20.988 20.318 20.341 19.753L12.341 12.753C12.2336 12.6591 12.1475 12.5433 12.0885 12.4135C12.0295 12.2836 11.999 12.1426 11.999 12C11.999 11.8573 12.0295 11.7163 12.0885 11.5864C12.1475 11.4566 12.2336 11.3408 12.341 11.247L20.341 4.24696C20.988 3.68196 22 4.14096 22 4.99996ZM11 4.99996V19C11 19.86 9.988 20.318 9.341 19.753L1.341 12.753C1.23359 12.6591 1.1475 12.5433 1.08852 12.4135C1.02954 12.2836 0.99902 12.1426 0.99902 12C0.99902 11.8573 1.02954 11.7163 1.08852 11.5864C1.1475 11.4566 1.23359 11.3408 1.341 11.247L9.341 4.24696C9.988 3.68196 11 4.14096 11 4.99996Z"
                    fill="white"
                  />
                </svg>
              </button>

              <button
                className="header-button"
                onClick={next}
                disabled={!isPlayerReady}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="header-button__icon"
                >
                  <path
                    d="M2 4.99996V19C2 19.86 3.012 20.318 3.659 19.753L11.659 12.753C11.7664 12.6591 11.8525 12.5433 11.9115 12.4135C11.9705 12.2836 12.001 12.1426 12.001 12C12.001 11.8573 11.9705 11.7163 11.9115 11.5864C11.8525 11.4566 11.7664 11.3408 11.659 11.247L3.659 4.24696C3.012 3.68196 2 4.14096 2 4.99996ZM13 4.99996V19C13 19.86 14.012 20.318 14.659 19.753L22.659 12.753C22.7664 12.6591 22.8525 12.5433 22.9115 12.4135C22.9705 12.2836 23.001 12.1426 23.001 12C23.001 11.8573 22.9705 11.7163 22.9115 11.5864C22.8525 11.4566 22.7664 11.3408 22.659 11.247L14.659 4.24696C14.012 3.68196 13 4.14096 13 4.99996Z"
                    fill="white"
                  />
                </svg>
              </button>

              <button
                className="radio"
                onClick={() => setIsMenuActive(!isMenuActive)}
              >
                <span className="radio-indicator"></span>
                <span>{staticData.radioTitle}</span>
              </button>

              <button
                className="header-button"
                onClick={() => setIsMenuActive(!isMenuActive)}
              >
                {isMenuActive ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="header-button__icon"
                  >
                    <path
                      d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM14.2422 5.75781C14.0469 5.56259 13.7304 5.56259 13.5352 5.75781L9.99902 9.29297L6.46387 5.75781C6.26861 5.56259 5.95209 5.56259 5.75684 5.75781C5.56176 5.95308 5.56166 6.26964 5.75684 6.46484L9.29199 10L5.75684 13.5352C5.56164 13.7304 5.56176 14.0469 5.75684 14.2422C5.9521 14.4374 6.26861 14.4374 6.46387 14.2422L9.99902 10.7061L13.5352 14.2422C13.7304 14.4374 14.0469 14.4374 14.2422 14.2422C14.4371 14.0469 14.4373 13.7303 14.2422 13.5352L10.7061 10L14.2422 6.46484C14.4373 6.26969 14.4371 5.95309 14.2422 5.75781Z"
                      fill="white"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    className="header-button__icon"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM14.5 8.5C14.1022 8.5 13.7206 8.65804 13.4393 8.93934C13.158 9.22064 13 9.60218 13 10C13 10.3978 13.158 10.7794 13.4393 11.0607C13.7206 11.342 14.1022 11.5 14.5 11.5C14.8978 11.5 15.2794 11.342 15.5607 11.0607C15.842 10.7794 16 10.3978 16 10C16 9.60218 15.842 9.22064 15.5607 8.93934C15.2794 8.65804 14.8978 8.5 14.5 8.5ZM10 8.5C9.60218 8.5 9.22064 8.65804 8.93934 8.93934C8.65804 9.22064 8.5 9.60218 8.5 10C8.5 10.3978 8.65804 10.7794 8.93934 11.0607C9.22064 11.342 9.60218 11.5 10 11.5C10.3978 11.5 10.7794 11.342 11.0607 11.0607C11.342 10.7794 11.5 10.3978 11.5 10C11.5 9.60218 11.342 9.22064 11.0607 8.93934C10.7794 8.65804 10.3978 8.5 10 8.5ZM5.5 8.5C5.10218 8.5 4.72064 8.65804 4.43934 8.93934C4.15804 9.22064 4 9.60218 4 10C4 10.3978 4.15804 10.7794 4.43934 11.0607C4.72064 11.342 5.10218 11.5 5.5 11.5C5.89782 11.5 6.27936 11.342 6.56066 11.0607C6.84196 10.7794 7 10.3978 7 10C7 9.60218 6.84196 9.22064 6.56066 8.93934C6.27936 8.65804 5.89782 8.5 5.5 8.5Z"
                      fill="white"
                    />
                  </svg>
                )}
              </button>

              <div
                className={clsx("menu", {
                  "menu--active": isMenuActive,
                })}
              >
                <SoundcloudPlayer />
                <div className="center">
                  <button className="header-contact" onClick={openForm}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="header-contact__icon"
                    >
                      <g clipPath="url(#clip0_40000889_9656)">
                        <path
                          d="M0.914062 21.0812H10.0807V19.2479H11.9141V17.4146H10.0807V15.5812H8.2474V19.2479H4.58073V17.4146H2.7474V13.7479H6.41406V11.9146H4.58073V10.0812H2.7474V11.9146H0.914062V21.0812ZM6.41406 15.5812H8.2474V13.7479H6.41406V15.5812ZM11.9141 17.4146H13.7474V15.5812H11.9141V17.4146ZM4.58073 10.0812H6.41406V8.24788H4.58073V10.0812ZM10.0807 15.5812H11.9141V13.7479H10.0807V15.5812ZM6.41406 11.9146H8.2474V10.0812H6.41406V11.9146ZM13.7474 15.5812H15.5807V13.7479H13.7474V15.5812ZM6.41406 8.24788H8.2474V6.41455H6.41406V8.24788ZM11.9141 13.7479H13.7474V11.9146H11.9141V13.7479ZM8.2474 10.0812H10.0807V8.24788H8.2474V10.0812ZM15.5807 13.7479H17.4141V11.9146H15.5807V13.7479ZM8.2474 6.41455H10.0807V4.58122H8.2474V6.41455ZM13.7474 11.9146H15.5807V10.0812H13.7474V11.9146ZM10.0807 8.24788H11.9141V6.41455H10.0807V8.24788ZM17.4141 11.9146H19.2474V10.0812H17.4141V11.9146ZM10.0807 4.58122H11.9141V2.74788H10.0807V4.58122ZM15.5807 10.0812H17.4141V8.24788H15.5807V10.0812ZM11.9141 6.41455H13.7474V4.58122H11.9141V6.41455ZM19.2474 10.0812H21.0807V4.58122H19.2474V6.41455H17.4141V8.24788H19.2474V10.0812ZM13.7474 4.58122H15.5807V2.74788H17.4141V0.914551H11.9141V2.74788H13.7474V4.58122ZM17.4141 4.58122H19.2474V2.74788H17.4141V4.58122Z"
                          fill="black"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_40000889_9656">
                          <rect width="22" height="22" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span>{staticData.contactButton}</span>
                  </button>
                </div>
                <MenuBottom locale={locale} socials={socials} />
              </div>
            </div>
          )}
        </div>
      </header>
      <AnimatePresence mode="wait">
        {isMobile && isMenuActive && (
          <motion.div
            ref={mobileMenuRef}
            {...anim(MenuAnim)}
            className="mobile-menu"
          >
            <div className="mobile-menu-content">
              <div className="nav-wrapper">
                <div className="nav">
                  {staticData.nav.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsMenuActive(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div
                className={clsx("menu", {
                  "menu--active": isMenuActive,
                })}
              >
                <div className="top">
                  <div className="radio">
                    <span className="radio-indicator"></span>
                    <span>{staticData.radioTitle}</span>
                  </div>

                  <div className="player-controls">
                    <button
                      className="header-button"
                      onClick={() => setIsMuted(!isMuted)}
                      disabled={!isPlayerReady}
                    >
                      {isMuted ? (
                        <svg
                          width="21"
                          height="21"
                          viewBox="0 0 21 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="header-button__icon"
                        >
                          <path
                            d="M12.6 2.10005C12.6 1.9762 12.5672 1.85456 12.5048 1.74754C12.4425 1.64052 12.3529 1.55196 12.2451 1.4909C12.1374 1.42983 12.0154 1.39845 11.8915 1.39995C11.7677 1.40146 11.6464 1.43579 11.5402 1.49945L4.7068 5.59725H2.1C0.9394 5.59725 0 6.53525 0 7.69725V13.3C0 14.4607 0.938 15.4001 2.1 15.4001H4.7068L11.5388 19.5007C11.6451 19.5647 11.7664 19.5993 11.8905 19.601C12.0145 19.6027 12.1368 19.5713 12.2448 19.5102C12.3528 19.4491 12.4425 19.3604 12.505 19.2532C12.5674 19.146 12.6002 19.0241 12.6 18.9001V2.10005ZM18.4912 10.4944L20.468 12.474L19.4782 13.4638L17.5 11.4843L15.5204 13.4625L14.5306 12.4727L16.5102 10.4944L14.5306 8.51625L15.5204 7.52645L17.5 9.50465L19.481 7.52645L20.4694 8.51625L18.4912 10.4944Z"
                            fill="white"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="21"
                          height="21"
                          className="header-button__icon"
                          viewBox="0 0 21 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.2444 1.49098C12.3523 1.55194 12.442 1.64044 12.5045 1.74743C12.567 1.85443 12.5999 1.97609 12.6 2.09998V18.9C12.6 19.0238 12.5672 19.1455 12.5048 19.2525C12.4425 19.3595 12.3529 19.4481 12.2451 19.5091C12.1374 19.5702 12.0154 19.6016 11.8915 19.6001C11.7677 19.5986 11.6464 19.5642 11.5402 19.5006L4.7068 15.4H2.1C1.54305 15.4 1.0089 15.1787 0.615076 14.7849C0.221249 14.3911 0 13.8569 0 13.3L0 7.69578C0.000371141 7.13907 0.221784 6.60529 0.61557 6.21177C1.00936 5.81824 1.54329 5.59718 2.1 5.59718H4.7068L11.5388 1.49938C11.6451 1.43562 11.7665 1.40124 11.8905 1.39977C12.0144 1.39829 12.1366 1.42977 12.2444 1.49098ZM19.3956 5.80158L18.9 5.30738L17.9102 6.29718L18.4016 6.78998L18.4058 6.79278L18.4338 6.82358C18.4618 6.85532 18.5038 6.90758 18.5598 6.98038C18.6676 7.12458 18.8202 7.35138 18.9742 7.65938C19.2822 8.27398 19.6 9.21618 19.6 10.4944C19.6 11.7726 19.2808 12.7148 18.9742 13.3294C18.8575 13.5689 18.7183 13.7967 18.5584 14.0098C18.5098 14.074 18.4584 14.1362 18.4044 14.196L18.4016 14.2002L17.9102 14.6902L18.9 15.6814L19.3956 15.1872L19.397 15.1844L19.3998 15.1816L19.4068 15.1746L19.4264 15.155L19.4866 15.0878C19.537 15.0318 19.6009 14.9525 19.6784 14.8498C19.8324 14.6454 20.0298 14.3458 20.2258 13.9552C20.6178 13.1712 21 12.0148 21 10.4944C21 8.97398 20.6192 7.81898 20.2258 7.03358C20.0722 6.71897 19.8894 6.41946 19.6798 6.13898C19.6002 6.03379 19.5156 5.93241 19.4264 5.83518L19.4068 5.81418L19.3998 5.80718L19.397 5.80438C19.397 5.80298 19.3942 5.80158 18.9 6.29718L19.3956 5.80158Z"
                            fill="white"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      className="header-button"
                      onClick={prev}
                      disabled={!isPlayerReady}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="header-button__icon"
                      >
                        <path
                          d="M22 4.99996V19C22 19.86 20.988 20.318 20.341 19.753L12.341 12.753C12.2336 12.6591 12.1475 12.5433 12.0885 12.4135C12.0295 12.2836 11.999 12.1426 11.999 12C11.999 11.8573 12.0295 11.7163 12.0885 11.5864C12.1475 11.4566 12.2336 11.3408 12.341 11.247L20.341 4.24696C20.988 3.68196 22 4.14096 22 4.99996ZM11 4.99996V19C11 19.86 9.988 20.318 9.341 19.753L1.341 12.753C1.23359 12.6591 1.1475 12.5433 1.08852 12.4135C1.02954 12.2836 0.99902 12.1426 0.99902 12C0.99902 11.8573 1.02954 11.7163 1.08852 11.5864C1.1475 11.4566 1.23359 11.3408 1.341 11.247L9.341 4.24696C9.988 3.68196 11 4.14096 11 4.99996Z"
                          fill="white"
                        />
                      </svg>
                    </button>

                    <button
                      className="header-button"
                      onClick={next}
                      disabled={!isPlayerReady}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="header-button__icon"
                      >
                        <path
                          d="M2 4.99996V19C2 19.86 3.012 20.318 3.659 19.753L11.659 12.753C11.7664 12.6591 11.8525 12.5433 11.9115 12.4135C11.9705 12.2836 12.001 12.1426 12.001 12C12.001 11.8573 11.9705 11.7163 11.9115 11.5864C11.8525 11.4566 11.7664 11.3408 11.659 11.247L3.659 4.24696C3.012 3.68196 2 4.14096 2 4.99996ZM13 4.99996V19C13 19.86 14.012 20.318 14.659 19.753L22.659 12.753C22.7664 12.6591 22.8525 12.5433 22.9115 12.4135C22.9705 12.2836 23.001 12.1426 23.001 12C23.001 11.8573 22.9705 11.7163 22.9115 11.5864C22.8525 11.4566 22.7664 11.3408 22.659 11.247L14.659 4.24696C14.012 3.68196 13 4.14096 13 4.99996Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <SoundcloudPlayer />
                <div className="center">
                  <button className="header-contact" onClick={openForm}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="header-contact__icon"
                    >
                      <g clipPath="url(#clip0_40000889_9656)">
                        <path
                          d="M0.914062 21.0812H10.0807V19.2479H11.9141V17.4146H10.0807V15.5812H8.2474V19.2479H4.58073V17.4146H2.7474V13.7479H6.41406V11.9146H4.58073V10.0812H2.7474V11.9146H0.914062V21.0812ZM6.41406 15.5812H8.2474V13.7479H6.41406V15.5812ZM11.9141 17.4146H13.7474V15.5812H11.9141V17.4146ZM4.58073 10.0812H6.41406V8.24788H4.58073V10.0812ZM10.0807 15.5812H11.9141V13.7479H10.0807V15.5812ZM6.41406 11.9146H8.2474V10.0812H6.41406V11.9146ZM13.7474 15.5812H15.5807V13.7479H13.7474V15.5812ZM6.41406 8.24788H8.2474V6.41455H6.41406V8.24788ZM11.9141 13.7479H13.7474V11.9146H11.9141V13.7479ZM8.2474 10.0812H10.0807V8.24788H8.2474V10.0812ZM15.5807 13.7479H17.4141V11.9146H15.5807V13.7479ZM8.2474 6.41455H10.0807V4.58122H8.2474V6.41455ZM13.7474 11.9146H15.5807V10.0812H13.7474V11.9146ZM10.0807 8.24788H11.9141V6.41455H10.0807V8.24788ZM17.4141 11.9146H19.2474V10.0812H17.4141V11.9146ZM10.0807 4.58122H11.9141V2.74788H10.0807V4.58122ZM15.5807 10.0812H17.4141V8.24788H15.5807V10.0812ZM11.9141 6.41455H13.7474V4.58122H11.9141V6.41455ZM19.2474 10.0812H21.0807V4.58122H19.2474V6.41455H17.4141V8.24788H19.2474V10.0812ZM13.7474 4.58122H15.5807V2.74788H17.4141V0.914551H11.9141V2.74788H13.7474V4.58122ZM17.4141 4.58122H19.2474V2.74788H17.4141V4.58122Z"
                          fill="black"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_40000889_9656">
                          <rect width="22" height="22" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span>{staticData.contactButton}</span>
                  </button>
                </div>
                <MenuBottom locale={locale} socials={socials} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const MenuBottom = ({ locale, socials }) => {
  const [isSocialsExpand, setIsSocialsExpand] = useState(false);
  return (
    <div
      className={clsx("bottom", {
        "bottom--socials-expand": isSocialsExpand,
      })}
    >
      {/* hidden for now */}
      {false && (
        <motion.div className="lang-switch" key="lang-switch">
          <Link
            href="/"
            className={clsx("lang-switch__link", {
              "lang-switch__link--active": locale === "ua",
            })}
          >
            <span>укр</span>
          </Link>
          <Link
            href="/en"
            className={clsx("lang-switch__link", {
              "lang-switch__link--active": locale === "en",
            })}
          >
            <span>eng</span>
          </Link>
        </motion.div>
      )}
      <div className="socials-list">
        <button
          className="inst-expand"
          onClick={() => setIsSocialsExpand(!isSocialsExpand)}
        >
          <Image
            src="/assets/socials/instagram.svg"
            width={22}
            height={22}
            alt=""
          />
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inst-expand__arrow"
          >
            <g opacity="0.5">
              <path
                d="M0.25 6.25008C0.25 5.97393 0.473858 5.75007 0.75 5.75008L11.75 5.75008C12.0261 5.75008 12.25 5.97393 12.25 6.25008C12.25 6.52622 12.0261 6.75008 11.75 6.75008L0.750001 6.75007C0.473859 6.75007 0.25 6.52622 0.25 6.25008Z"
                fill="white"
                stroke="white"
                strokeWidth="0.5"
              />
              <path
                d="M6.24992 0.25C6.52607 0.25 6.74993 0.473858 6.74992 0.75L6.74992 11.75C6.74992 12.0261 6.52607 12.25 6.24992 12.25C5.97378 12.25 5.74992 12.0261 5.74992 11.75L5.74993 0.750001C5.74993 0.473859 5.97378 0.25 6.24992 0.25Z"
                fill="white"
                stroke="white"
                strokeWidth="0.5"
              />
            </g>
          </svg>
        </button>
        <div className="socials-list-wrapper">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              className="static-socials"
              {...presence(!isSocialsExpand)}
              key="static-socials--expanded"
            >
              {socials.map((item, index) => (
                <Link
                  key={index}
                  href={item.url}
                  target="_blank"
                  className="static-socials__link"
                >
                  <img
                    src={item.image}
                    width={22}
                    height={22}
                    alt={item.name || "Social Icon"}
                    className="static-socials__link-icon"
                  />
                </Link>
              ))}
            </motion.div>
            <motion.div
              className="static-socials"
              {...presence(isSocialsExpand)}
              key="static-socials--collapsed"
            >
              {socials.map((item, index) => (
                <Link
                  key={index}
                  href={item.url}
                  target="_blank"
                  className="static-socials__link"
                >
                  <img
                    src={item.image}
                    width={22}
                    height={22}
                    alt={item.name || "Social Icon"}
                    className="static-socials__link-icon"
                  />
                  <span>музика</span>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
