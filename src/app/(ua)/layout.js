import PageTransition from "@/utils/PageTransition/PageTransition";
import UIProvider from "@/utils/UIProvider/UIProvider";
import CablesCanvasProvider from "@/components/CablesCanvasProvider/CablesCanvasProvider";
import { client } from "@/lib/sanity/client";
import { QUERY_HOME_PROJECTS } from "@/lib/sanity/query";

async function fetchProjectsData() {
  const list = await client.fetch(QUERY_HOME_PROJECTS, { lang: "ua" });
  return list?.flatMap((item) =>
    (item.images || []).map((image) => ({
      name: item.name,
      image: image?.imageUrl,
      slug: item.slug,
      // Real image aspect ratio (width / height) so the canvas can size each
      // tile's height to match. Null when dimensions are unavailable.
      aspect:
        image?.sizes?.width && image?.sizes?.height
          ? image.sizes.width / image.sizes.height
          : null,
    })),
  );
}

export default async function layout({ children }) {
  const projectsData = await fetchProjectsData();

  return (
    <UIProvider>
      <CablesCanvasProvider projectsData={projectsData} />
      <PageTransition>
        {children}
      </PageTransition>
    </UIProvider>
  );
}
