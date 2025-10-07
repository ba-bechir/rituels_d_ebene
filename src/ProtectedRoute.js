import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();

  if (!token) {
    // Pas connecté : redirection vers la page de login
    return <Navigate to="/compte?from=checkout" replace />;
  }
  if (requiredRole && role !== requiredRole) {
    // Mauvais rôle : redirection vers l'accueil ou page refus
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
