import ServicesPage from '@/components/ServicesPage/ServicesPage'
import { client } from '@/lib/sanity/client'
import { QUERY_SERVICES_PAGE } from '@/lib/sanity/query'
import React from 'react'

export const revalidate = 60;

export default async function page() {
  const data = await client.fetch(QUERY_SERVICES_PAGE, { lang: 'ua' });
  
  console.log(data);
  

  return (
    <ServicesPage data={data} />
  )
}
