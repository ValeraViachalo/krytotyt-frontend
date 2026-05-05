import LegalPage from "@/components/LegalPage/LegalPage";
import { client } from "@/lib/sanity/client";
import { QUERY_PRIVACY_PAGE } from "@/lib/sanity/query";
import React from "react";

export const revalidate = 60;

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function page() {
  const data = await client.fetch(QUERY_PRIVACY_PAGE, {
    lang: "ua",
  });

  return <LegalPage data={data} />;
}
