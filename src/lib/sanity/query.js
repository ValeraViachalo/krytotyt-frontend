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

export const QUERY_PRIVACY_PAGE = `
*[_type == "privacyPolicy"][0]{
  "title": coalesce(title[$lang], title.ua),
  "content": coalesce(text[$lang], text.ua)
}
`;

export const QUERY_SERVICES_PAGE = `
{
"list": *[_type == "service"]|order(coalesce(name[$lang], name.ua) asc){
  _id,
  "name": coalesce(name[$lang], name.ua),
  "slug": slug.current,
  // If service.list stores references to serviceItem
  list[]->{
    _id,
    "name": coalesce(itemName[$lang], itemName.ua),
    "slug": slug.current
  }
}
}`

export const QUERY_ABOUT_PAGE = `
*[_type == "about" && _id == "about"][0]{
  "team": team{
      "list": list[]{
        "image":    image.asset->url,
        "name":     coalesce(name[$lang], name.ua),
        "position": coalesce(position[$lang], position.ua),
        "text":     coalesce(text[$lang], text.ua)     // Portable Text array
      }
    },

    "about": about{
      "title": coalesce(title[$lang], title.ua),
      "text":  coalesce(text[$lang], text.ua)          // Portable Text array
    },

    "services": services{
      "title": coalesce(title[$lang], title.ua),
      "text":  coalesce(text[$lang], text.ua),
      "button": button{
        "text": coalesce(text[$lang], text.ua),
        "href": href
      },
      "list": list[]{"text": coalesce(text[$lang], text.ua)}
    },

    "howItWorks": howItWorks{
      "title":      coalesce(title[$lang], title.ua),
      "text":       coalesce(text[$lang], text.ua),      // Portable Text array
      "list": list[]{
        "icon":  icon.asset->url,
        "title": coalesce(title[$lang], title.ua)
      },
      "bottomText": coalesce(bottomText[$lang], bottomText.ua) // Portable Text array
    },

    "footer": footer{
      "title":      coalesce(title[$lang], title.ua),
      "text":       coalesce(text[$lang], text.ua),      // Portable Text array
      "buttonToUp": coalesce(buttonToUp[$lang], buttonToUp.ua)
    }
  }
`;
