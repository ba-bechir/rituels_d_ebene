import React, { useState, useEffect } from "react";
import styles from "../css/boutique/Checkout.module.css";

// Formate un horaire "0930" → "09:30"
// Formate un horaire "0930" → "09:30"
function formatTime(hhmm) {
  if (!hhmm) return "";
  const h = hhmm.toString().padStart(4, "0");
  return `${h.slice(0, 2)}:${h.slice(2)}`;
}

function renderHoraires(horaires) {
  if (!horaires || !Array.isArray(horaires.string)) return "fermé";
  const filtres = horaires.string.filter((v) => {
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "number") return true; // un nombre non vide
    return false; // autre type => filtre hors
  });
  if (filtres.length === 0) return "fermé";
  const paires = [];
  for (let i = 0; i < filtres.length; i += 2) {
    if (filtres[i + 1] !== undefined) {
      paires.push(`${formatTime(filtres[i])}–${formatTime(filtres[i + 1])}`);
    }
  }
  return paires.length ? paires.join(", ") : "fermé";
}

const CustomRelaySelector = ({ postcode, onConfirm, onCancel }) => {
  const [pointsRelais, setPointsRelais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postcode) return;
    setLoading(true);
    setError(null);
    fetch(
      `${process.env.REACT_APP_API_URL}/mondialrelay-points-relais?postcode=${postcode}`,
      { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement points relais");
        return res.json();
      })
      .then((data) => {
        console.log("Points relais reçus:", data);
        setPointsRelais(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erreur inconnue");
        setLoading(false);
      });
  }, [postcode]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1500,
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          maxWidth: 480,
          width: "100%",
          maxHeight: "70vh",
          overflowY: "auto",
          padding: 20,
        }}
      >
        <h4>Choisissez un point relais</h4>
        {loading && <p>Chargement des points relais...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && pointsRelais.length === 0 && (
          <p>Aucun point relais trouvé.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pointsRelais.map((point) => (
            <div
              key={point.Num}
              className="relay-card"
              style={{
                marginBottom: 12,
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: 8,
              }}
            >
              <div>
                {/* Nom ou intitulé */}
                <strong>
                  {point.LgAdr1} {point.CP} {point.Ville}
                </strong>
                <br />
                <span>{point.LgAdr3}</span>
              </div>
              <div>
                {/* Adresse */}
                <i className="fa fa-map-marker" /> {point.LgAdr3}, {point.CP}{" "}
                {point.Ville}
              </div>
              <div>
                {/* Horaires principaux (bouton déroulant pour afficher détails) */}
                <details>
                  <summary>Voir les horaires</summary>
                  <ul style={{ paddingLeft: 10 }}>
                    <li>lundi : {renderHoraires(point.Horaires_Lundi)}</li>
                    <li>mardi : {renderHoraires(point.Horaires_Mardi)}</li>
                    <li>
                      mercredi : {renderHoraires(point.Horaires_Mercredi)}
                    </li>
                    <li>jeudi : {renderHoraires(point.Horaires_Jeudi)}</li>
                    <li>
                      vendredi : {renderHoraires(point.Horaires_Vendredi)}
                    </li>
                    <li>samedi : {renderHoraires(point.Horaires_Samedi)}</li>
                    <li>
                      dimanche : {renderHoraires(point.Horaires_Dimanche)}
                    </li>
                  </ul>
                </details>
              </div>
              <button onClick={() => onConfirm(point)}>
                Choisir ce point relais
              </button>
            </div>
          ))}
        </ul>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <button onClick={onCancel} style={{ padding: "8px 12px" }}>
            Annuler
          </button>
          <button
            disabled={!selectedPoint}
            onClick={() => onConfirm(selectedPoint)}
            style={{
              padding: "8px 12px",
              backgroundColor: selectedPoint ? "#2671ff" : "#ccc",
              color: "#fff",
              border: "none",
              cursor: selectedPoint ? "pointer" : "not-allowed",
            }}
          >
            Confirmer ce point relais
          </button>
        </div>
      </div>
    </div>
  );
};

