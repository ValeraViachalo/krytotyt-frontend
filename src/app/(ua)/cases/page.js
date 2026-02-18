import CaseCatalogPage from '@/components/CaseCatalogPage/CaseCatalogPage';
import { client } from '@/lib/sanity/client';
import { QUERY_CASES_CATALOG } from '@/lib/sanity/query';
import React from 'react'

export const revalidate = 60;

async function fetchCasesCatalogData() {
  return await client.fetch(QUERY_CASES_CATALOG, {
    lang: 'ua'
  });
}

export default async function page() {
  const data = await fetchCasesCatalogData();

  return <CaseCatalogPage data={data} />;
}
