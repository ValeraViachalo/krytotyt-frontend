"use client";
import React from "react";
import { motion } from "framer-motion";

export const Content = ({ url, ...rest }) => {
  const isVideo = url.match(/\.(mp4|webm)$/) != null;

  return isVideo ? (
    <motion.video
      loop
      muted
      autoPlay
      webkit-playsinline="true"
      playsInline
      {...rest}
      loading="lazy"
      width="100%"
      height="100%"
    >
      <source src={url} />
    </motion.video>
  ) : (
    <motion.img src={url} width="100%" height="100%" {...rest} loading="lazy" />
  );
};
