import AboutPage from '@/components/AboutPage/AboutPage'
import React from 'react'

import aboutData from '@/app/preparedData/aboutData.json'
import { client } from '@/lib/sanity/client'
import { QUERY_ABOUT_PAGE } from '@/lib/sanity/query'

export default async function page() {
  const data = await client.fetch(QUERY_ABOUT_PAGE, { lang: 'ua' })
  console.log(data);
  

  return (
    <AboutPage data={data} />
  )
}
