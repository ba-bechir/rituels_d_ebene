import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import config from "../config.js";
import "../css/boutique/PlantesBrutes.css"; // importer le fichier CSS

export default function PlantesBrutes() {
  const [produits, setProduits] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/plantes-brutes`,
          {
            // headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setProduits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduits();
  }, [token]);

  return (
    <div className="plantes-container">
      <div className="plantes-grid">
        {Array.isArray(produits) &&
          produits.map((produit) => {
            const isHovered = hoveredId === produit.id;

            return (
              <div
                key={produit.id}
                className={`produit-card ${
                  isHovered ? "hovered" : "not-hovered"
                }`}
                onMouseEnter={() => setHoveredId(produit.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Badge */}
                {produit.badge && (
                  <div
                    className={`produit-badge ${
                      produit.badge === "NEW"
                        ? "produit-badge-new"
                        : "produit-badge-other"
                    }`}
                  >
                    {produit.badge}
                  </div>
                )}

                {/* Image cliquable vers détail */}
                <Link
                  to={`/boutique/plantes-brutes/produit/${produit.id}`}
                  className="produit-image-container"
                >
                  <img
                    src={`data:image/jpeg;base64,${produit.image}`}
                    alt={produit.nom_produit}
                    className="produit-image"
                    style={{
                      transform: isHovered ? "scale(1.07)" : "scale(1)",
                    }}
                  />
                </Link>

                {/* Nom du produit sous l'image */}
                <div className="produit-name">{produit.nom_produit}</div>

                {/* Description, prix, unité et bouton */}
                <div className="produit-footer">
                  <div
                    className="produit-description"
                    dangerouslySetInnerHTML={{ __html: produit.description }}
                  />

                  {/* Conteneur prix et unité au-dessus du sélecteur quantité */}
                  <div className="prix-unite-container">
                    <span>{produit.prix ? `${produit.prix} €` : "-"}</span>
                    <span>
                      {produit.quantite_en_g
                        ? `${produit.quantite_en_g} g`
                        : ""}
                    </span>
                  </div>

                  {/* Sélecteur quantité + bouton */}
                  <div className="quantite-select-container">
                    <select className="select-quantite" defaultValue={1}>
                      {[...Array(10).keys()].map((n) => (
                        <option key={n + 1} value={n + 1}>
                          {n + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      className={`button-ajouter ${
                        isHovered ? "button-hovered" : "button-not-hovered"
                      }`}
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
