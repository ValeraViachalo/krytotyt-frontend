"use client";
import React from "react";
import CaseHero from "./CaseHero/CaseHero";
import CaseSlider from "./CaseSlider/CaseSlider";
import { useFormPopUp } from "@/utils/FormPopUp/context";

import "./CaseDetails.scss";

export default function CaseDetails({ data }) {
  console.log("CaseDetails data:", data);
  const { openForm } = useFormPopUp();

  return (
    <main className="case-details page--white">
      <CaseHero data={data} />
      <CaseSlider data={data?.images} />
      <div className="case-details__button">
        <button className="button" onClick={openForm}>
          <span className="button__text">замовити проект</span>
        </button>
      </div>
    </main>
  );
}
