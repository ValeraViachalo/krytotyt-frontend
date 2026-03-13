import React from "react";
import Header from "../Header/Header";
import FormPopUp from "../FormPopUp/FormPopUp";
import { FormPopUpProvider } from "../FormPopUp/context";
import { client } from "@/lib/sanity/client";
import { QUERY_HEADER } from "@/lib/sanity/query";

export default async function UIProvider({ children, locale = "ua" }) {
  const headerData = await client.fetch(QUERY_HEADER, { lang: locale });

  return (
    <FormPopUpProvider>
      <Header locale={locale} headerData={headerData} />
      <FormPopUp />
      {children}
    </FormPopUpProvider>
  );
}
