import React from "react";

import "./LegalPage.scss";
import BlockContent from "@/utils/BlockContent/BlockContent";
import Image from "next/image";

export default function LegalPage({ data }) {
  const toTopText = {
    en: "to top",
    ua: "догори",
  }
  return (
    <main className="legal-page page--white" id="top">
      <div className="legal-page__container">
        <h2 className="legal-page__title">{data.title}</h2>
        <BlockContent
          classes="legal-page__content shadow"
          content={data.content}
        />

        <button className="button" data-scroll-anchor="#top">
          <Image
            src="/assets/icon/arrow-up.svg"
            alt="arrow up icon"
            width={16}
            height={16}
            className="button__icon"
          />
          <span className="button__text">{toTopText.ua}</span>
        </button>
      </div>
    </main>
  );
}
