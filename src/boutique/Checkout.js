import React, { useState, useEffect } from "react";
import styles from "../css/boutique/Checkout.module.css";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
  const [phone, setPhone] = useState("");
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
  const [phoneFact, setPhoneFact] = useState("");
  const [countryFact, setCountryFact] = useState("FR");

  // Toggle bouton (facturation différente)
  const [showFacturation, setShowFacturation] = useState(false);

  const [panier, setPanier] = useState([]);
  const [fraisPort, setFraisPort] = useState(4.5);

  useEffect(() => {
    const panierStocke = JSON.parse(localStorage.getItem("panier")) || [];
    setPanier(panierStocke);
  }, []);

  const totalProduits = panier.reduce(
    (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 0),
    0
  );
  const total = totalProduits + fraisPort;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ajoute ici ta logique de validation et d'enregistrement
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
            value={phone}
            onChange={setPhone}
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
        {/* Toggle button for facturation */}
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

        {/* Second formulaire si activé */}
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
                value={phoneFact}
                onChange={setPhoneFact}
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
            <span>Frais de port estimés</span>
            <span>{fraisPort.toFixed(2)}€</span>
          </div>
          <div className={styles.totalLine}>
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Checkout;
