// Administration.js
import React, { useEffect, useState } from "react";
import "../css/admin/HomePageAdmin.css";
import produitImage from "../icones/stock.png";
import { useNavigate } from "react-router-dom";
import config from "../config.js";

function Administration() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleProductsClick = () => {
    navigate("/liste-produits");
  };

  const handleCommandeClick = () => {
    navigate("/liste-commandes");
  };

  useEffect(() => {
    if (!token) {
      navigate("/connexion");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/manage-portal`, {
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
      }
    };

    fetchUsers();
  }, [token, navigate]);

  return (
    <div className="administration">
      <h1>Administration</h1>
      <div className="cards-row">
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
        <div className="card">
          <div className="">
            <img
              src={produitImage}
              style={{ width: "100px", height: "100px" }}
              onClick={handleCommandeClick}
            />
          </div>
          <p>Commandes</p>
        </div>
      </div>
    </div>
  );
}

export default Administration;
