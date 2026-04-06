import React from "react";

import "./CaseHero.scss";
import BlockContent from "@/utils/BlockContent/BlockContent";
import Link from "next/link";
import Image from "next/image";
import arrowPixeled from "../../../../public/assets/icon/arrow-pixeled.svg";

export default function CaseHero({ data }) {
  return (
    <section className="case-hero container">
      <div className="case-hero-buttons">
        {data?.next && (
          <Link
            href={data?.next?.slug}
            className="case-hero__button case-hero__button--next"
          >
            <Image
              src={arrowPixeled}
              alt="Next case"
              width={96}
              height={96}
              className="case-hero__button-icon"
            />
          </Link>
        )}

        {data?.prev && (
          <Link
            href={data?.prev?.slug}
            className="case-hero__button case-hero__button--prev"
          >
            <Image
              src={arrowPixeled}
              alt="Previous case"
              width={96}
              height={96}
              className="case-hero__button-icon"
            />
          </Link>
        )}
      </div>

      <div className="case-hero-content">
        <h2>{data?.name}</h2>
        {(data?.text || data?.services) && (
          <div className="bottom">
            <BlockContent content={data?.text} classes="shadow" />
            {data?.services && (
              <div className="services-list">
                {data?.services?.map((service, i) => (
                  <div key={i} className="service">
                    <svg
                      width="26"
                      height="23"
                      viewBox="0 0 26 23"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="service-icon"
                    >
                      <path
                        d="M4.73422 19.7773L6.03137 20.308L8.80516 20.5671L19.6607 20.7417L20.9297 20.3954L20.2486 21.9545L20.236 21.9302L20.2467 21.9545L6.51453 22.2533L6.51356 22.2523L6.51162 22.2504L5.09611 20.2935L4.73422 19.7773Z"
                        fill="black"
                      />
                      <path
                        d="M2.93263 17.3423L5.47163 18.1311L11.8817 18.4008L18.578 18.5114L21.9805 18.1311L21.4372 19.3506L21.2053 19.8735L19.423 20.3033L9.46398 20.1791L5.91598 19.9492L4.21426 19.143L3.88148 18.6773L2.93263 17.3423Z"
                        fill="black"
                      />
                      <path
                        d="M1.27486 15.0137L4.88399 15.718L14.9566 16.1381L17.4791 16.1798L23.0674 15.688L22.3 17.4353L18.3231 17.9708L12.5951 17.8757L5.36036 17.672L2.48858 16.7193L1.27486 15.0137Z"
                        fill="black"
                      />
                      <path
                        d="M0.495424 11.8683L1.14643 10.1851L1.53741 10.9612L3.82319 11.3551L9.95676 11.6947L16.4871 11.325L21.8824 11.7102L24.9424 11.4677L24.9443 11.4667L24.7095 11.9954L24.7086 11.9964L24.2167 13.1034L18.8991 13.5148L16.688 13.3964L13.9006 13.4595L4.22679 13.0122V13.0112L0.558485 12.3534L0.495424 11.8683Z"
                        fill="black"
                      />
                      <path
                        d="M1.3106 9.727L1.79511 8.46973L2.75366 9.21969L3.33074 9.62096L5.76175 9.90571L16.2695 8.96356L25.4553 9.55246L25.7803 9.58254L25.2146 10.8758L22.6941 11.2193L16.4451 10.8448L10.114 11.2574L3.7355 10.9622L1.76591 10.5848L1.3106 9.727Z"
                        fill="black"
                      />
                      <path
                        d="M2.16019 7.43745L2.15728 7.43454L2.32415 7.00668L3.38108 7.84338L4.13221 8.1062L16.0446 6.4624L23.846 7.40543L24.3272 7.34431L25.8232 9.08387L16.2503 8.49787V8.49884L5.42383 9.50649L3.31278 9.1576L2.92179 8.88401L1.90988 8.0933L2.16019 7.43745Z"
                        fill="black"
                      />
                      <path
                        d="M2.46075 6.64016L2.9507 5.38958L3.75111 5.79997L8.23147 5.6428L15.8349 4.18848L21.1865 5.13539L22.4002 5.14121L23.8584 6.808L23.2355 6.88077L16.0076 6.06192L4.30732 7.65576L3.62993 7.54176L2.46075 6.64016Z"
                        fill="black"
                      />
                      <path
                        d="M3.14446 4.88498L3.66449 3.53835L4.21944 3.65962L12.1697 2.81089L15.6309 1.94141L18.4842 2.83399L20.4236 2.88055L20.8951 3.41998L21.8818 4.55026L20.4877 4.55802L15.7977 3.77896L8.27776 5.12074L3.86629 5.27306L3.14446 4.88498Z"
                        fill="black"
                      />
                      <path
                        d="M15.4749 0.27489V0.27586L15.4672 0.279741L15.4749 0.27489ZM4.3206 3.26697L12.2806 2.39574L12.4295 2.35402L15.5875 1.49637L17.8849 2.32297L17.8859 2.32394L19.9873 2.3676L18.5136 0.697895L15.4788 0.27683L15.4749 0.272949V0.273919L4.633 1.76026L4.63203 1.76608L4.30022 1.90482L3.82289 3.12823L4.3206 3.26697Z"
                        fill="black"
                      />
                      <path
                        d="M4.52796 1.20789L4.98686 0L14.8887 0.0786828L14.8735 0.0927506L4.76954 1.16811L4.52796 1.20789Z"
                        fill="black"
                      />
                      <path
                        d="M0.838629 14.4016L4.76307 15.2127L15.6525 15.6444L17.2572 15.7414L23.3394 15.0769L24.0137 13.5614L18.144 13.9505L16.7178 13.8661L14.9724 13.9417L4.34103 13.4799L0.246811 12.7988L0.142708 12.7852L0.00038147 13.185L0.838629 14.4016Z"
                        fill="black"
                      />
                    </svg>

                    <span>{service.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
