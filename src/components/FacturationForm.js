import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

function FacturationForm({ address, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    prenom_livraison: address?.prenom_livraison || "",
    nom_livraison: address?.nom_livraison || "",
    adresse_livraison: address?.adresse_livraison || "",
    complement_adresse_livraison: address?.complement_adresse_livraison || "",
    code_postal_livraison: address?.code_postal_livraison || "",
    ville_livraison: address?.ville_livraison || "",
  });

  const [telephoneLivraison, setTelephoneLivraison] = useState(
    address?.telephone_livraison || ""
  );
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
  const [telephoneFacturation, setTelephoneFacturation] = useState("");

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

  const sharedInputStyle = {
    borderRadius: 8,
    border: "1.8px solid #ddd",
    padding: "10px 14px",
    fontSize: 15,

    transition: "border-color 0.3s",
    width: "100%",
    boxSizing: "border-box",
  };

  const sharedLabelStyle = {
    fontWeight: 600,
    marginBottom: 6,
    fontSize: 16,
    color: "#444",
    userSelect: "none",
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.48)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          maxWidth: 520,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          padding: 32,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#333",
        }}
      >
        <h2
          style={{
            marginBottom: 24,
            fontWeight: 700,
            fontSize: "1.8rem",
            color: "#222",
            textAlign: "center",
          }}
        >
          Modifier l'adresse de livraison
        </h2>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
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
            <div
              key={name}
              style={{
                marginBottom: 18,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <label htmlFor={name} style={sharedLabelStyle}>
                {label}
                {required && (
                  <span style={{ color: "#e00", marginLeft: 4 }}>*</span>
                )}
              </label>
              <input
                id={name}
                type="text"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={required}
                pattern={pattern}
                maxLength={maxLength}
                placeholder={`Entrez votre ${label.toLowerCase()}`}
                style={sharedInputStyle}
                onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              />
            </div>
          ))}

          <div
            style={{
              marginBottom: 22,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <label htmlFor="telephoneLivraison" style={sharedLabelStyle}>
              Téléphone <span style={{ color: "#e00" }}>*</span>
            </label>
            <PhoneInput
              international
              defaultCountry="FR"
              countrySelectAriaLabel="Sélectionnez votre pays"
              id="telephoneLivraison"
              value={telephoneLivraison}
              onChange={setTelephoneLivraison}
              placeholder="Numéro de téléphone*"
              required
              inputComponent={(props) => (
                <input
                  {...props}
                  style={sharedInputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#2671ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                />
              )}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 24,
              gap: 12,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <label
              style={{
                position: "relative",
                display: "inline-block",
                width: 48,
                height: 26,
                backgroundColor: showFacturation ? "#2671ff" : "#ccc",
                borderRadius: 26,
                transition: "background-color 0.3s",
              }}
            >
              <input
                type="checkbox"
                checked={showFacturation}
                onChange={() => setShowFacturation((v) => !v)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0,
                  position: "absolute",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: showFacturation ? 22 : 2,
                  width: 22,
                  height: 22,
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "left 0.3s",
                }}
              ></span>
            </label>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#444" }}>
              Adresse de facturation différente
            </span>
          </div>

          {showFacturation && (
            <div
              style={{
                marginBottom: 24,
                padding: 20,
                borderRadius: 10,
                border: "1px solid #ddd",
                backgroundColor: "#f9faff",
              }}
            >
              <h3
                style={{
                  marginBottom: 16,
                  fontWeight: 700,
                  fontSize: 18,

                  paddingBottom: 6,
                }}
              >
                Adresse de facturation
              </h3>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { name: "prenom", placeholder: "Prénom*" },
                  { name: "nom", placeholder: "Nom*" },
                ].map(({ name, placeholder }) => (
                  <input
                    key={name}
                    type="text"
                    name={name}
                    placeholder={placeholder}
                    value={formFacturation[name]}
                    onChange={handleChangeFacturation}
                    required
                    style={{
                      flex: "1 1 45%",
                      padding: 10,
                      marginBottom: 14,
                      borderRadius: 8,
                      border: "1.8px solid #ddd",
                      fontSize: 15,
                      outlineColor: "#2671ff",
                      transition: "border-color 0.3s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2671ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                  />
                ))}
              </div>

              <select
                name="pays"
                value={formFacturation.pays}
                onChange={handleChangeFacturation}
                style={{
                  width: "100%",
                  padding: 10,
                  marginBottom: 14,
                  borderRadius: 8,
                  border: "1.8px solid #ddd",
                  fontSize: 15,
                  outlineColor: "#2671ff",
                  transition: "border-color 0.3s",
                }}
                aria-label="Pays"
              >
                <option value="France">France</option>
              </select>

              {[
                { name: "adresse", placeholder: "Adresse*" },
                { name: "complement", placeholder: "Complément d'adresse" },
              ].map(({ name, placeholder }) => (
                <input
                  key={name}
                  type="text"
                  name={name}
                  placeholder={placeholder}
                  value={formFacturation[name]}
                  onChange={handleChangeFacturation}
                  required={name === "adresse"}
                  style={{
                    width: "100%",
                    padding: 10,
                    marginBottom: 14,
                    borderRadius: 8,
                    border: "1.8px solid #ddd",
                    fontSize: 15,
                    outlineColor: "#2671ff",
                    transition: "border-color 0.3s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2671ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                />
              ))}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { name: "codePostal", placeholder: "Code postal*" },
                  { name: "ville", placeholder: "Ville*" },
                ].map(({ name, placeholder }) => (
                  <input
                    key={name}
                    type="text"
                    name={name}
                    placeholder={placeholder}
                    value={formFacturation[name]}
                    onChange={handleChangeFacturation}
                    required
                    style={{
                      flex: "1 1 45%",
                      padding: 10,
                      marginBottom: 14,
                      borderRadius: 8,
                      border: "1.8px solid #ddd",
                      fontSize: 15,
                      outlineColor: "#2671ff",
                      transition: "border-color 0.3s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2671ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                  />
                ))}

                <div style={{ flex: "1 1 100%", marginTop: 8 }}>
                  <PhoneInput
                    international
                    defaultCountry="FR"
                    countrySelectAriaLabel="Sélectionnez votre pays"
                    value={telephoneFacturation}
                    onChange={setTelephoneFacturation}
                    placeholder="Numéro de téléphone*"
                    required
                    inputComponent={(props) => (
                      <input
                        {...props}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 8,
                          border: "1.8px solid #ddd",
                          fontSize: 15,
                          outlineColor: "#2671ff",
                          transition: "border-color 0.3s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#2671ff")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 28,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "12px 0",
                fontWeight: 600,
                borderRadius: 8,
                border: "1.8px solid #ccc",
                backgroundColor: "white",
                cursor: "pointer",
                transition: "background-color 0.3s, border-color 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
                e.currentTarget.style.borderColor = "#999";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#ccc";
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px 0",
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                backgroundColor: "#2671ff",
                color: "white",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(38, 113, 255, 0.5)",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1a56db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2671ff";
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

export default FacturationForm;
