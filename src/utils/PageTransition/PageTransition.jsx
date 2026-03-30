"use client";
import { usePathname } from "next/navigation";
import "./PageTransition.scss";

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <div className="page-transition" key={pathname}>
      {children}
    </div>
  );
}
