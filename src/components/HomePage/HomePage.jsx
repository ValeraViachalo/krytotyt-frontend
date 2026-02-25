import { Content } from "@/utils/Content/Content";
import CablesCanvas from "./CablesCanvas/CablesCanvas";

import "./HomePage.scss";

export default function HomePage() {
  const projects = [
    {
      image: "/assets/screenshot.png",
      name: "Pikachu",
      slug: "025-pikachu",
    },
    {
      image: "/assets/screenshot.png",
      name: "Pikachu",
      slug: "025-pikachu",
    },
    {
      image: "/assets/screenshot.png",
      name: "Pikachu",
      slug: "025-pikachu",
    },
  ];
  return (
    <main className="home">
      <section className="home__canvas-section">
        <CablesCanvas projectsData={projects} />
      </section>
    </main>
  );
}
