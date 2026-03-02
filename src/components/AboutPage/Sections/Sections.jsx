import React from "react";

import "./Sections.scss";
import Link from "next/link";
import Image from "next/image";
import BlockContent from "@/utils/BlockContent/BlockContent";

export default function Sections({ data }) {
  return (
    <section className="sections container">
      <div className="sections-content">
        <About about={data?.about} />
        <Services services={data?.services} />
        <HowItWorks howItWorks={data?.howItWorks} />
        <AboutFooter footer={data?.footer} />
      </div>
    </section>
  );
}

const AboutFooter = ({ footer }) => (
  <div className="about-footer">
    <h2>{footer?.title}</h2>
    {/* <p className="shadow" dangerouslySetInnerHTML={{ __html: footer?.text }} /> */}

    <BlockContent content={footer?.text} classes="shadow" />
    <Image
      src="/assets/about/heart-filled.svg"
      alt="heart icon"
      width={250}
      height={250}
      className="about-footer__icon"
    />
    <button className="button"
    data-scroll-anchor="#about"
    >
      <Image
        src="/assets/icon/arrow-up.svg"
        alt="arrow up icon"
        width={16}
        height={16}
        className="button__icon"
      />
      <span className="button__text">
        {footer?.buttonToUp}
      </span>
    </button>
  </div>
);

const HowItWorks = ({ howItWorks }) => (
  <div className="how-it-works">
    <div className="top">
      <h2>{howItWorks?.title}</h2>
      {/* <p
        className="shadow"
        dangerouslySetInnerHTML={{ __html: howItWorks?.text }}
      /> */}
      <BlockContent content={howItWorks?.text} classes="shadow" />
    </div>

    <div className="list">
      {howItWorks?.list &&
        howItWorks?.list.map((item, index) => (
          <React.Fragment key={index}>
            <div className="item">
              <Image
                src={item?.icon}
                alt={`icon for step ${index + 1}`}
                width={30}
                height={30}
                className="item__icon"
              />
              <span className="item__text">{item?.title}</span>
            </div>
            {index < howItWorks?.list.length - 1 && (
              <svg
                width="13"
                height="15"
                viewBox="0 0 13 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="arrow"
              >
                <path
                  d="M8.01412 9.33917L9.07478 10.3998L12.9639 6.51074L9.07478 2.62165L8.01412 3.68232L10.0201 5.68832H0.764649V7.21716H10.1361L8.01412 9.33917Z"
                  fill="white"
                />
              </svg>
            )}
          </React.Fragment>
        ))}
    </div>

    <BlockContent content={howItWorks?.bottomText} classes="bottom shadow" />
  </div>
);

const About = ({ about }) => (
  <div className="about">
    <h2>{about?.title}</h2>
    {/* <p
      className="shadow about__text"
      dangerouslySetInnerHTML={{ __html: about?.text }}
    /> */}
    <BlockContent content={about?.text} classes="shadow about__text" />
  </div>
);

const Services = ({ services }) => (
  <div className="services">
    <div className="top">
      <h2>{services?.title}</h2>
      <p className="shadow">{services?.text}</p>
    </div>

    <div className="list">
      <div className="list-row">
        {services?.list.slice(0, 1) &&
          services?.list
            .slice(0, 1)
            .map((service, index) => (
              <ServiceItem service={service?.text} key={index} />
            ))}
      </div>
      <div className="list-row">
        {services?.list.slice(1, 3) &&
          services?.list
            .slice(1, 3)
            .map((service, index) => (
              <ServiceItem service={service?.text} key={index} />
            ))}
      </div>
      <div className="list-row">
        {services?.list.slice(3, 6) &&
          services?.list
            .slice(3, 6)
            .map((service, index) => (
              <ServiceItem service={service?.text} key={index} />
            ))}
      </div>
      <div className="list-row">
        {services?.list.slice(6, 8) &&
          services?.list
            .slice(6, 8)
            .map((service, index) => (
              <ServiceItem service={service?.text} key={index} />
            ))}
      </div>
      <div className="list-row">
        {services?.list.slice(8) &&
          services?.list
            .slice(8)
            .map((service, index) => (
              <ServiceItem service={service?.text} key={index} />
            ))}
      </div>
    </div>

    <Link href={services?.button.href} className="button services__button">
      <Image
        src="/assets/icon/eye-light.svg"
        width={16}
        height={16}
        alt="eye icon"
        className="button__icon"
      />
      <span className="button__text">{services?.button.text}</span>
    </Link>
  </div>
);

