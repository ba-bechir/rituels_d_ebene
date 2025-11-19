import "./App.css";
import Navbar from "./components/Navbar.js";
import AdminNavbar from "./components/AdminNavbar.js";
import Footer from "./components/Footer.js";
import { Routes, Route, useLocation } from "react-router-dom";
import Connexion from "./forms/connexion.js";
import ManagePortal from "./components/ManagePortal.js";
import AdminRoute from "./admin/AdminRoute.js";
import ProductList from "./admin/products/ProductList.js";
import PlantesBrutes from "./boutique/PlantesBrutes.js";
import PlantesBrutesDetails from "./boutique/PlantesBrutesDetails.js";
import Tisanes from "./boutique/Tisanes.js";
import TisanesDetails from "./boutique/TisanesDetails.js";
import Poudres from "./boutique/Poudres.js";
import PoudresDetails from "./boutique/PoudresDetails.js";
import Inscription from "./forms/Inscription.js";
import ConfirmAccount from "./components/ConfirmAccount.js";
import Panier from "./boutique/Panier.js";
import ProtectedRoute from "./ProtectedRoute.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Payment from "./boutique/Payment.js";
import "leaflet/dist/leaflet.css";
import ConfirmationPage from "./boutique/ConfirmationPage.js";
import CommandeList from "./admin/orders/CommandeList.js";

function App() {
  const location = useLocation();

  // Chemins pour navbar admin et navbar classiques
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
        <Route path="/boutique/tisanes" element={<Tisanes />} />
        <Route path="/boutique/poudres" element={<Poudres />} />
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
        <Route path="/register" element={<Inscription />} />
        <Route path="/panier" element={<Panier />} />
        <Route path="/confirm/:token" element={<ConfirmAccount />} />

        {/* Détail produit */}
        <Route
          path="/boutique/plantes-brutes/produit/:id"
          element={<PlantesBrutesDetails />}
        />
        <Route
          path="/boutique/tisanes/produit/:id"
          element={<TisanesDetails />}
        />
        <Route
          path="/boutique/poudres/produit/:id"
          element={<PoudresDetails />}
        />

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

        <Route
          path="/liste-commandes"
          element={
            <AdminRoute>
              <CommandeList />
            </AdminRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute requiredRole="client">
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/confirmation"
          element={
            <ProtectedRoute requiredRole="client">
              <ConfirmationPage />
            </ProtectedRoute>
          }
        />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />

      <Footer />
    </div>
  );
}

export default App;
