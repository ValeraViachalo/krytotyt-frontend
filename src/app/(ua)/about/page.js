import AboutPage from '@/components/AboutPage/AboutPage'
import React from 'react'

import { client } from '@/lib/sanity/client'
import { QUERY_ABOUT_PAGE } from '@/lib/sanity/query'

export const revalidate = 60;

export default async function page() {
  const data = await client.fetch(QUERY_ABOUT_PAGE, { lang: 'ua' })
  console.log(data);

  return (
    <AboutPage data={data} />
  )
}
