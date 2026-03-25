"use client";

import React, { useContext, useState } from "react";
import ServicesFilters from "./ServicesFilters/ServicesFilters";
import ServicesMap from "./ServicesMap/ServicesMap";

import "./ServicesPage.scss";
import { FormPopUpContext } from "@/utils/FormPopUp/context";

export default function ServicesPage({ data }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  return (
    <main className="services-page">
      <ServicesMap
        data={data?.list}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <ServicesFilters
        data={data?.list}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <ContactButton />
    </main>
  );
}

const ContactButton = () => {
  const { openForm } = useContext(FormPopUpContext)
  return (
    <button
      className="contact-button"
      onClick={openForm}
    >
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="96" height="96" rx="48" fill="#95FF00" />
        <path
          d="M29.6621 66.3293H46.3288V62.9959H49.6621V59.6626H46.3288V56.3293H42.9954V62.9959H36.3288V59.6626H32.9954V52.9959H39.6621V49.6626H36.3288V46.3293H32.9954V49.6626H29.6621V66.3293ZM39.6621 56.3293H42.9954V52.9959H39.6621V56.3293ZM49.6621 59.6626H52.9954V56.3293H49.6621V59.6626ZM36.3288 46.3293H39.6621V42.9959H36.3288V46.3293ZM46.3288 56.3293H49.6621V52.9959H46.3288V56.3293ZM39.6621 49.6626H42.9954V46.3293H39.6621V49.6626ZM52.9954 56.3293H56.3288V52.9959H52.9954V56.3293ZM39.6621 42.9959H42.9954V39.6626H39.6621V42.9959ZM49.6621 52.9959H52.9954V49.6626H49.6621V52.9959ZM42.9954 46.3293H46.3288V42.9959H42.9954V46.3293ZM56.3288 52.9959H59.6621V49.6626H56.3288V52.9959ZM42.9954 39.6626H46.3288V36.3293H42.9954V39.6626ZM52.9954 49.6626H56.3288V46.3293H52.9954V49.6626ZM46.3288 42.9959H49.6621V39.6626H46.3288V42.9959ZM59.6621 49.6626H62.9954V46.3293H59.6621V49.6626ZM46.3288 36.3293H49.6621V32.9959H46.3288V36.3293ZM56.3288 46.3293H59.6621V42.9959H56.3288V46.3293ZM49.6621 39.6626H52.9954V36.3293H49.6621V39.6626ZM62.9954 46.3293H66.3288V36.3293H62.9954V39.6626H59.6621V42.9959H62.9954V46.3293ZM52.9954 36.3293H56.3288V32.9959H59.6621V29.6626H49.6621V32.9959H52.9954V36.3293ZM59.6621 36.3293H62.9954V32.9959H59.6621V36.3293Z"
          fill="black"
        />
      </svg>
    </button>
  );
};
