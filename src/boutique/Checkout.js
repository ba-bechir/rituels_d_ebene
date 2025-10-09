import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/boutique/Checkout.module.css";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import config from "../config.js";

const CustomInput = (props) => <input {...props} className={styles.inputTel} />;

const Checkout = () => {
  // Livraison
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    pays: "France",
    adresse: "",
    complement: "",
    codePostal: "",
    ville: "",
    instructions: "",
  });
  const [telephone, setTelephone] = useState("");
  const [country, setCountry] = useState("FR");

  // Facturation
  const [formFact, setFormFact] = useState({
    prenom: "",
    nom: "",
    pays: "France",
    adresse: "",
    complement: "",
    codePostal: "",
    ville: "",
  });
  const [telephoneFact, setTelephoneFact] = useState("");
  const [countryFact, setCountryFact] = useState("FR");

  // Toggle bouton (facturation différente)
  const [showFacturation, setShowFacturation] = useState(false);

  const [panier, setPanier] = useState([]);

  useEffect(() => {
    const panierStocke = JSON.parse(localStorage.getItem("panier")) || [];
    setPanier(panierStocke);
  }, []);

  const totalProduits = panier.reduce(
    (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 0),
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeFact = (e) => {
    const { name, value } = e.target;
    setFormFact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    navigate("/payment");

    const livraisonData = { ...form, telephone: telephone };
    // Si toggle désactivé => adresses identiques, sinon formulaire facturation
    const facturationData = showFacturation
      ? { ...formFact, telephone: telephoneFact }
      : { ...form, telephone: telephone };

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${config.apiUrl}/persist-adresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          livraison: livraisonData,
          facturation: facturationData,
          facturationIdentique: !showFacturation,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de l'enregistrement.");
      // Redirige ou montre message de succès selon logique métier ici
      alert("Adresses enregistrées.");
    } catch (err) {
      alert("Erreur lors de la sauvegarde : " + err.message);
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <form onSubmit={handleSubmit} className={styles.leftColumn}>
        <h2>Adresse de livraison</h2>
        <div className={styles.formRow}>
          <input
            type="text"
            name="prenom"
            placeholder="Prénom*"
            value={form.prenom}
            onChange={handleChange}
            required
            className={styles.inputHalf}
          />
          <input
            type="text"
            name="nom"
            placeholder="Nom*"
            value={form.nom}
            onChange={handleChange}
            required
            className={styles.inputHalf}
          />
        </div>
        <select
          name="pays"
          value={form.pays}
          onChange={handleChange}
          className={styles.inputFull}
        >
          <option value="France">France</option>
        </select>
        <input
          type="text"
          name="adresse"
          placeholder="Adresse*"
          value={form.adresse}
          onChange={handleChange}
          required
          className={styles.inputFull}
        />
        <input
          type="text"
          name="complement"
          placeholder="Complément d'adresse"
          value={form.complement}
          onChange={handleChange}
          className={styles.inputFull}
        />
        <div className={styles.formRow}>
          <input
            type="text"
            name="codePostal"
            placeholder="Code postal*"
            value={form.codePostal}
            onChange={handleChange}
            required
            className={styles.inputHalf}
          />
          <input
            type="text"
            name="ville"
            placeholder="Ville*"
            value={form.ville}
            onChange={handleChange}
            required
            className={styles.inputHalf}
          />
        </div>
        <div className={styles.inputFull}>
          <PhoneInput
            international
            defaultCountry={country}
            value={telephone}
            onChange={setTelephone}
            onCountryChange={setCountry}
            inputComponent={CustomInput}
            placeholder="Numéro de téléphone*"
            required
          />
        </div>
        <div>
          <label>Instructions de livraison :</label>
          <textarea
            name="instructions"
            placeholder="Etage, digicode..."
            value={form.instructions}
            onChange={handleChange}
            rows="2"
            className={styles.textarea}
          />
        </div>
        <div className={styles.toggleRow}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={!showFacturation}
              onChange={() => setShowFacturation((v) => !v)}
            />
            <span className={styles.slider}></span>
          </label>
          <span className={styles.switchLabel}>
            Adresse de facturation identique
          </span>
        </div>
        {showFacturation && (
          <div className={styles.facturationSection}>
            <h3 className={styles.formTitle}>Adresse de facturation</h3>
            <div className={styles.formRow}>
              <input
                type="text"
                name="prenom"
                placeholder="Prénom*"
                value={formFact.prenom}
                onChange={handleChangeFact}
                required
                className={styles.inputHalf}
              />
              <input
                type="text"
                name="nom"
                placeholder="Nom*"
                value={formFact.nom}
                onChange={handleChangeFact}
                required
                className={styles.inputHalf}
              />
            </div>
            <select
              name="pays"
              value={formFact.pays}
              onChange={handleChangeFact}
              className={styles.inputFull}
            >
              <option value="France">France</option>
            </select>
            <input
              type="text"
              name="adresse"
              placeholder="Adresse*"
              value={formFact.adresse}
              onChange={handleChangeFact}
              required
              className={styles.inputFull}
            />
            <input
              type="text"
              name="complement"
              placeholder="Complément d'adresse"
              value={formFact.complement}
              onChange={handleChangeFact}
              className={styles.inputFull}
            />
            <div className={styles.formRow}>
              <input
                type="text"
                name="codePostal"
                placeholder="Code postal*"
                value={formFact.codePostal}
                onChange={handleChangeFact}
                required
                className={styles.inputHalf}
              />
              <input
                type="text"
                name="ville"
                placeholder="Ville*"
                value={formFact.ville}
                onChange={handleChangeFact}
                required
                className={styles.inputHalf}
              />
            </div>
            <div className={styles.inputFull}>
              <PhoneInput
                international
                defaultCountry={countryFact}
                value={telephoneFact}
                onChange={setTelephoneFact}
                onCountryChange={setCountryFact}
                inputComponent={CustomInput}
                placeholder="Numéro de téléphone*"
                required
              />
            </div>
          </div>
        )}
        <button type="submit" className={styles.payerBtn}>
          ALLER AU PAIEMENT
        </button>
      </form>
      {/* Droite : Récapitulatif */}
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

export default Checkout;
