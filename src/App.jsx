import "./css/App.css";
import Wallpaper from "./pages/Home";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Search from "./pages/Search";
import Draw from "./pages/Draw";
import Escher from "./pages/Escher";
import NavBar from "./components/NavBar";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Wallpaper />} />
          <Route path="/search" element={<Search />} />
          <Route path="/draw" element={<Draw />} />
          <Route path="/escher" element={<Escher />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
