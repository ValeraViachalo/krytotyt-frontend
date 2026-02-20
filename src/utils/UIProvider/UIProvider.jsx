import React from "react";
import Header from "../Header/Header";
import FormPopUp from "../FormPopUp/FormPopUp";
import { FormPopUpProvider } from "../FormPopUp/context";

export default function UIProvider({ children, locale = "ua" }) {
  return (
    <FormPopUpProvider>
      <Header locale={locale} />
      <FormPopUp />
      {children}
    </FormPopUpProvider>
  );
}
