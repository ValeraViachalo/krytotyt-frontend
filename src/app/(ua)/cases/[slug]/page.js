import CaseDetails from '@/components/CaseDetails/CaseDetails'
import { client } from '@/lib/sanity/client';
import { QUERY_CASES_DETAILS } from '@/lib/sanity/query';
import { notFound } from 'next/navigation';

export const revalidate = 60;

async function fetchCaseData({ slug }) {
  return await client.fetch(QUERY_CASES_DETAILS, {
    lang: 'ua',
    slug
  });
}

export default async function page({ params }) {
  const data = await fetchCaseData({ slug: params.slug });

  if (!data) {
    return notFound();
  }

  return <CaseDetails data={data} />
}
