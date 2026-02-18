import React from 'react'
import CaseHero from './CaseHero/CaseHero';
import CaseSlider from './CaseSlider/CaseSlider';

export default function CaseDetails({ data }) {
  console.log("CaseDetails data:", data);
  
  return (
    <main className="case-details page--white">
      <CaseHero data={data} />
      <CaseSlider data={data?.images} />
    </main>
  )
}
