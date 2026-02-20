"use client";
import React, { useState } from "react";

import "./FormPopUp.scss";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import clsx from "clsx";

import preparedFormText from "./formData.json";
import Link from "next/link";
import { useFormPopUp } from "./context";
import { AnimatePresence, motion } from "framer-motion";
import { anim, MenuAnim } from "@/lib/helpers/anim";
import { sendEmail } from "@/app/actions";

export default function FormPopUp() {
  const formText = preparedFormText.ua;
  const { isFormOpen, closeForm } = useFormPopUp();

  return (
    <AnimatePresence mode="wait">
      {isFormOpen && (
        <motion.div
          className="form-bg"
          onClick={closeForm}
          key="form-bg"
          {...anim(MenuAnim)}
        />
      )}
      {isFormOpen && (
        <motion.div
          className="form-pop-up-wrapper"
          key="form-popup"
          {...anim(MenuAnim)}
        >
          <div className="form-pop-up">
            <div className="form-pop-up-content">
              <p className="form-pop-up__text">{formText.title}</p>
              <ContactForm formText={formText.form} />
              <div className="contact shadow">
                <p>{formText.phoneSection?.title}</p>
                <Link
                  href={formText.phoneSection?.phone?.href}
                  className="contact__link"
                >
                  {formText.phoneSection?.phone?.text}
                </Link>
              </div>
            </div>

            <button className="form-pop-up__close" onClick={closeForm}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="close-icon"
              >
                <g clip-path="url(#clip0_40000063_10018)">
                  <path
                    d="M33.3333 6.66683H30V10.0002H33.3333V6.66683ZM33.3333 6.66683H36.6667V3.3335H33.3333V6.66683ZM0 40.0002H3.33333V36.6668H0V40.0002ZM3.33333 36.6668H6.66667V33.3335H3.33333V36.6668ZM6.66667 33.3335H10V30.0002H6.66667V33.3335ZM10 30.0002H13.3333V26.6668H10V30.0002ZM13.3333 26.6668H16.6667V23.3335H13.3333V26.6668ZM0 6.66683H3.33333V3.3335H0V6.66683ZM3.33333 10.0002H6.66667V6.66683H3.33333V10.0002ZM6.66667 13.3335H10V10.0002H6.66667V13.3335ZM10 16.6668H13.3333V13.3335H10V16.6668ZM13.3333 20.0002H16.6667V16.6668H13.3333V20.0002ZM16.6667 23.3335H20V20.0002H16.6667V23.3335ZM20 26.6668H23.3333V23.3335H20V26.6668ZM23.3333 30.0002H26.6667V26.6668H23.3333V30.0002ZM26.6667 33.3335H30V30.0002H26.6667V33.3335ZM30 36.6668H33.3333V33.3335H30V36.6668ZM33.3333 40.0002H36.6667V36.6668H33.3333V40.0002ZM20 20.0002H23.3333V16.6668H20V20.0002ZM23.3333 16.6668H26.6667V13.3335H23.3333V16.6668ZM26.6667 13.3335H30V10.0002H26.6667V13.3335Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_40000063_10018">
                    <rect width="40" height="40" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ContactForm = ({ formText }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required(formText?.name?.error),
    email: Yup.string()
      .email(formText?.email?.invalid)
      .required(formText?.email?.error),
    message: Yup.string(),
  });

  const initialValues = { name: "", email: "", message: "" };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    try {
      const result = await sendEmail({
        name: values.name,
        email: values.email,
        message: values.message,
      });

      if (result.success) {
        setSubmitted(true);
        resetForm();
      } else {
        console.error("Email failed:", result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isValid, dirty, errors, touched }) => (
        <Form className="form">
          <div className="form-content">
            <div className="form-row">
              <Field
                name="name"
                placeholder={formText?.name.title}
                className={clsx("input", {
                  "input--error": errors.name && touched.name,
                })}
              />
              <ErrorMessage
                name="name"
                component="div"
                className="input__error"
              />
            </div>

            <div className="form-row">
              <Field
                name="email"
                type="email"
                placeholder={formText?.email?.title}
                className={clsx("input", {
                  "input--error": errors.email && touched.email,
                })}
              />
              <ErrorMessage
                name="email"
                component="div"
                className="input__error"
              />
            </div>

            <div className="form-row">
              <Field
                name="message"
                as="textarea"
                rows="4"
                placeholder={formText?.message?.title}
                className={clsx("textarea", {
                  "textarea--error": errors.message && touched.message,
                })}
              />
              <ErrorMessage
                name="message"
                component="div"
                className="input__error"
              />
            </div>
          </div>

          <button
            type="submit"
            className={clsx("button form-button", {
              "form-button--disabled": !isValid || !dirty || loading,
            })}
            disabled={!isValid || !dirty || loading}
          >
            {formText?.button}
          </button>

            {submitted && (
              <div className="form-submitted">
                <p>Дякуємо! Ваше повідомлення надіслано.</p>
              </div>
            )}
        </Form>
      )}
    </Formik>
  );
};
