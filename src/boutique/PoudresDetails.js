import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "../css/boutique/ProductDetails.module.css";

export default function PoudresDetails() {
  const { id } = useParams();
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sections toggles
  const [openDescriptions, setOpenDescriptions] = useState(false);
  const [openBienfait, setOpenBienfait] = useState(false);
  const [openUsage, setOpenUsage] = useState(false);
  const [openContreIndication, setOpenContreIndication] = useState(false);

  // Quantité choisie
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    const fetchProduit = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/produit/${id}`
        );
        if (!res.ok)
          throw new Error("Erreur lors de la récupération du produit");
        const data = await res.json();
        setProduit(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduit();
  }, [id]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;
  if (!produit) return <p>Produit non trouvé</p>;

  const stockDisponible = produit.quantite_stock ?? 0;
  const canIncrease = quantite < stockDisponible;
  const total = (quantite * Number(produit.prix)).toFixed(2);

  // Fonction d’ajout au panier local/session pour utilisateur non connecté,
  // et persistance en base si connecté
  async function ajouterAuPanier(produitAAjouter, quantiteAAjouter) {
    const panier = JSON.parse(localStorage.getItem("panier")) || [];
    const index = panier.findIndex((item) => item.id === produitAAjouter.id);

    let nouvelleQuantite;
    if (index > -1) {
      if (
        panier[index].quantite + quantiteAAjouter <=
        produitAAjouter.quantite_stock
      ) {
        panier[index].quantite += quantiteAAjouter;
        panier[index].quantite_stock = produitAAjouter.quantite_stock;
        nouvelleQuantite = panier[index].quantite;
      } else {
        toast.error(
          `Stock maximal atteint pour ${produitAAjouter.nom_produit} : ${produitAAjouter.quantite_stock}`
        );
        return false; // Échec ajout (stock max)
      }
    } else {
      panier.push({
        id: produitAAjouter.id,
        nom: produitAAjouter.nom_produit,
        image: produitAAjouter.image || null,
        prix: Number(produitAAjouter.prix),
        quantite: quantiteAAjouter,
        quantite_stock: produitAAjouter.quantite_stock,
        quantite_en_g: produitAAjouter.quantite_en_g,
        quantite_en_sachet: produitAAjouter.quantite_en_sachet,
      });
      nouvelleQuantite = quantiteAAjouter;
    }

    localStorage.setItem("panier", JSON.stringify(panier));
    setQuantite(1);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/cart/ajouter`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id_produit: produitAAjouter.id,
              quantite: nouvelleQuantite,
            }),
          }
        );
        if (!res.ok) throw new Error("Erreur mise à jour panier backend");
      } catch (err) {
        console.error(err);
        toast.error("Impossible de synchroniser avec le panier en base.");
      }
    } else {
      toast.info("Connectez-vous pour sauvegarder votre panier.");
    }
    return true;
  }

  // Handler bouton ajout panier
  async function handleAddToCart() {
    if (quantite > stockDisponible) {
      toast.error(
        `Quantité maximale disponible : ${stockDisponible}. Veuillez ajuster votre sélection.`
      );
      return;
    }
    const success = await ajouterAuPanier(produit, quantite);
    if (success) {
      toast.success("Produit ajouté au panier !");
    }
  }

  return (
    <div className={styles["pb-global"]}>
      {/* Partie gauche : fiche produit */}
      <div className={styles["pb-left"]}>
        <h1 className={styles["pb-title"]}>{produit.nom_produit}</h1>
        {produit.image && (
          <img
            className={styles["pb-image"]}
            src={`data:image/jpeg;base64,${produit.image}`}
            alt={produit.nom_produit}
          />
        )}

        <p className={styles["pb-pricing"]}>
          <strong>
            {Number(produit.prix).toFixed(2)} € /{" "}
            {produit.quantite_en_g
              ? `${produit.quantite_en_g} g`
              : produit.quantite_en_sachet
              ? `boîte de ${produit.quantite_en_sachet} sachets`
              : ""}
          </strong>
        </p>

        <div className={styles["pb-cta-row"]}>
          <div className={styles["pb-qty-selector"]}>
            <button
              type="button"
              className={styles["pb-qty-btn"]}
              onClick={() => setQuantite((q) => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
            >
              -
            </button>
            <span className={styles["pb-qty-value"]}>{quantite}</span>
            <button
              type="button"
              className={styles["pb-qty-btn"]}
              onClick={() => {
                if (canIncrease) setQuantite((q) => q + 1);
                else toast.info(`Stock maximal atteint : ${stockDisponible}`);
              }}
              aria-label="Augmenter la quantité"
              disabled={!canIncrease}
            >
              +
            </button>
          </div>
        </div>

        <button
          className={styles["pb-add-to-cart"]}
          onClick={handleAddToCart}
          disabled={stockDisponible === 0}
        >
          AJOUTER AU PANIER <br /> {total} €
        </button>
      </div>

      {/* Partie droite : sections dépliables */}
      <div className={styles["pb-right"]}>
        <SectionToggle
          title="DESCRIPTIONS"
          isOpen={openDescriptions}
          onClick={() => setOpenDescriptions(!openDescriptions)}
          content={produit.description}
          styles={styles}
        />
        <SectionToggle
          title="BIENFAIT"
          isOpen={openBienfait}
          onClick={() => setOpenBienfait(!openBienfait)}
          content={produit.bienfait}
          styles={styles}
        />
        <SectionToggle
          title="MODE D'EMPLOI"
          isOpen={openUsage}
          onClick={() => setOpenUsage(!openUsage)}
          content={produit.mode_d_emploi}
          styles={styles}
        />
        <SectionToggle
          title="CONTRE-INDICATIONS"
          isOpen={openContreIndication}
          onClick={() => setOpenContreIndication(!openContreIndication)}
          content={produit.contre_indication}
          styles={styles}
        />
      </div>
    </div>
  );
}

function SectionToggle({ title, isOpen, onClick, content, styles }) {
  const isContentPresent = content && content.trim() !== "";

  return (
    <>
      <div
        className={styles["pb-section-header"]}
        onClick={onClick}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
      >
        <span className={styles["pb-section-arrow"]}>&gt;</span>
        <span className={styles["pb-section-title"]}>{title}</span>
      </div>
      {isOpen && isContentPresent && (
        <div
          className={styles["pb-section-content"]}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </>
  );
}
