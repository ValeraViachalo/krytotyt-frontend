import AboutPopup from "./AboutPopup/AboutPopup";
import CablesControls from "./CablesControls/CablesControls";
import "./HomePage.scss";

export default function HomePage({ data }) {
  return (
    <main className="home">
      <section className="home__canvas-section" />

      <AboutPopup data={data} />
      <CablesControls />
    </main>
  );
}
