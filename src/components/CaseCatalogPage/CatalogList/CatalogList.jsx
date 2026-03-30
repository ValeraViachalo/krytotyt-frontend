"use client";
import React, { useState, useMemo, useRef, useCallback } from "react";

import "./CatalogList.scss";
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";

const preparedResetButtonText = {
  ua: {
    name: "всі",
    slug: "all",
  },
};

export default function CatalogList({ data }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCase, setActiveCase] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const sectionRef = useRef(null);

  const resetButtonText = preparedResetButtonText.ua;

  const handleFilterChange = useCallback(
    (filter) => {
      if (filter === activeFilter) return;
      setIsAnimating(true);
      setActiveCase(null);

      setTimeout(() => {
        setActiveFilter(filter);
        setIsAnimating(false);

        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    },
    [activeFilter],
  );

  const matchesFilter = useCallback(
    (item) => {
      if (!item) return false;
      if (activeFilter === "all") return true;

      if (item.projectType && item.projectType.slug) {
        return item.projectType.slug === activeFilter;
      }

      if (typeof item.projectType === "string") {
        return item.projectType === activeFilter;
      }

      if (Array.isArray(item.projectTypes)) {
        return item.projectTypes.some((pt) =>
          pt?.slug ? pt.slug === activeFilter : pt === activeFilter,
        );
      }

      if (item.slug) return item.slug === activeFilter;

      return false;
    },
    [activeFilter],
  );

  const allItems = data?.list || [];

  return (
    <section className="catalog-list container" ref={sectionRef}>
      <div
        className={clsx("catalog-list-content", {
          "catalog-list-content--animating": isAnimating,
        })}
      >
        {allItems.map((item, index) => (
          <CatalogItem
            key={item._id ?? item.slug ?? index}
            item={item}
            activeCase={activeCase}
            setActiveCase={setActiveCase}
            index={index}
            hidden={!matchesFilter(item)}
          />
        ))}

        <div
          className={clsx("catalog-list-hovered", {
            "catalog-list-hovered--active": activeCase !== null,
          })}
        >
          {allItems.map((item, index) => (
            <span
              className={clsx("catalog-list-hovered__name", {
                "catalog-list-hovered__name--active":
                  activeCase === index && matchesFilter(item),
              })}
              key={item._id ?? item.slug ?? index}
            >
              {item?.name}
            </span>
          ))}
        </div>
      </div>

      <div className="filters">
        <div className="filters-list">
          <FilterButton
            filter={resetButtonText}
            isActiveFilter={activeFilter === "all"}
            handleFilterChange={() => handleFilterChange("all")}
          />
          {data?.projectTypes &&
            data?.projectTypes.map((filter, index) => (
              <FilterButton
                key={filter._id ?? filter.slug ?? index}
                filter={filter}
                isActiveFilter={activeFilter === filter.slug}
                handleFilterChange={() => handleFilterChange(filter.slug)}
              />
            ))}
          <button
            className={clsx("filter-button filter-button--reset button", {
              "filter-button--reset-active": activeFilter !== "all",
            })}
            onClick={() => handleFilterChange("all")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter-button__icon"
            >
              <path d="M20.25 2.25V3.75H17.249L17.8506 4.2002C19.0617 5.10771 20.0448 6.28505 20.7217 7.63867C21.3564 8.90812 21.7056 10.3004 21.7461 11.7168L21.75 12C21.75 17.3849 17.3849 21.75 12 21.75C6.61507 21.75 2.25 17.3849 2.25 12C2.25 6.69868 6.48065 2.3885 11.75 2.25586V3.75586C9.86408 3.81322 8.05183 4.5137 6.61816 5.74805C5.12123 7.03689 4.13646 8.82007 3.84277 10.7734C3.54909 12.7268 3.96587 14.7206 5.01758 16.3926C6.06934 18.0646 7.68629 19.3037 9.57422 19.8848C11.4621 20.4658 13.4958 20.3508 15.3057 19.5596C17.1156 18.7683 18.582 17.3537 19.4375 15.5732C20.293 13.7928 20.4809 11.7639 19.9678 9.85645C19.4546 7.94913 18.2738 6.28956 16.6406 5.17871L16.25 4.91309V7.75H14.75V2.25H20.25Z" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

const FilterButton = ({ filter, isActiveFilter, handleFilterChange }) => {
  return (
    <button
      className={clsx("filter-button button", {
        "filter-button--active": isActiveFilter,
      })}
      onClick={() => handleFilterChange()}
    >
      {filter?.name}
    </button>
  );
};

const CatalogItem = ({ item, activeCase, setActiveCase, index, hidden }) => {
  const handleMouseEnter = () => {
    setActiveCase(index);
  };

  const handleMouseLeave = () => {
    setActiveCase(null);
  };

  return (
    <Link
      href={`/cases/${item?.slug}`}
      className={clsx("catalog-item", {
        "catalog-item--not-active": activeCase !== null && activeCase !== index,
        "catalog-item--active": activeCase === index,
        "catalog-item--hidden": hidden,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <p className="catalog-item__name">{item?.name}</p>
      <div className="catalog-item-scroll">
        <div className="catalog-item-list">
          {item?.images?.map((image, idx) => (
            <div className="catalog-item__image" key={image?.imageUrl ?? idx}>
              <Image
                src={image?.imageUrl}
                alt={`${item?.name}-${idx}`}
                className=""
                placeholder="blur"
                blurDataURL={image?.lqip}
                width={image?.sizes?.width / 4}
                height={image?.sizes?.height / 4}
                onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
              />
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
