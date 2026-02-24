import { ease } from "./ease";

export const anim = (variants) => {
  return {
    initial: "initial",
    animate: "animate",
    exit: "exit",
    variants,
  };
};

export const MenuAnim = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const PopUpFadeInAnim = {
  initial: {
    opacity: 0,
    filter: "blur(5px)",
  },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: ease.outExpo,
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(5px)",
    transition: {
      duration: 0.7,
      ease: ease.outExpo,
    },
  },
};

export const logoAnim = {
  initial: {
    width: 0,
    opacity: 0,
  },
  animate: {
    width: "auto",
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.15,
      ease: ease.inOutExpo,
      opacity: { delay: 0.6, duration: 0.3 },
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: {
      opacity: { duration: 0.3 },
      width: {
        duration: 0.5,
        delay: 0.15,
        ease: ease.inOutExpo,
      },
    },
  },
};
