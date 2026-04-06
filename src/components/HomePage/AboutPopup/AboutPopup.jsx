"use client";
import React, { useState } from "react";
import Image from "next/image";

import "./AboutPopup.scss";
import clsx from "clsx";
import { anim, AutoHeightAnim } from "@/lib/helpers/anim";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

function buildRows(list = []) {
  const rows = [];
  if (!list.length) return rows;

  rows.push(list.slice(0, 3));
  let cursor = 3;

  while (cursor < list.length) {
    rows.push(list.slice(cursor, cursor + 4));
    cursor += 4;
  }

  return rows;
}

export default function AboutPopup({ data }) {
  const [activeSection, setActiveSection] = useState(true);
  const route = useRouter();

  const handleSectionClick = () => {
    if (!activeSection) {
      setActiveSection(true);
    } else {
      route.push("/about");
    }
  }

  return (
    <button className="about-popup"
      onClick={handleSectionClick}
    >
      <div className={clsx("top", activeSection && "top--hidden")}>
        <p className="top-title shadow">{data?.hiddenText}</p>
        <button
          onClick={(e) => { e.stopPropagation(); setActiveSection(!activeSection); }}
          className="top-toggle"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={clsx(
              "toggle-icon",
              activeSection && "toggle-icon--active",
            )}
          >
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
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {activeSection && (
          <motion.div className="about-popup-content" {...anim(AutoHeightAnim)}>
            <div className="about-popup-team">
              {buildRows(data.members).map((row, rowIdx) => (
                <div className="about-popup-team__row" key={rowIdx}>
                  {row.map((src, i) => (
                    <div className="about-popup-team__member" key={i}>
                      <Image
                        src={src}
                        alt="team member"
                        width={40}
                        height={40}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="text">
              <p>{data?.title}</p>
              <p className="shadow">{data?.buttonText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
