import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import config from "../../config.js";

export default function CommandeDetails() {
  const { id } = useParams();
  const [produitsCommande, setProduitsCommande] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(true);

  function formatPrice(price) {
    const num = Number(price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  }

  useEffect(() => {
    async function fetchProduits() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.apiUrl}/details-commande/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Erreur chargement produits");
        const data = await res.json();
        setProduitsCommande(data);
      } catch {
        setProduitsCommande([]);
      } finally {
        setLoadingProduits(false);
      }
    }
    fetchProduits();
  }, [id]);

  if (loadingProduits) return <p>Chargement des produits...</p>;
  if (produitsCommande.length === 0)
    return <p>Aucun produit pour cette commande.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
      <h3
        style={{
          textAlign: "center",
          marginBottom: 30,
          fontWeight: "bold",
          fontSize: 24,
        }}
      >
        Détails de la commande #{id}
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 12px",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f5f7fa" }}>
            {["Produit", "Quantité", "Prix unitaire", "Prix total"].map(
              (title) => (
                <th
                  key={title}
                  style={{
                    padding: "14px 20px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 16,
                    color: "#333",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  {title}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {produitsCommande.map((prod, idx) => (
            <tr
              key={prod.id_commande + "-" + idx}
              style={{
                transition: "background-color 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f9fafb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <td style={{ padding: "12px 20px", fontSize: 15, color: "#222" }}>
                {prod.nom_produit || prod.id_produit}
              </td>
              <td style={{ padding: "12px 20px", fontSize: 15, color: "#555" }}>
                {prod.quantite}
              </td>
              <td style={{ padding: "12px 20px", fontSize: 15, color: "#555" }}>
                {(Number(prod.prix_unitaire) || 0).toFixed(2)} €
              </td>
              <td
                style={{
                  padding: "12px 20px",
                  fontSize: 15,
                  fontWeight: "bold",
                  color: "#111",
                }}
              >
                {(prod.quantite * prod.prix_unitaire).toFixed(2)} €
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
