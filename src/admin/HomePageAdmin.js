// Administration.js
import React from "react";
import "../css/admin/HomePageAdmin.css";
import produitImage from "../icones/stock.png"; // ton image
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'; 

function Administration() {

  const navigate = useNavigate();

/*  const handleProductsClick = () => {
    navigate("/liste-produits");
  }; */

  return (
    <div className="administration">
      <h1>Administration</h1>
      <div className="card" >
        <div className="image-container">
          <img src={produitImage} style={{ width: "100px", height: "100px" }} />
        </div>
        <p>Produits</p>
      </div>
    </div>
  );
}

export default Administration;
