import "./App.css";
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import Footer from "./components/Footer";
import { Routes, Route, useLocation } from "react-router-dom";
import Connexion from "./forms/connexion";
import ManagePortal from "./components/ManagePortal";
import AdminRoute from "./admin/AdminRoute.js";
import ProductList from "./admin/products/ProductList.js";
import PlantesBrutes from "./boutique/PlantesBrutes.js";

function App() {
  const location = useLocation();

  // Chemins pour navbar admin et navbar classique
  const adminNavbarPaths = [
    "/manage-portal",
    "/liste-produits",
    "/utilisateurs",
  ];

  const showAdminNavbar = adminNavbarPaths.includes(location.pathname);
  const showNavbar = !showAdminNavbar;

  return (
    <div className="app-container">
      {showNavbar && <Navbar />}
      {showAdminNavbar && <AdminNavbar />}

      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<h1>Bientôt</h1>} />
        <Route path="/boutique" element={<h1>Boutique</h1>} />
        <Route path="/boutique/plantes-brutes" element={<PlantesBrutes />} />
        <Route path="/boutique/tisanes" element={<h1>Tisanes</h1>} />
        <Route path="/boutique/poudres" element={<h1>Poudres</h1>} />
        <Route
          path="/ebooks/plantes-bienfaits"
          element={<h1>Plantes bienfaits</h1>}
        />
        <Route
          path="/ebooks/histoires-vraies"
          element={<h1>Histoires vraies</h1>}
        />
        <Route
          path="/faq/questions-generales"
          element={<h1>Questions générales</h1>}
        />
        <Route
          path="/faq/paiement-livraison"
          element={<h1>Paiement & livraison</h1>}
        />
        <Route path="/contact" element={<h1>Contact</h1>} />
        <Route path="/compte" element={<Connexion />} />
        <Route path="/panier" element={<h1>Panier</h1>} />

        {/* Pages admin protégées */}
        <Route
          path="/manage-portal"
          element={
            <AdminRoute>
              <ManagePortal />
            </AdminRoute>
          }
        />

        <Route
          path="/liste-produits"
          element={
            <AdminRoute>
              <ProductList />
            </AdminRoute>
          }
        />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
