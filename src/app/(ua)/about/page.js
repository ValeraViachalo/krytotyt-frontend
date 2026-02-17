import AboutPage from '@/components/AboutPage/AboutPage'
import React from 'react'

import aboutData from '@/app/preparedData/aboutData.json'

export default function page() {
  return (
    <AboutPage data={aboutData} />
  )
}
