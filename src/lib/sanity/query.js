export const QUERY_CASES_CATALOG = `
{
  "list": *[_type == "projectDetails"]{
    _id,
    "name": coalesce(name[$lang], name.ua),
    "slug": slug.current,
    "projectType":{
      "name": coalesce(projectType->name[$lang], projectType->name.ua),
      "slug": projectType->slug.current
    },
    images[]{
      "imageUrl": image.asset->url,
      showForCatalog
    }[showForCatalog == true]
  },
  "projectTypes": *[_type == "projectType"]{
    _id,
    "name": coalesce(name[$lang], name.ua),
    "slug": slug.current
  }
}
`;

export const QUERY_CASES_DETAILS = `
*[_type == "projectDetails" && slug.current == $slug][0]{
  _id,
  "name": coalesce(name[$lang], name.ua),
  "slug": slug.current,
  "text": coalesce(text[$lang], text.ua),
  projectType->{
    _id,
    "name": coalesce(name[$lang], name.ua),
    "slug": slug.current
  },
  services[]->{
    _id,
    "name": coalesce(itemName[$lang], itemName.ua),
    "slug": slug.current,
    service->{
      _id,
      "name": coalesce(name[$lang], name.ua),
      "slug": slug.current
    }
  },
  images[]{
    "imageUrl": image.asset->url,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
    showForCatalog
  }
}
  `;