const ServiceItem = ({ service }) => (
  <div className="item">
    <svg
      width="30"
      height="26"
      viewBox="0 0 30 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="item__icon"
    >
      <path
        d="M5.39012 22.5149L6.8668 23.1191L10.0245 23.414L22.3825 23.6128L23.8272 23.2185L23.0518 24.9934L23.0375 24.9658L23.0496 24.9934L7.41683 25.3335L7.41573 25.3324L7.41352 25.3302L5.80209 23.1025L5.39012 22.5149Z"
        fill="white"
      />
      <path
        d="M3.33826 19.7427L6.22868 20.6406L13.526 20.9477L21.1491 21.0736L25.0225 20.6406L24.404 22.029L24.14 22.6243L22.1111 23.1136L10.7736 22.9722L6.73453 22.7104L4.79728 21.7926L4.41844 21.2625L3.33826 19.7427Z"
        fill="white"
      />
      <path
        d="M1.451 17.0919L5.55966 17.8938L17.0264 18.372L19.898 18.4195L26.2598 17.8596L25.3861 19.8487L20.8589 20.4584L14.338 20.3502L6.10196 20.1182L2.8327 19.0336L1.451 17.0919Z"
        fill="white"
      />
      <path
        d="M0.564631 13.5113L1.30574 11.595L1.75084 12.4786L4.35299 12.927L11.3355 13.3136L18.7697 12.8928L24.9118 13.3312L28.3953 13.0551L28.3975 13.054L28.1302 13.656L28.1291 13.6571L27.5691 14.9173L21.5155 15.3856L18.9984 15.2508L15.8252 15.3226L4.81245 14.8134V14.8123L0.636421 14.0635L0.564631 13.5113Z"
        fill="white"
      />
      <path
        d="M1.49216 11.0735L2.04374 9.64224L3.13496 10.496L3.79191 10.9528L6.5594 11.277L18.5215 10.2044L28.9787 10.8748L29.3487 10.9091L28.7047 12.3813L25.8353 12.7723L18.7214 12.346L11.514 12.8157L4.2527 12.4796L2.01049 12.0501L1.49216 11.0735Z"
        fill="white"
      />
      <path
        d="M2.45926 8.46708L2.45595 8.46377L2.64592 7.97669L3.84914 8.92919L4.70422 9.2284L18.2654 7.35708L27.1466 8.43063L27.6944 8.36105L29.3975 10.3414L18.4996 9.67428V9.67538L6.17462 10.8225L3.77138 10.4253L3.32628 10.1139L2.1743 9.21371L2.45926 8.46708Z"
        fill="white"
      />
      <path
        d="M2.80189 7.55923L3.35965 6.13556L4.27085 6.60275L9.37132 6.42383L18.0271 4.76821L24.1194 5.84618L25.5011 5.85281L27.1612 7.7503L26.4521 7.83314L18.2237 6.90096L4.90404 8.7154L4.1329 8.58562L2.80189 7.55923Z"
        fill="white"
      />
      <path
        d="M3.57939 5.56122L4.17139 4.0282L4.80315 4.16626L13.8538 3.20006L17.794 2.21023L21.0423 3.22635L23.2501 3.27936L23.7869 3.89345L24.9102 5.18017L23.323 5.18901L17.984 4.30211L9.42318 5.82961L4.40112 6.00301L3.57939 5.56122Z"
        fill="white"
      />
      <path
        d="M17.617 0.312659V0.313763L17.6082 0.318181L17.617 0.312659ZM4.91881 3.71887L13.9805 2.72705L14.15 2.67956L17.7451 1.7032L20.3605 2.64421L20.3616 2.64532L22.7539 2.69502L21.0762 0.794211L17.6214 0.314868L17.617 0.31045V0.311554L5.27445 2.00361L5.27335 2.01024L4.89562 2.16818L4.35221 3.56093L4.91881 3.71887Z"
        fill="white"
      />
      <path
        d="M5.15549 1.37522L5.67791 0.000146866L16.9502 0.08972L16.933 0.105735L5.43051 1.32994L5.15549 1.37522Z"
        fill="white"
      />
      <path
        d="M0.954269 16.395L5.42188 17.3183L17.8185 17.8098L19.6454 17.9203L26.5693 17.1637L27.3369 15.4385L20.6548 15.8814L19.0313 15.7853L17.0443 15.8715L4.94144 15.3458L0.280537 14.5704L0.162027 14.5548L0 15.01L0.954269 16.395Z"
        fill="white"
      />
    </svg>
    <p className="item__text">{service}</p>
  </div>
);
