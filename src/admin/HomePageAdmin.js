// Administration.js
import React, { useEffect, useState } from "react";
import "../css/admin/HomePageAdmin.css";
import produitImage from "../icones/stock.png";
import { useNavigate } from "react-router-dom";

function Administration() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleProductsClick = () => {
    navigate("/liste-produits");
  };

  useEffect(() => {
    if (!token) {
      navigate("/connexion");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:3001/manage-portal", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          // Token invalide ou rôle non-admin
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/connexion");
          return;
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
        setMessage("Erreur serveur");
      }
    };

    fetchUsers();
  }, [token, navigate]);

  return (
    <div className="administration">
      <h1>Administration</h1>

      <div className="card">
        <div className="image-container">
          <img
            src={produitImage}
            style={{ width: "100px", height: "100px" }}
            onClick={handleProductsClick}
          />
        </div>
        <p>Produits</p>
      </div>

      {message && <p>{message}</p>}

    </div>
  );
}

export default Administration;
