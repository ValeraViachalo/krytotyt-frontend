import React from 'react'
import Team from './Team/Team'
import Sections from './Sections/Sections'

export default function AboutPage({ data }) {
  return (
    <main className="about-page page--black" id='about'>
      <Team data={data.team} />
      <Sections data={data} />
    </main>
  )
}
