"use client";

import { createContext, useContext, useState } from "react";

export const FormPopUpContext = createContext({
  isFormOpen: false,
  openForm: () => {},
  closeForm: () => {},
  toggleForm: () => {},
});

export const FormPopUpProvider = ({ children }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);
  const toggleForm = () => setIsFormOpen((prev) => !prev);

  return (
    <FormPopUpContext.Provider value={{ isFormOpen, openForm, closeForm, toggleForm }}>
      {children}
    </FormPopUpContext.Provider>
  );
};

export const useFormPopUp = () => useContext(FormPopUpContext);