const Payment = () => {
  const [panier, setPanier] = useState([]);
  const [mode, setMode] = useState("domicile");
  const [sousMode, setSousMode] = useState("colissimo");
  const [adresseLivraison, setAdresseLivraison] = useState(null);
  const [fraisPort, setFraisPort] = useState(null);
  const [pointRelais, setPointRelais] = useState(null);
  const [showRelaySelector, setShowRelaySelector] = useState(false);

  useEffect(() => {
    const panierStocke = JSON.parse(localStorage.getItem("panier")) || [];
    setPanier(panierStocke);

    const token = localStorage.getItem("token");
    const fetchAdresseLivraison = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/adresse-livraison`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        const data = await res.json();
        setAdresseLivraison(data);
      } catch (error) {
        console.error("Erreur chargement adresse livraison :", error);
      }
    };
    fetchAdresseLivraison();
  }, []);

  useEffect(() => {
    const nbArticles = panier.reduce(
      (acc, item) => acc + Number(item.quantite || 1),
      0
    );
    const poidsTotal = nbArticles > 0 ? 250 + (nbArticles - 1) * 50 : 0;

    if (poidsTotal > 0 && mode === "domicile" && sousMode === "colissimo") {
      fetch(
        `${process.env.REACT_APP_API_URL}/colissimo-tarif?poids=${poidsTotal}`
      )
        .then((res) => res.json())
        .then((data) => {
          const prix = Number(data.prix);
          setFraisPort(isNaN(prix) ? null : prix);
        })
        .catch(() => setFraisPort(null));
    } else if (mode === "relais") {
      setFraisPort(3.9);
    } else if (mode === "clickcollect") {
      setFraisPort(0);
    } else {
      setFraisPort(null);
    }
  }, [panier, mode, sousMode]);

  const totalProduits = panier.reduce(
    (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 0),
    0
  );

  return (
    <div className={styles.checkoutContainer}>
      <section
        className={styles.deliverySection}
        style={{
          maxWidth: 420,
          border: "1px solid #eaeaea",
          background: "#fafafa",
          padding: 16,
          borderRadius: 8,
          marginBottom: 32,
        }}
      >
        <h4>Méthodes de livraison</h4>
        <label
          className={styles.livraisonRadio}
          style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
        >
          <input
            type="radio"
            name="mode"
            value="domicile"
            checked={mode === "domicile"}
            onChange={() => setMode("domicile")}
            style={{ marginRight: 8 }}
          />
          <span style={{ marginRight: 8 }}>Livraison à domicile</span>
          <span className={styles.deliveryIcon}>🏠</span>
        </label>
        {mode === "domicile" && (
          <div style={{ marginBottom: 12, marginLeft: 28 }}>
            <div
              style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            >
              <span style={{ fontSize: 16, marginRight: 6 }}>📍</span>
              <span>
                {adresseLivraison
                  ? `${adresseLivraison.prenom_livraison} ${
                      adresseLivraison.nom_livraison
                    }, ${adresseLivraison.adresse_livraison}${
                      adresseLivraison.complement_adresse_livraison
                        ? ", " + adresseLivraison.complement_adresse_livraison
                        : ""
                    }, ${adresseLivraison.code_postal_livraison} ${
                      adresseLivraison.ville_livraison
                    }`
                  : "Chargement..."}
              </span>
              <a
                href="#changer"
                style={{
                  marginLeft: 12,
                  color: "#2671ff",
                  textDecoration: "underline",
                }}
                onClick={() =>
                  alert("Changer l'adresse (fonction à implémenter)")
                }
              >
                Changer
              </a>
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="radio"
                  name="sousMode"
                  value="colissimo"
                  checked={sousMode === "colissimo"}
                  onChange={() => setSousMode("colissimo")}
                />
                <span style={{ marginLeft: 5 }}>
                  Colissimo (Livraison Standard)
                </span>
              </label>
            </div>
          </div>
        )}
        <label
          className={styles.livraisonRadio}
          style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
        >
          <input
            type="radio"
            name="mode"
            value="relais"
            checked={mode === "relais"}
            onChange={() => setMode("relais")}
            style={{ marginRight: 8 }}
          />
          <span>Retrait dans un point relais</span>
          <span style={{ marginLeft: 7 }}>3,90 €</span>
          <span className={styles.deliveryIcon} style={{ marginLeft: 8 }}>
            🏪
          </span>
          {mode === "relais" && (
            <button
              style={{
                marginLeft: 18,
                background: "#2671ff",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: 15,
              }}
              type="button"
              onClick={() => setShowRelaySelector(true)}
            >
              Choisir un point relais
            </button>
          )}
        </label>
        {mode === "relais" && pointRelais && (
          <div style={{ marginBottom: 12, marginLeft: 20, color: "#2671ff" }}>
            <strong>Point relais sélectionné :</strong>
            <div>{pointRelais.LgAdr1 || pointRelais.Information}</div>
            <span>
              {pointRelais.LgAdr3 && `${pointRelais.LgAdr3}, `}
              {pointRelais.CP} {pointRelais.Ville}
            </span>
          </div>
        )}
        {showRelaySelector && (
          <CustomRelaySelector
            postcode={adresseLivraison?.code_postal_livraison || ""}
            onConfirm={(point) => {
              setPointRelais(point);
              setShowRelaySelector(false);
            }}
            onCancel={() => setShowRelaySelector(false)}
          />
        )}
      </section>
      <aside className={styles.rightColumn}>
        <h3>Commande</h3>
        {panier.map((item) => (
          <div key={item.id} className={styles.resumeItem}>
            <img
              src={`data:image/jpeg;base64,${item.image}`}
              alt={item.nom}
              width={40}
              height={40}
            />
            <div>
              <div>{item.nom}</div>
              <div>
                Format&nbsp;:
                {item.quantite_en_sachet == null ||
                item.quantite_en_sachet === 0
                  ? ` Sachet de ${item.quantite_en_g ?? 0} g`
                  : ` Boîte de ${item.quantite_en_sachet ?? 0} infusions`}
              </div>
              <div>
                x{item.quantite} — {(Number(item.prix) || 0).toFixed(2)} €
              </div>
            </div>
          </div>
        ))}
        <div className={styles.summaryTotals}>
          <div>
            <span>Sous-total</span>
            <span>{totalProduits.toFixed(2)}€</span>
          </div>
          <div>
            <span>Frais de port</span>
            <span>
              {typeof fraisPort === "number"
                ? fraisPort.toFixed(2) + " €"
                : "Calcul en cours..."}
            </span>
          </div>
          <div className={styles.totalLine}>
            <span>Total</span>
            <span>
              {(totalProduits + (Number(fraisPort) || 0)).toFixed(2)}€
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Payment;
