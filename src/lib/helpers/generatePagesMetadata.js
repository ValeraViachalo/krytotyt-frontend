import { defaultMetadata } from "./defaultMetadata";

export async function generatePagesMetadata(seoData) {
  const data = seoData || defaultMetadata;

  const pageTitle = data.pageTitle;
  const metaTitle = data.metaTitle;
  const metaDescription = data.metaDescription;
  const keywords = Array.isArray(data.keywords) ? data.keywords.join(", ") : data.keywords;
  const openGraphImage = data.openGraphImage;

  return {
    title: pageTitle,
    keywords: keywords,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: "",
      images: [
        {
          url: openGraphImage,
          width: 720,
          height: 405,
          alt: "OpenGraph",
        },
      ],
    },
  };
}
