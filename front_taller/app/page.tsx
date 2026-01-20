import Hero from "../src/components/sections/Hero";
import Nav from "../src/components/layout/Nav";
import Nosotros from "../src/components/sections/Nosotros";
import SeccionServicios from "@/src/components/sections/Servicios";
import PorQueConfiar from "@/src/components/sections/Confiar";
import Galeria from "@/src/components/sections/Galeria";
import ContactPage from "@/src/components/sections/Contactos";
import Footer from "@/src/components/sections/info";
import  ChatWidget from "@/src/components/layout/QuickReplies";
export default function Home() {
  return (
    <>
    <main>
    <Nav />
    <div id="inicio">
      <Hero/>
    </div>
    <div id="nosotros">
      <Nosotros/>
    </div>
     <PorQueConfiar />
    <div id="servicios">
    <SeccionServicios />
    </div>
    <div id="galeria">
    <Galeria />
    </div>
    <div id="contacto">
    <ContactPage />
    </div>  
    <Footer />
    <div>
    <ChatWidget />
    </div>
   
    </main>
    </>
  );
}