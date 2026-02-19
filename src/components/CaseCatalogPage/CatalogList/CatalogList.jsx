"use client";
import React, { useState, useMemo } from "react";

import "./CatalogList.scss";
import Link from "next/link";
import clsx from "clsx";

const preparedResetButtonText = {
  ua: {
    name: "всі",
    slug: "all",
  },
};

export default function CatalogList({ data }) {
  // console.log("CatalogList data:", data);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCase, setActiveCase] = useState(null);

  const resetButtonText = preparedResetButtonText.ua;

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setActiveCase(null);
  };

  const matchesFilter = (item) => {
    if (!item) return false;
    if (activeFilter === "all") return true;

    // try multiple possible shapes for project type on item
    if (item.projectType && item.projectType.slug) {
      return item.projectType.slug === activeFilter;
    }

    if (typeof item.projectType === "string") {
      return item.projectType === activeFilter;
    }

    if (Array.isArray(item.projectTypes)) {
      // array of objects or array of slugs
      return item.projectTypes.some((pt) =>
        pt?.slug ? pt.slug === activeFilter : pt === activeFilter,
      );
    }

    // fallback: check top-level slug field
    if (item.slug) return item.slug === activeFilter;

    return false;
  };

  const filteredList = useMemo(() => {
    return (data?.list || []).filter((item) => matchesFilter(item));
  }, [data?.list, activeFilter]);

  return (
    <section className="catalog-list container">
      <div className="catalog-list-content">
        {filteredList &&
          filteredList.map((item, index) => (
            <CatalogItem
              key={item._id ?? item.slug ?? index}
              item={item}
              activeCase={activeCase}
              setActiveCase={setActiveCase}
              index={index}
            />
          ))}

        <div
          className={clsx("catalog-list-hovered", {
            "catalog-list-hovered--active": activeCase !== null,
          })}
        >
          {filteredList.map((item, index) => (
            <span
              className={clsx("catalog-list-hovered__name", {
                "catalog-list-hovered__name--active": activeCase === index,
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

const CatalogItem = ({ item, activeCase, setActiveCase, index }) => {
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
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <p className="catalog-item__name">{item?.name}</p>
      <div className="catalog-item-scroll">
        <div className="catalog-item-list">
          {item?.images?.map((image, idx) => (
            <div className="catalog-item__image" key={image?.imageUrl ?? idx}>
              <img
                src={image?.imageUrl}
                alt={`${item?.name}-${idx}`}
                className=""
              />
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
