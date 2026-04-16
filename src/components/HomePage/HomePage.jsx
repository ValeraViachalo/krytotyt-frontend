import AboutPopup from "./AboutPopup/AboutPopup";
import "./HomePage.scss";

export default function HomePage({ data }) {
  return (
    <main className="home">
      <section className="home__canvas-section" />

      <AboutPopup data={data} />
    </main>
  );
}
