import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../css/boutique/Product.module.css";

export default function PlantesBrutes() {
  const [produits, setProduits] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [quantites, setQuantites] = useState({});

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
        console.log("plantes Brutes:", data); // <-- ici
        setProduits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduits();
  }, [token]);

  const handleAddToCart = (produit) => {
    const quantite = quantites[produit.id] || 1;
    // Logique ajout panier à implémenter ici
    console.log(
      `Ajouter ${quantite} unités de ${produit.nom_produit} au panier.`
    );
  };

  return (
    <div className={styles["plantes-container"]}>
      <div className={styles["plantes-grid"]}>
        {Array.isArray(produits) &&
          produits.map((produit) => {
            const isHovered = hoveredId === produit.id;
            const maxQuantite = produit.quantite_stock;

            return (
              <div
                key={produit.id}
                className={`${styles["produit-card"]} ${
                  isHovered ? styles.hovered : styles["not-hovered"]
                }`}
                onMouseEnter={() => setHoveredId(produit.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {produit.badge && (
                  <div
                    className={`${styles["produit-badge"]} ${
                      produit.badge === "NEW"
                        ? styles["produit-badge-new"]
                        : styles["produit-badge-other"]
                    }`}
                  >
                    {produit.badge}
                  </div>
                )}

                <Link
                  to={`/boutique/plantes-brutes/produit/${produit.id}`}
                  className={styles["produit-image-container"]}
                >
                  <img
                    src={`data:image/jpeg;base64,${produit.image}`}
                    alt={produit.nom_produit}
                    className={styles["produit-image"]}
                    style={{
                      transform: isHovered ? "scale(1.07)" : "scale(1)",
                    }}
                  />
                </Link>

                <div className={styles["produit-name"]}>
                  {produit.nom_produit}
                </div>

                <div className={styles["produit-footer"]}>
                  <div
                    className={styles["produit-description"]}
                    dangerouslySetInnerHTML={{ __html: produit.description }}
                  />

                  <div className={styles["prix-unite-container"]}>
                    <span>{produit.prix ? `${produit.prix} €` : "-"}</span>
                    <span>
                      {produit.quantite_en_g
                        ? `${produit.quantite_en_g} g`
                        : ""}
                    </span>
                  </div>

                  <div className={styles["quantite-select-container"]}>
                    <select
                      className={styles["select-quantite"]}
                      value={quantites[produit.id] || 1}
                      onChange={(e) =>
                        setQuantites({
                          ...quantites,
                          [produit.id]: Number(e.target.value),
                        })
                      }
                    >
                      {[...Array(maxQuantite).keys()].map((n) => (
                        <option key={n + 1} value={n + 1}>
                          {n + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      className={`${styles["button-ajouter"]} ${
                        isHovered
                          ? styles["button-hovered"]
                          : styles["button-not-hovered"]
                      }`}
                      onClick={() => handleAddToCart(produit)}
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
