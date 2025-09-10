import logo from "../images/logo-rituels_d_ebene.jpg";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaUser, FaCaretDown } from "react-icons/fa";
import "../css/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* Logo à gauche */}
      <div className="nav-left">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Liens principaux centrés */}
      <div className="nav-links">
        <Link to="/">Accueil</Link>

        <div className="dropdown">
          <button className="dropdown-btn">
            Boutique <FaCaretDown style={{ marginLeft: "5px" }} />
          </button>
          <div className="dropdown-content">
            <Link to="/boutique/plantes-brutes">Plantes brutes</Link>
            <Link to="/boutique/tisanes">Tisanes (sachets)</Link>
            <Link to="/boutique/poudres">Poudres</Link>
            <Link to="/ebooks/histoires-vraies">Histoires vraies</Link>
          </div>
        </div>

        <div className="dropdown">
          <button className="dropdown-btn">
            E-books <FaCaretDown style={{ marginLeft: "5px" }} />
          </button>
          <div className="dropdown-content">
            <Link to="/ebooks/plantes-bienfaits">Plantes & Bienfaits</Link>
          </div>
        </div>

        <div className="dropdown">
          <button className="dropdown-btn">
            FAQ <FaCaretDown style={{ marginLeft: "5px" }} />
          </button>
          <div className="dropdown-content">
            <Link to="/faq/questions-generales">Questions générales</Link>
            <Link to="/faq/paiement-livraison">Paiement & Livraison</Link>
          </div>
        </div>

        <Link to="/contact">Contact</Link>
      </div>

      {/* Icônes à droite */}
      <div className="nav-icons">
        <Link to="/compte" className="icon-link" aria-label="Compte">
          <FaUser size={24} />
          <span style={{ marginLeft: "6px" }}>Se connecter</span>
        </Link>
        <Link to="/panier" className="icon-link" aria-label="Panier">
          <FaShoppingCart size={24} />
          <span style={{ marginLeft: "6px" }}>Mon panier</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
