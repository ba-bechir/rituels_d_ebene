import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PlantesBrutesDetails() {
  const { id } = useParams();
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour toggle des sections
  const [openDescriptions, setOpenDescriptions] = useState(false);
  const [openBienfait, setOpenBienfait] = useState(false);
  const [openUsage, setOpenUsage] = useState(false);
  const [openContreIndication, setOpenContreIndication] = useState(false);

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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "288px",
        marginTop: "-150px",
        maxWidth: "100vw",
        width: "100%",
        margin: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Partie gauche encadrée avec fond coul rgb(227, 211, 207) */}
      <div
        style={{
          background: "rgb(227, 211, 207)",
          border: "2px solid #000",
          padding: "24px",
          marginRight: "8px",
          maxWidth: "320px",
          boxSizing: "border-box",
        }}
      >
        <center>
          <h1>{produit.nom_produit}</h1>
        </center>
        {produit.image && (
          <img
            src={`data:image/jpeg;base64,${produit.image}`}
            alt={produit.nom_produit}
            style={{
              maxWidth: "100%",
              marginBottom: "20px",
            }}
          />
        )}

        <p>
          <strong>Prix :</strong> {produit.prix} €
        </p>
        <p>
          <strong>Quantité en stock :</strong> {produit.quantite_stock}
        </p>
        <p>
          <strong>Unité de vente :</strong>{" "}
          {produit.quantite_en_g ? `${produit.quantite_en_g} g` : ""}
        </p>
      </div>

      {/* Partie droite : sections dépliables */}
      <div
        style={{
          width: "500px",
          alignItems: "flex-start",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Times New Roman', serif",
          background: "#e3d3cf",
          border: "2px solid #000",
          position: "relative",
          // borderRadius supprimé pour pas d'arrondi
        }}
      >
        <SectionToggle
          title="DESCRIPTIONS"
          isOpen={openDescriptions}
          onClick={() => setOpenDescriptions(!openDescriptions)}
          content={produit.description}
        />
        <SectionToggle
          title="BIENFAIT"
          isOpen={openBienfait}
          onClick={() => setOpenBienfait(!openBienfait)}
          content={produit.bienfait}
        />
        <SectionToggle
          title="MODE D'EMPLOI"
          isOpen={openUsage}
          onClick={() => setOpenUsage(!openUsage)}
          content={produit.mode_d_emploi}
        />
        <SectionToggle
          title="CONTRE-INDICATIONS"
          isOpen={openContreIndication}
          onClick={() => setOpenContreIndication(!openContreIndication)}
          content={produit.contre_indication}
        />
      </div>
    </div>
  );
}

// Composant pour section avec toggle
function SectionToggle({ title, isOpen, onClick, content }) {
  const isContentPresent = content && content.trim() !== "";

  return (
    <>
      <div
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          height: "65px",
          borderBottom: "2px solid #000",
          padding: "0 16px",
          background: "#e3d3cf",
          userSelect: "none",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: "38px",
            fontWeight: "bold",
            marginRight: "px",
            flexShrink: 0,
          }}
        >
          &gt;
        </span>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "30px",
            fontWeight: "bold",
            fontStyle: "italic",
            letterSpacing: "2px",
            color: "#111",
          }}
        >
          {title}
        </span>
      </div>
      {isOpen && isContentPresent && (
        <div
          style={{
            padding: "20px 40px",
            background: "#f7f1f0",
            fontSize: "16px",
            lineHeight: 1.5,
            color: "#333",
            borderBottom: "2px solid #000",
            whiteSpace: "pre-wrap",
            width: "100%",
            boxSizing: "border-box",
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </>
  );
}
