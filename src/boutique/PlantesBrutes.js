import { useEffect, useState } from "react";
import config from '../config.js';


export default function PlantesBrutes() {
  const [produits, setProduits] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/plantes-brutes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProduits(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduits();
  }, [token]);

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 233px)",
          gap: "20px",
          justifyContent: "center",
        }}
      >
        {produits.map((produit) => {
          const isHovered = hoveredId === produit.id;

          return (
            <div
              key={produit.id}
              style={{
                width: "233px",
                height: "403px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px",
                backgroundColor: "#fff",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                boxShadow: isHovered
                  ? "0 6px 16px rgba(0,0,0,0.15)"
                  : "0 3px 6px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={() => setHoveredId(produit.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Badge */}
              {produit.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    backgroundColor:
                      produit.badge === "NEW" ? "#cfae5d" : "#e91e63",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {produit.badge}
                </div>
              )}

              {/* Image */}
              <div
                style={{
                  width: "160px",
                  height: "132px",
                  margin: "20px auto 4px", // petit espace pour le nom
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#fafafa",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={`data:image/jpeg;base64,${produit.image}`}
                  alt={produit.nom_produit}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                    transform: isHovered ? "scale(1.07)" : "scale(1)",
                  }}
                />
              </div>

              {/* Nom du produit sous l'image */}
              <div
                style={{
                  width: "160px", // même largeur que l'image
                  margin: "0 auto 12px", // centré horizontalement, espace en dessous
                  textAlign: "left", // aligné à gauche
                  fontWeight: "600",
                  fontSize: "15px",
                  color: "#333",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {produit.nom_produit}
              </div>

              {/* Description et bouton */}
              <div
                style={{
                  padding: "0 12px 12px",
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    height: "40px",
                    overflow: "hidden",
                    marginBottom: "10px",
                    lineHeight: "1.3",
                  }}
                >
                  {produit.description}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    overflow: "hidden",
                    height: "38px",
                    backgroundColor: "#fff",
                    width: "100%",
                  }}
                >
                  <select
                    style={{
                      width: "28%",
                      border: "none",
                      outline: "none",
                      padding: "0 6px",
                      fontSize: "13px",
                      cursor: "pointer",
                      backgroundColor: "#f7f7f7",
                      color: "#444",
                      borderRight: "1px solid #ddd",
                    }}
                    defaultValue={1}
                  >
                    {[...Array(10).keys()].map((n) => (
                      <option key={n + 1} value={n + 1}>
                        {n + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    style={{
                      flex: 1,
                      border: "none",
                      background: isHovered ? "rgba(110, 118, 77)" : "#b4845e",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      transition: "background 0.3s ease",
                    }}
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
