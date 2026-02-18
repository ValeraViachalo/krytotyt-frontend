import React from "react";

import "./CatalogList.scss";
import Link from "next/link";

export default function CatalogList({ data }) {
  // console.log("CatalogList data:", data);
  
  return (
    <section className="catalog-list container">
      {data &&
        [...data, ...data, ...data, ...data, ...data].map((item, index) => <CatalogItem key={index} item={item} />)}
    </section>
  );
}

const CatalogItem = ({ item }) => (
  <Link href={`/cases/${item?.slug}`} className="catalog-item">
    {console.log("CatalogItem item:", item)}
    {item?.images?.map((image, index) => (
      <img
        key={index}
        src={image?.imageUrl}
        alt={`${item?.name}-${index}`}
        className="catalog-item__image"
      />
    ))}
  </Link>
);
