import React from 'react'
import CatalogList from './CatalogList/CatalogList'

export default function CaseCatalogPage({ data }) {
  console.log(data.projectTypes);
  
  return (
    <main className="case-catalog page--white">
      <CatalogList data={data} />
    </main>
  )
}
