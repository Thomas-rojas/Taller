import Hero from "../src/components/sections/Hero";
import Nav from "../src/components/layout/Nav";
import SeccionServicios from "@/src/components/sections/Servicios";
import Testimonios from "@/src/components/sections/Testimonios";
import Galeria from "@/src/components/sections/Galeria";
import ContactPage from "@/src/components/sections/Contactos";
import Footer from "@/src/components/sections/info";
import ChatWidget from "@/src/components/layout/QuickReplies";

export default function Home() {
  return (
    <main className="bg-white text-[#111111]">
      <Nav />
      <div id="inicio">
        <Hero />
      </div>
      <div id="servicios">
        <SeccionServicios />
      </div>
      <div id="testimonios">
        <Testimonios />
      </div>
      <div id="galeria">
        <Galeria />
      </div>
      <div id="contacto">
        <ContactPage />
      </div>
      <Footer />
      <ChatWidget />
    </main>
  );
}
