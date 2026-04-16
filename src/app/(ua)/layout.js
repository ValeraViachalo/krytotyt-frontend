import PageTransition from "@/utils/PageTransition/PageTransition";
import UIProvider from "@/utils/UIProvider/UIProvider";
import CablesCanvasProvider from "@/components/CablesCanvasProvider/CablesCanvasProvider";
import { client } from "@/lib/sanity/client";
import { QUERY_CASES_CATALOG } from "@/lib/sanity/query";

async function fetchProjectsData() {
  const data = await client.fetch(QUERY_CASES_CATALOG, { lang: "ua" });
  return data?.list?.flatMap((item) =>
    item.images.map((image) => ({
      name: item.name,
      image: image?.imageUrl,
      slug: item.slug,
    })),
  );
}

export default async function layout({ children }) {
  const projectsData = await fetchProjectsData();

  return (
    <UIProvider>
      {/* <CablesCanvasProvider projectsData={projectsData} /> */}
      <PageTransition>
        {children}
      </PageTransition>
    </UIProvider>
  );
}
