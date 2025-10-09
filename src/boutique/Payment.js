import React, { useState, useEffect } from "react";
import styles from "../css/boutique/Checkout.module.css";

const Payment = () => {
  const [panier, setPanier] = useState([]);
  const [mode, setMode] = useState("domicile");
  const [sousMode, setSousMode] = useState("colissimo");
  const [adresseLivraison, setAdresseLivraison] = useState(null);

  useEffect(() => {
    // Chargement des données panier depuis localStorage (comme dans PlantesBrutes)
    const panierStocke = JSON.parse(localStorage.getItem("panier")) || [];
    setPanier(panierStocke);

    const token = localStorage.getItem("token");
    console.log("Token utilisé:", token);

    // Chargement dynamique adresse de livraison via API
    const fetchAdresseLivraison = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/adresse-livraison`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
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

        {/* Livraison à domicile */}
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
          <span style={{ fontWeight: "bold", marginRight: 8 }}>
            Livraison à domicile
          </span>
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
                <span style={{ marginLeft: 10 }}>4,50 €</span>
              </label>
              <label
                style={{ display: "flex", alignItems: "center", marginTop: 2 }}
              ></label>
            </div>
          </div>
        )}

        {/* Retrait point relais */}
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
        </label>

        {/* Click & Collect */}
        <label
          className={styles.livraisonRadio}
          style={{ display: "flex", alignItems: "center" }}
        >
          <input
            type="radio"
            name="mode"
            value="clickcollect"
            checked={mode === "clickcollect"}
            onChange={() => setMode("clickcollect")}
            style={{ marginRight: 8 }}
          />
          <span>Click & Collect (retrait en boutique)</span>
          <span style={{ marginLeft: 7, color: "grey" }}>Gratuit</span>
          <span className={styles.deliveryIcon} style={{ marginLeft: 8 }}>
            🏬
          </span>
        </label>
      </section>

      {/* Récapitulatif commande à droite */}
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
                Format :{" "}
                {item.quantite_en_sachet == null ||
                item.quantite_en_sachet === 0
                  ? `Sachet de ${item.quantite_en_g ?? 0} g`
                  : `Boîte de ${item.quantite_en_sachet ?? 0} infusions`}
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
            <span>Frais de port </span>
            <span>Calculé à l’étape suivante</span>
          </div>
          <div className={styles.totalLine}>
            <span>Total</span>
            <span>{totalProduits.toFixed(2)}€</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Payment;
