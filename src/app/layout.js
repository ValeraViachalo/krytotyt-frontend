import localFont from "next/font/local";
import "@/styles/reset.scss";
import { defaultMetadata } from "@/lib/helpers/defaultMetadata";
import { AudioProvider } from "@/lib/providers/AudioContext/AudioContext";
import Loader from "@/utils/Loader/Loader";
import { Analytics } from "@vercel/analytics/next"

const neueHaasDisplay = localFont({
  src: [
    {
      path: "./fonts/KTFPrima-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-ktf-prima",
});

export const metadata = defaultMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="html">
      <body className={`${neueHaasDisplay.variable} body`}>
        <AudioProvider>
          <Loader />
          {children}
        </AudioProvider>
        <Analytics />
      </body>
    </html>
  );
}
