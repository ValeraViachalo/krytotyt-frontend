import { Content } from "@/utils/Content/Content";
import CablesCanvas from "./CablesCanvas/CablesCanvas";

import "./HomePage.scss";

export default function HomePage({ data }) {
  const projects = data?.list?.flatMap((item) => (
    item.images.map((image) => ({
      name: item.name,
      image: image?.imageUrl,
      slug: item.slug
    }))
  ));

  console.log(projects);

  return (
    <main className="home">
      <section className="home__canvas-section">
        <CablesCanvas projectsData={projects} />
      </section>
    </main>
  );
}
