import React, { useState, useEffect, useRef } from "react";
import styles from "../css/boutique/Checkout.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useMapEvent } from "react-leaflet";
import L from "leaflet";
import PaymentForm from "../components/PaymentForm.js";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import config from "../config.js";
import FacturationForm from "../components/FacturationForm.js";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import TestPopup from "../components/TestPopup.js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY); // Ta clé publique. A changer pour la prod

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Formatage horaires
function formatTime(hhmm) {
  if (!hhmm) return "";
  const h = hhmm.toString().padStart(4, "0");
  return `${h.slice(0, 2)}:${h.slice(2)}`;
}
function renderHoraires(horaires) {
  if (!horaires || !Array.isArray(horaires.string)) return "fermé";
  const filtres = horaires.string.filter((v) => {
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "number") return true;
    return false;
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

// Modal édition adresse avec PhoneInput livraison et toggle facturation
function AddressEditModal({ address, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    prenom_livraison: address?.prenom_livraison || "",
    nom_livraison: address?.nom_livraison || "",
    adresse_livraison: address?.adresse_livraison || "",
    complement_adresse_livraison: address?.complement_adresse_livraison || "",
    code_postal_livraison: address?.code_postal_livraison || "",
    ville_livraison: address?.ville_livraison || "",
  });
  const [showTestPopup, setShowTestPopup] = useState(true);
  const [telephoneLivraison, setTelephoneLivraison] = useState(
    address?.telephone_livraison || ""
  );
  const [telephoneFacturation, setTelephoneFacturation] = useState("");
  const [showFacturation, setShowFacturation] = useState(false);
  const [formFacturation, setFormFacturation] = useState({
    prenom: "",
    nom: "",
    adresse: "",
    complement: "",
    codePostal: "",
    ville: "",
    pays: "France",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleChangeFacturation = (e) => {
    const { name, value } = e.target;
    setFormFacturation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      telephone_livraison: telephoneLivraison,
      facturation: showFacturation ? formFacturation : null,
      telephone_facturation: telephoneFacturation,
      showFacturation,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginBottom: 20 }}>Modifier l'adresse de livraison</h3>
        {showTestPopup && <TestPopup onClose={() => setShowTestPopup(false)} />}
        <form onSubmit={handleSubmit}>
          {[
            { label: "Prénom", name: "prenom_livraison" },
            { label: "Nom", name: "nom_livraison" },
            { label: "Adresse", name: "adresse_livraison" },
            {
              label: "Complément d'adresse",
              name: "complement_adresse_livraison",
              required: false,
            },
            {
              label: "Code postal",
              name: "code_postal_livraison",
              pattern: "[0-9]{5}",
              maxLength: 5,
            },
            { label: "Ville", name: "ville_livraison" },
          ].map(({ label, name, required = true, pattern, maxLength }) => (
            <div key={name} style={{ marginBottom: 12 }}>
              <label
                style={{ display: "block", marginBottom: 4, fontWeight: 500 }}
              >
                {label}
                {required ? " *" : ""}
              </label>
              <input
                type="text"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={required}
                pattern={pattern}
                maxLength={maxLength}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              />
            </div>
          ))}

          <div className={styles.toggleRow} style={{ marginTop: 20 }}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={showFacturation}
                onChange={() => setShowFacturation((v) => !v)}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.switchLabel}>
              Adresse de facturation différentes
            </span>
          </div>

          {showFacturation && (
            <div
              className={styles.facturationSection}
              style={{ marginTop: 20 }}
            >
              <h3 className={styles.formTitle}>Adresse de facturation</h3>
              <div className={styles.formRow}>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Prénom*"
                  value={formFacturation.prenom}
                  onChange={handleChangeFacturation}
                  required
                  className={styles.inputHalf}
                />
                <input
                  type="text"
                  name="nom"
                  placeholder="Nom*"
                  value={formFacturation.nom}
                  onChange={handleChangeFacturation}
                  required
                  className={styles.inputHalf}
                />
              </div>
              <select
                name="pays"
                value={formFacturation.pays}
                onChange={handleChangeFacturation}
                className={styles.inputFull}
              >
                <option value="France">France</option>
              </select>
              <input
                type="text"
                name="adresse"
                placeholder="Adresse*"
                value={formFacturation.adresse}
                onChange={handleChangeFacturation}
                required
                className={styles.inputFull}
              />
              <input
                type="text"
                name="complement"
                placeholder="Complément d'adresse"
                value={formFacturation.complement}
                onChange={handleChangeFacturation}
                className={styles.inputFull}
              />
              <div className={styles.formRow}>
                <input
                  type="text"
                  name="codePostal"
                  placeholder="Code postal*"
                  value={formFacturation.codePostal}
                  onChange={handleChangeFacturation}
                  required
                  className={styles.inputHalf}
                />
                <input
                  type="text"
                  name="ville"
                  placeholder="Ville*"
                  value={formFacturation.ville}
                  onChange={handleChangeFacturation}
                  required
                  className={styles.inputHalf}
                />
              </div>
              <div className={styles.inputFull} style={{ marginTop: 12 }}>
                <PhoneInput
                  international
                  defaultCountry="FR"
                  value={telephoneFacturation}
                  onChange={setTelephoneFacturation}
                  inputComponent={(props) => (
                    <input {...props} className={styles.inputTel} />
                  )}
                  placeholder="Numéro de téléphone*"
                  required
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 4,
                border: "none",
                background: "#2671ff",
                color: "white",
                cursor: "pointer",
              }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CustomRelaySelector = ({ postcode, onConfirm, onCancel }) => {
  const [pointsRelais, setPointsRelais] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedPoint, setSelectedPoint] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [codePostal, setCodePostal] = React.useState(postcode || "");

  const fetchRelaysByCodePostal = (postcodeValue) => {
    if (!postcodeValue || postcodeValue.length !== 5) {
      setError("Veuillez saisir un code postal valide à 5 chiffres.");
      setPointsRelais([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(
      `${process.env.REACT_APP_API_URL}/mondialrelay-points-relais?postcode=${postcodeValue}`,
      {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement points relais");
        return res.json();
      })
      .then((data) => {
        setPointsRelais(data);
        setLoading(false);
        setSelectedPoint(null);
      })
      .catch((err) => {
        setError(err.message || "Erreur inconnue");
        setLoading(false);
        setPointsRelais([]);
      });
  };

  React.useEffect(() => {
    if (codePostal && codePostal.length === 5) {
      fetchRelaysByCodePostal(codePostal);
    }
  }, [codePostal]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRelaysByCodePostal(codePostal.trim());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
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
          maxWidth: 600,
          width: "100%",
          maxHeight: "70vh",
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h4>Recherche de point relais </h4>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            maxLength={5}
            placeholder="Code postal (ex. 77600)"
            value={codePostal}
            onChange={(e) => setCodePostal(e.target.value.replace(/\D/g, ""))}
            style={{
              flexGrow: 1,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
            aria-label="Recherche point relais code postal"
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              backgroundColor: "#2671ff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Rechercher
          </button>
        </form>
        {loading && <p>Chargement des points relais...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              overflowY: "auto",
              flexGrow: 1,
            }}
          >
            {pointsRelais.length === 0 && <li>Aucun point relais trouvé</li>}
            {pointsRelais.map((point) => (
              <li
                key={point.Num}
                onClick={() => setSelectedPoint(point)}
                style={{
                  marginBottom: 12,
                  border:
                    selectedPoint?.Num === point.Num
                      ? "2px solid #2671ff"
                      : "1px solid #ccc",
                  borderRadius: 6,
                  padding: 8,
                  cursor: "pointer",
                  background:
                    selectedPoint?.Num === point.Num ? "#e9f2ff" : "white",
                }}
              >
                <div>
                  <strong>{point.LgAdr1}</strong>
                </div>
                <div style={{ fontSize: 14, color: "#666" }}>
                  {point.LgAdr3}, {point.CP} {point.Ville}
                </div>
                <div style={{ marginTop: 8 }}>
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontSize: 13,
                        color: "#2671ff",
                        listStyle: "none",
                      }}
                    >
                      <i className="bi bi-clock"></i> Voir les horaires
                    </summary>
                    <ul style={{ paddingLeft: 20, fontSize: 12, marginTop: 6 }}>
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
              </li>
            ))}
          </ul>
        )}
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
  const [mode, setMode] = useState(null);
  const [sousMode, setSousMode] = useState("colissimo");
  const [adresseLivraison, setAdresseLivraison] = useState(null);
  const [fraisPort, setFraisPort] = useState(null);
  const [pointRelais, setPointRelais] = useState(null);
  const [showRelaySelector, setShowRelaySelector] = useState(false);
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showFacturation, setShowFacturation] = useState(false);

  // State clientSecret Stripe
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    localStorage.removeItem("modeLivraison"); // optionnel pour remise à zéro
  }, []);

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
        if (res.ok) {
          const data = await res.json();
          setAdresseLivraison(data);
        }
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
    let poidsTotal = 0;
    if (nbArticles > 0) {
      poidsTotal = 250 + Math.max(0, nbArticles - 2) * 50;
    }
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

  // Création du PaymentIntent avec récupération du client_secret
  useEffect(() => {
    async function createPaymentIntent() {
      const totalProduits = panier.reduce(
        (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 0),
        0
      );
      const total = Number(
        (totalProduits + (Number(fraisPort) || 0)).toFixed(2)
      );
      if (total <= 0) {
        setClientSecret("");
        return;
      }
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/create-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Math.round(total * 100) }),
          }
        );
        const data = await response.json();
        setClientSecret(data.client_secret); // Assure-toi que le backend renvoie "client_secret"
      } catch (error) {
        console.error("Erreur création PaymentIntent :", error);
        setClientSecret("");
      }
    }
    createPaymentIntent();
  }, [panier, fraisPort]);

  const handleSaveAddress = async (newAddress) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/adresse-livraison`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(newAddress),
        }
      );
      if (res.ok) {
        const updatedAddress = await res.json();
        setAdresseLivraison(updatedAddress);
        setShowAddressEditor(false);
      } else {
        alert("Erreur lors de la mise à jour de l'adresse");
      }
    } catch (error) {
      alert("Erreur lors de la mise à jour de l'adresse");
    }
  };

  const totalProduits = panier.reduce(
    (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 0),
    0
  );

  const handleMethodeChange = (value) => {
    setMode(value);
    localStorage.setItem("modeLivraison", value);

    if (value === "domicile") {
      setShowAddressPopup(true); // Ouvre popup adresse
    } else {
      setShowAddressPopup(false); // Ferme popup sinon
    }
  };

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
            onChange={() => handleMethodeChange("domicile")}
            style={{ marginRight: 8 }}
          />
          Livraison à domicile <span className={styles.deliveryIcon}>🏠</span>
        </label>
        {mode === "domicile" && adresseLivraison && (
          <div style={{ marginBottom: 12, marginLeft: 28 }}>
            <div
              style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            >
              <span style={{ fontSize: 16, marginRight: 6 }}>📍</span>
              <span>
                {adresseLivraison.prenom_livraison}{" "}
                {adresseLivraison.nom_livraison},{" "}
                {adresseLivraison.adresse_livraison}
                {adresseLivraison.complement_adresse_livraison
                  ? ", " + adresseLivraison.complement_adresse_livraison
                  : ""}
                , {adresseLivraison.code_postal_livraison}{" "}
                {adresseLivraison.ville_livraison}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowAddressEditor(true);
                }}
                style={{
                  marginLeft: 12,
                  color: "#2671ff",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Changer
              </button>
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
            onChange={() => handleMethodeChange("relais")}
            style={{ marginRight: 8 }}
          />
          Retrait dans un point relais{" "}
          <span style={{ marginLeft: 7 }}>3,90 €</span>{" "}
          <span className={styles.deliveryIcon} style={{ marginLeft: 8 }}>
            🏪
          </span>
          {mode === "relais" && (
            <button
              type="button"
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
              onClick={() => setShowRelaySelector(true)}
            >
              Choisir un point relais
            </button>
          )}
        </label>
        {mode === "relais" && pointRelais && (
          <div style={{ marginBottom: 12, marginLeft: 20, color: "#2671ff" }}>
            <strong>Point relais sélectionné :</strong>
            <br />
            {pointRelais.LgAdr1 || pointRelais.Information}
            <br />
            <span>
              {pointRelais.LgAdr3} <br />
              {pointRelais.CP} {pointRelais.Ville}
            </span>
          </div>
        )}
        {showAddressEditor && (
          <AddressEditModal
            address={adresseLivraison}
            onSave={handleSaveAddress}
            onCancel={() => setShowAddressEditor(false)}
          />
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
      <div className={styles.deliverySection}>
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
                  Format&nbsp;:{" "}
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
      <aside
        className={styles.paymentColumn}
        style={{
          width: 420,
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(100, 100, 100, 0.06)",
          padding: 24,
          marginTop: -55,
          minHeight: 340,
        }}
      >
        {!clientSecret ? (
          <p>Chargement du paiement...</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm />
          </Elements>
        )}
      </aside>

      {showAddressPopup && (
        <FacturationForm
          address={adresseLivraison}
          onSave={(newAddress) => {
            setAdresseLivraison(newAddress);
            setShowAddressPopup(false);
          }}
          onCancel={() => setShowAddressPopup(false)}
        />
      )}
    </div>
  );
};

export default Payment;
