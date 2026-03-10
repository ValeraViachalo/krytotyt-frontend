import HomePage from '@/components/HomePage/HomePage'
import { client } from '@/lib/sanity/client';
import { QUERY_CASES_CATALOG } from '@/lib/sanity/query';
import React from 'react'

async function fetchHomePageData() {
  return await client.fetch(QUERY_CASES_CATALOG, {
    lang: 'ua'
  });
}


export default async function page() {
  const data = await fetchHomePageData();
  return (
    <HomePage data={data} />
  )
}
