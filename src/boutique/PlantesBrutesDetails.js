import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/boutique/PlantesBrutesDetails.css";

export default function PlantesBrutesDetails() {
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

  const total = (quantite * produit.prix).toFixed(2);

  return (
    <div className="pb-global">
      {/* Partie gauche : fiche produit */}
      <div className="pb-left">
        <h1 className="pb-title">{produit.nom_produit}</h1>
        {produit.image && (
          <img
            className="pb-image"
            src={`data:image/jpeg;base64,${produit.image}`}
            alt={produit.nom_produit}
          />
        )}

        <p className="pb-pricing">
          <strong>
            {produit.prix} € /{" "}
            {produit.quantite_en_g ? `${produit.quantite_en_g} g` : ""}
          </strong>
        </p>

        <div className="pb-cta-row">
          <div className="pb-qty-selector">
            <button
              type="button"
              className="pb-qty-btn"
              onClick={() => setQuantite((q) => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
            >
              -
            </button>
            <span className="pb-qty-value">{quantite}</span>
            <button
              type="button"
              className="pb-qty-btn"
              onClick={() => setQuantite((q) => q + 1)}
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
        </div>
        <button
          className="pb-add-to-cart"
          // Ajoute ici ta logique d'ajout au panier
        >
          AJOUTER AU PANIER €{total}
        </button>
      </div>

      {/* Partie droite : sections dépliables */}
      <div className="pb-right">
        <SectionToggle
          title="DESCRIPTIONS"
          isOpen={openDescriptions}
          onClick={() => setOpenDescriptions((open) => !open)}
          content={produit.description}
        />
        <SectionToggle
          title="BIENFAIT"
          isOpen={openBienfait}
          onClick={() => setOpenBienfait((open) => !open)}
          content={produit.bienfait}
        />
        <SectionToggle
          title="MODE D'EMPLOI"
          isOpen={openUsage}
          onClick={() => setOpenUsage((open) => !open)}
          content={produit.mode_d_emploi}
        />
        <SectionToggle
          title="CONTRE-INDICATIONS"
          isOpen={openContreIndication}
          onClick={() => setOpenContreIndication((open) => !open)}
          content={produit.contre_indication}
        />
      </div>
    </div>
  );
}

function SectionToggle({ title, isOpen, onClick, content }) {
  const isContentPresent = content && content.trim() !== "";

  return (
    <>
      <div className="pb-section-header" onClick={onClick}>
        <span className="pb-section-arrow">&gt;</span>
        <span className="pb-section-title">{title}</span>
      </div>
      {isOpen && isContentPresent && (
        <div
          className="pb-section-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </>
  );
}
