"use client";
import React from "react";
import { usePathname } from "next/navigation";
import CaseHero from "./CaseHero/CaseHero";
// import CaseSlider from "./CaseSliderOld/CaseSlider";
import { useFormPopUp } from "@/utils/FormPopUp/context";

import "./CaseDetails.scss";
import CaseSmoothSlider from "./CaseSmoothSlider/CaseSmoothSlider";

export default function CaseDetails({ data }) {
  console.log("CaseDetails data:", data);
  const pathname = usePathname();
  const { openForm } = useFormPopUp();

  return (
    <main className="case-details page--white">
      <CaseHero data={data} />
      {/* <CaseSlider data={data?.images} /> */}
      <CaseSmoothSlider key={pathname} data={data?.images} videoUrl={data?.videoUrl} />
      <div className="case-details__button">
        <button className="button" onClick={openForm}>
          <span className="button__text">замовити проект</span>
        </button>
      </div>
    </main>
  );
}
