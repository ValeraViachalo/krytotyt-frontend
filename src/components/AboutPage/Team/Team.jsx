"use client";
import React, { useEffect, useMemo, useState } from "react";

import "./Team.scss";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { anim, MenuAnim, PopUpFadeInAnim } from "@/lib/helpers/anim";
import clsx from "clsx";
import useIsMobile from "@/lib/helpers/useIsMobile";
import BlockContent from "@/utils/BlockContent/BlockContent";

/**
 * Split the team list into rows:
 *  - first row: always 3
 *  - subsequent rows: up to 4 each
 */
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

/**
 * Determine popup position class based on which row and column
 * the active member sits in.
 *
 * Horizontal: member is in the left half of its row → popup goes right,
 *             member is in the right half → popup goes left.
 * Vertical:   first row → popup goes down (bottom),
 *             last row  → popup goes up (top),
 *             middle rows → whichever half of total rows it's closer to.
 */
function getPopupPosition(activeIndex, rows) {
  if (activeIndex === null || !rows.length) return "";

  // Find which row and column this index belongs to
  let rowIdx = 0;
  let colIdx = 0;
  let cursor = 0;
  for (let r = 0; r < rows.length; r++) {
    if (activeIndex < cursor + rows[r].length) {
      rowIdx = r;
      colIdx = activeIndex - cursor;
      break;
    }
    cursor += rows[r].length;
  }

  const rowLen = rows[rowIdx].length;
  const isRight = colIdx >= rowLen / 2;
  const isBottom = rowIdx < rows.length / 2;

  const h = isRight ? "left" : "right";
  const v = isBottom ? "bottom" : "top";
  return `team-popup--${h}-${v}`;
}

export default function Team({ data }) {
  // const [activeIndex, setActiveIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(2);
  const activePopup = data?.list[activeIndex];
  const isMobile = useIsMobile();

  const rows = useMemo(() => buildRows(data?.list), [data?.list]);
  const isCompact = (data?.list?.length ?? 0) <= 6;

  // Auto-close popup on scroll for mobile
  useEffect(() => {
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
    <section className={clsx("team container", { "team--compact": isCompact })}>
      <div className="team-container">
        <AnimatePresence mode="sync">
          {activePopup && (
            <motion.div
              className={clsx("team-popup", getPopupPosition(activeIndex, rows))}
              key={`${activeIndex}-${activePopup.name}`}
              {...anim(PopUpFadeInAnim)}
            >
              <button className="popup-close" onClick={() => setActiveIndex(null)} />
              <div className="popup-content">
                <div className="top">
                  <p>{activePopup?.name}</p>
                  <p className="shadow">{activePopup?.position}</p>
                </div>
                {/* <p
                  className="description shadow"
                  dangerouslySetInnerHTML={{ __html: activePopup?.text }}
                /> */}
                <BlockContent content={activePopup?.text} classes="description shadow" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {rows.map((row, rowIdx) => {
          // Calculate the global starting index for members in this row
          const globalOffset = rowIdx === 0 ? 0 : 3 + (rowIdx - 1) * 4;

          return (
            <div className="team-row" key={rowIdx}>
              {row.map((member, i) => {
                const globalIndex = globalOffset + i;
                return (
                  <div
                    className={clsx("team-member", {
                      "team-member--active": activeIndex === globalIndex,
                      "team-member--highlighted": activeIndex !== null,
                    })}
                    key={globalIndex}
                    {...getMemberHandlers(globalIndex)}
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
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
