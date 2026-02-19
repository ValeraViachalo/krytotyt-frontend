import React from "react";
import CaseHero from "./CaseHero/CaseHero";
import CaseSlider from "./CaseSlider/CaseSlider";

import "./CaseDetails.scss";

export default function CaseDetails({ data }) {
  console.log("CaseDetails data:", data);

  return (
    <main className="case-details page--white">
      <CaseHero data={data} />
      <CaseSlider data={data?.images} />
      <div className="case-details__button">
        <button className="button">
          <span className="button__text">замовити проект</span>
        </button>
      </div>
    </main>
  );
}
