import { Link } from "react-router-dom";
import "../css/Navbar.css";

function NavBar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>EscherWeb</h1>
      </div>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/search" className="nav-link">Search</Link>
        <Link to="/draw" className="nav-link">Draw</Link>
        <Link to="/escher" className="nav-link">Escher</Link>
        <Link to="/gallery" className="nav-link">Gallery</Link>
        <Link to="/about" className="nav-link">About</Link>
      </div>
    </nav>
  );
}

export default NavBar;