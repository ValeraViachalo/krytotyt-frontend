import React from "react";

import "./ServicesFilters.scss";
import clsx from "clsx";

const preparedResetButtonText = {
  ua: {
    name: "всі",
    slug: "all",
  },
};

export default function ServicesFilters({
  data,
  activeFilter,
  onFilterChange,
}) {
  const resetButtonText = preparedResetButtonText.ua;

  return (
    <div className="services-filter">
      <div className="services-filter-wrapper">
        <FilterButton
          filter={resetButtonText}
          isActiveFilter={activeFilter === resetButtonText.slug}
          handleFilterChange={() => onFilterChange(resetButtonText.slug)}
        />
        {data?.map((filter, index) => (
          <FilterButton
            key={index}
            filter={filter}
            isActiveFilter={activeFilter === filter.slug}
            handleFilterChange={() => onFilterChange(filter.slug)}
          />
        ))}
      </div>
    </div>
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
