import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser, FaCaretDown } from "react-icons/fa";
import logo from "../images/logo-rituels_d_ebene.jpg";
import "../css/Navbar.css";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Fonction pour vérifier l'état de connexion
  const checkAuthStatus = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!(token && role));
  };

  useEffect(() => {
    // Vérification initiale au chargement du composant
    checkAuthStatus();

    // Écouter les changements de localStorage (pour onglets multiples)
    window.addEventListener("storage", checkAuthStatus);

    // Écouter les changements lors du focus de la fenêtre
    window.addEventListener("focus", checkAuthStatus);

    // Vérifier périodiquement (optionnel, pour être sûr)
    const interval = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener("storage", checkAuthStatus);
      window.removeEventListener("focus", checkAuthStatus);
      clearInterval(interval);
    };
  }, []);

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("panier");
    setIsLoggedIn(false);
    navigate("/connexion");
  };

  return (
    <nav className="navbar">
      {/* Logo à gauche */}
      <div className="nav-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
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
        <Link to="/panier" className="icon-link" aria-label="Panier">
          <FaShoppingCart size={24} />
          <span style={{ marginLeft: "6px" }}>Mon panier</span>
        </Link>
        {isLoggedIn ? (
          // Utilisateur connecté
          <button
            onClick={handleLogout}
            className="logout-btn"
            aria-label="Se déconnecter"
          >
            <FaUser size={24} />
            <span style={{ marginLeft: "6px" }}>Se déconnecter</span>
          </button>
        ) : (
          // Utilisateur non connecté
          <Link to="/compte" className="icon-link" aria-label="Compte">
            <FaUser size={24} />
            <span style={{ marginLeft: "6px" }}>Se connecter</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
