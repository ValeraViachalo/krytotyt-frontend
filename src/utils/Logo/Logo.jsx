import Image from "next/image";

export const Logo = ({ ...rest }) => (
  <Image
    src="/assets/logo.svg"
    alt="logo"
    style={{ objectFit: "contain" }}
    width={103}
    height={40}
    {...rest}
  />
);
