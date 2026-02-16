import { Content } from "@/utils/Content/Content";

import "./HomePage.scss";

export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <Content
          url="https://cdn.cosmos.so/7dfa4ac8-ddfc-4eba-a009-db0f7e824778?format=jpeg"
          className="hero__bg"
        />
        <h1 className="super-text hero__title">RTRTS</h1>
      </section>
    </main>
  );
};
