import { useState } from "react";
import styles from "../css/InscriptionForm.module.css";

function isPasswordValid(pw) {
  return (
    pw.length >= 8 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /\w/.test(pw)
  );
}

export default function InscriptionForm() {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    pays: "France",
    email: "",
    password: "",
    confirm: "",
  });
  const [errorFields, setErrorFields] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const countries = [
    "Afghanistan",
    "Afrique du Sud",
    "Albanie",
    "Algérie",
    "Allemagne",
    "Andorre",
    "Angola",
    "Antigua-et-Barbuda",
    "Arabie Saoudite",
    "Argentine",
    "Arménie",
    "Australie",
    "Autriche",
    "Azerbaïdjan",
    "Bahamas",
    "Bahreïn",
    "Bangladesh",
    "Barbade",
    "Belgique",
    "Belize",
    "Bénin",
    "Bhoutan",
    "Biélorussie",
    "Birmanie",
    "Bolivie",
    "Bosnie-Herzégovine",
    "Botswana",
    "Brésil",
    "Brunei",
    "Bulgarie",
    "Burkina Faso",
    "Burundi",
    "Cambodge",
    "Cameroun",
    "Canada",
    "Cap-Vert",
    "Centrafrique",
    "Chili",
    "Chine",
    "Chypre",
    "Colombie",
    "Comores",
    "Congo",
    "Congo (RDC)",
    "Corée du Nord",
    "Corée du Sud",
    "Costa Rica",
    "Côte d'Ivoire",
    "Croatie",
    "Cuba",
    "Danemark",
    "Djibouti",
    "Dominique",
    "Égypte",
    "Émirats arabes unis",
    "Équateur",
    "Érythrée",
    "Espagne",
    "Estonie",
    "Eswatini",
    "États-Unis",
    "Éthiopie",
    "Fidji",
    "Finlande",
    "France",
    "Gabon",
    "Gambie",
    "Géorgie",
    "Ghana",
    "Grèce",
    "Grenade",
    "Guatemala",
    "Guinée",
    "Guinée équatoriale",
    "Guinée-Bissau",
    "Guyana",
    "Haïti",
    "Honduras",
    "Hongrie",
    "Îles Cook",
    "Îles Marshall",
    "Îles Salomon",
    "Inde",
    "Indonésie",
    "Irak",
    "Iran",
    "Irlande",
    "Islande",
    "Israël",
    "Italie",
    "Jamaïque",
    "Japon",
    "Jordanie",
    "Kazakhstan",
    "Kenya",
    "Kirghizistan",
    "Kiribati",
    "Kosovo",
    "Koweït",
    "Laos",
    "Lesotho",
    "Lettonie",
    "Liban",
    "Libéria",
    "Libye",
    "Liechtenstein",
    "Lituanie",
    "Luxembourg",
    "Macédoine",
    "Madagascar",
    "Malaisie",
    "Malawi",
    "Maldives",
    "Mali",
    "Malte",
    "Maroc",
    "Maurice",
    "Mauritanie",
    "Mexique",
    "Micronésie",
    "Moldavie",
    "Monaco",
    "Mongolie",
    "Monténégro",
    "Mozambique",
    "Namibie",
    "Nauru",
    "Népal",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Niue",
    "Norvège",
    "Nouvelle-Zélande",
    "Oman",
    "Ouganda",
    "Ouzbékistan",
    "Pakistan",
    "Palaos",
    "Palestine",
    "Panama",
    "Papouasie-Nouvelle-Guinée",
    "Paraguay",
    "Pays-Bas",
    "Pérou",
    "Philippines",
    "Pologne",
    "Portugal",
    "Qatar",
    "Roumanie",
    "Royaume-Uni",
    "Russie",
    "Rwanda",
    "Saint-Kitts-et-Nevis",
    "Saint-Marin",
    "Saint-Vincent-et-les Grenadines",
    "Sainte-Lucie",
    "Salvador",
    "Samoa",
    "Sao Tomé-et-Principe",
    "Sénégal",
    "Serbie",
    "Seychelles",
    "Sierra Leone",
    "Singapour",
    "Slovaquie",
    "Slovénie",
    "Somalie",
    "Soudan",
    "Soudan du Sud",
    "Sri Lanka",
    "Suède",
    "Suisse",
    "Suriname",
    "Syrie",
    "Tadjikistan",
    "Tanzanie",
    "Tchad",
    "République tchèque",
    "Thaïlande",
    "Timor oriental",
    "Togo",
    "Tonga",
    "Trinité-et-Tobago",
    "Tunisie",
    "Turkménistan",
    "Turquie",
    "Tuvalu",
    "Ukraine",
    "Uruguay",
    "Vanuatu",
    "Vatican",
    "Venezuela",
    "Viêt Nam",
    "Yémen",
    "Zambie",
    "Zimbabwe",
  ];

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorFields({ ...errorFields, [e.target.name]: "" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    let errors = {};
    let valid = true;

    if (!form.prenom.trim()) {
      errors.prenom = "Ce champ est obligatoire.";
      valid = false;
    }
    if (!form.nom.trim()) {
      errors.nom = "Ce champ est obligatoire.";
      valid = false;
    }
    if (!form.pays.trim()) {
      errors.pays = "Ce champ est obligatoire.";
      valid = false;
    }
    if (!form.email.trim()) {
      errors.email = "Ce champ est obligatoire.";
      valid = false;
    }
    if (!form.password) {
      errors.password = "Ce champ est obligatoire.";
      valid = false;
    } else if (!isPasswordValid(form.password)) {
      errors.password =
        "Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 majuscule, 1 chiffre et un caractère alphanumérique.";
      valid = false;
    }
    if (!form.confirm) {
      errors.confirm = "Ce champ est obligatoire.";
      valid = false;
    } else if (form.password !== form.confirm) {
      errors.confirm = "Les mots de passe ne correspondent pas.";
      valid = false;
    }

    setErrorFields(errors);

    if (valid) setSubmitted(true);
  }

  return (
    <form className={styles.formBox} onSubmit={handleSubmit}>
      <h2>Créer un compte</h2>
      <div className={styles.info}>* Champs requis</div>
      <div className={styles.fieldBlock}>
        <label className={styles.labelReq}>* Prénom</label>
        <input
          type="text"
          name="prenom"
          value={form.prenom}
          onChange={handleChange}
          className={`${styles.inputField} ${
            errorFields.prenom ? styles.inputError : ""
          }`}
        />
        {errorFields.prenom && (
          <div className={styles.error}>{errorFields.prenom}</div>
        )}
      </div>
      <div className={styles.fieldBlock}>
        <label className={styles.labelReq}>* Nom</label>
        <input
          type="text"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          className={`${styles.inputField} ${
            errorFields.nom ? styles.inputError : ""
          }`}
        />
        {errorFields.nom && (
          <div className={styles.error}>{errorFields.nom}</div>
        )}
      </div>
      <div className={styles.fieldBlock}>
        <label className={styles.labelReq}>* Pays</label>
        <select
          name="pays"
          value={form.pays}
          onChange={handleChange}
          className={`${styles.inputField} ${
            errorFields.pays ? styles.inputError : ""
          }`}
        >
          <option value="">-- Choisir un pays --</option>
          {countries.map((country) => (
            <option value={country} key={country}>
              {country}
            </option>
          ))}
        </select>
        {errorFields.pays && (
          <div className={styles.error}>{errorFields.pays}</div>
        )}
      </div>
      <div className={styles.fieldBlock}>
        <label className={styles.labelReq}>* E-mail</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className={`${styles.inputField} ${
            errorFields.email ? styles.inputError : ""
          }`}
        />
        {errorFields.email && (
          <div className={styles.error}>{errorFields.email}</div>
        )}
      </div>
      <div className={styles.fieldBlock}>
        <label className={styles.labelReq}>* Mot de passe</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className={`${styles.inputField} ${
            errorFields.password ? styles.inputError : ""
          }`}
        />
        <div className={styles.passwordInfo}>
          Celui ci doit inclure : 8 caractères minimum, 1 minuscule, 1
          majuscule, 1 chiffre et 1 caractère alphanumérique
        </div>
        {errorFields.password && (
          <div className={styles.error}>{errorFields.password}</div>
        )}
      </div>
      <div className={styles.fieldBlock}>
        <label className={styles.labelReq}>* Confirmer le mot de passe</label>
        <input
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={handleChange}
          className={`${styles.inputField} ${
            errorFields.confirm ? styles.inputError : ""
          }`}
        />
        {errorFields.confirm && (
          <div className={styles.error}>{errorFields.confirm}</div>
        )}
      </div>
      <button className={styles.submitBtn}>Créer le compte</button>
      {submitted && <div className={styles.success}>Formulaire envoyé !</div>}
    </form>
  );
}
