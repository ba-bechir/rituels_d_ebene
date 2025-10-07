import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/Connexion.css";
import logo from "../images/logo-rituels_d_ebene.jpg";
import config from "../config.js";
import { toast } from "react-toastify";

const Connexion = () => {
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectFrom = params.get("from");

  // Fonction pour synchroniser le panier local avec la base
  async function syncCartToBackend(userId, token) {
    const panierLocal = JSON.parse(localStorage.getItem("panier")) || [];
    try {
      const response = await fetch(`${config.apiUrl}/cart/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ panier: panierLocal, email }),
      });
      if (!response.ok) throw new Error("Erreur synchronisation panier");
      const data = await response.json();
      localStorage.setItem("panier", JSON.stringify(data.panier));
    } catch (error) {
      console.error("Erreur sync panier:", error);
      toast.error("Erreur lors de la synchronisation du panier.");
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mdp }),
      });
      if (!response.ok) {
        const err = await response.json();
        setMessage(err.message || "Erreur lors de la connexion");
        return;
      }
      const data = await response.json();
      if (!data.role || !data.token || !data.userId) {
        setMessage("Réponse serveur invalide");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      await syncCartToBackend(data.userId, data.token);

      const roleNormalized = data.role.trim().toLowerCase();
      if (roleNormalized === "admin") {
        navigate("/manage-portal");
      } else if (roleNormalized === "client") {
        if (redirectFrom === "checkout") {
          navigate("/checkout");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    } catch (error) {
      setMessage("Erreur réseau ou serveur");
      console.error(error);
    }
  };

  return (
    <div className="connexion-container">
      <img src={logo} alt="Logo" className="logo" />
      <h1 className="connexion-title">Connexion</h1>
      <form onSubmit={handleSubmitForm}>
        <div>
          <label htmlFor="email" className="connexion-label">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="connexion-input"
          />
        </div>
        <div>
          <label htmlFor="mdp" className="connexion-label">
            Mot de passe
          </label>
          <input
            id="mdp"
            type="password"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
            required
            className="connexion-input"
          />
        </div>
        <button type="submit" className="connexion-button">
          Valider
        </button>
      </form>
      {message && <p className="connexion-message">{message}</p>}
      <div className="create-account-container">
        <p className="new-client-text">Nouveau client ?</p>
        <button
          className="connexion-button create-account-button"
          onClick={() => navigate("/register")}
        >
          Créer un compte
        </button>
      </div>
    </div>
  );
};

export default Connexion;
