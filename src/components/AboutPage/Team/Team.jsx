"use client";
import React, { useState } from "react";

import "./Team.scss";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { anim, MenuAnim, PopUpFadeInAnim } from "@/lib/helpers/anim";
import clsx from "clsx";
import useIsMobile from "@/lib/helpers/useIsMobile";

export default function Team({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const activePopup = data?.list[activeIndex];
  const isMobile = useIsMobile();

  // Auto-close popup on scroll for mobile
  React.useEffect(() => {
    if (!isMobile || activeIndex === null) return;

    const handleScroll = () => {
      setActiveIndex(null);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, activeIndex]);

  // Event helpers: use click on mobile, hover on desktop
  const getMemberHandlers = (index) => {
    const handlers = {};
    if (isMobile) {
      handlers.onClick = () => setActiveIndex(index);
    } else {
      handlers.onMouseEnter = () => setActiveIndex(index);
      handlers.onMouseLeave = () => setActiveIndex(null);
    }
    return handlers;
  };

  return (
    <section className="team container">
      <div className="team-container">
        <AnimatePresence mode="sync">
          {activePopup && (
            <motion.div
              className={clsx("team-popup", {
                "team-popup--left-top": [5, 6, 8, 9].includes(activeIndex),
                "team-popup--left-bottom": [2].includes(activeIndex),
                "team-popup--right-top": [3, 7, 4].includes(activeIndex),
                "team-popup--right-bottom": [0, 1].includes(activeIndex),
              })}
              key={`${activeIndex}-${activePopup.name}`}
              {...anim(PopUpFadeInAnim)}
            >
              <button className="popup-close" onClick={() => setActiveIndex(null)} />
              <div className="popup-content">
                <div className="top">
                  <p>{activePopup?.name}</p>
                  <p className="shadow">{activePopup?.position}</p>
                </div>
                <p
                  className="description shadow"
                  dangerouslySetInnerHTML={{ __html: activePopup?.text }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="team-row">
          {data?.list.slice(0, 3).map((member, index) => (
            <div
              className={clsx("team-member", {
                "team-member--active": activeIndex === index,
                "team-member--highlighted":  activeIndex !== null,
              })}
              key={index}
              {...getMemberHandlers(index)}
            >
              <div className="team-member__image">
                <Image
                  src={member?.image}
                  alt={`${member?.name}'s photo`}
                  className="photo"
                  width={200}
                  height={200}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="team-row">
          {data?.list.slice(3, 7).map((member, index) => (
            <div
              className={clsx("team-member", {
                "team-member--active": activeIndex === index + 3,
                "team-member--highlighted": activeIndex !== null,
              })}
              key={index}
              {...getMemberHandlers(index + 3)}
            >
              <div className="team-member__image">
                <Image
                  src={member?.image}
                  alt={`${member?.name}'s photo`}
                  className="photo"
                  width={200}
                  height={200}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="team-row">
          {data?.list.slice(7).map((member, index) => (
            <div
              className={clsx("team-member", {
                "team-member--active": activeIndex === index + 7,
                "team-member--highlighted":  activeIndex !== null,
              })}
              key={index}
              {...getMemberHandlers(index + 7)}
            >
              <div className="team-member__image">
                <Image
                  src={member?.image}
                  alt={`${member?.name}'s photo`}
                  className="photo"
                  width={200}
                  height={200}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
