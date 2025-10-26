import React, { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Styles réutilisables
const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "18px",
      color: "#32325d",
      fontFamily: "inherit",
      "::placeholder": { color: "#b1b4bb" },
    },
    invalid: { color: "#fa755a" },
  },
};

const labelStyle = {
  marginBottom: 5,
  fontWeight: 500,
  fontSize: 15,
  color: "#63677c",
};
const inputContainer = {
  background: "#fff",
  border: "1.5px solid #dde3ec",
  borderRadius: 5,
  padding: "12px 14px",
  marginBottom: 17,
  display: "flex",
  alignItems: "center",
};
const addressBoxStyle = {
  border: "1.5px solid #bbb",
  borderRadius: 7,
  padding: "14px 16px 12px 16px",
  marginBottom: 22,
  background: "#f9f9f9",
  color: "#3c3c3c",
};

function BillingAddressEditModal({ address, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    prenom_facturation: address?.prenom_facturation || "",
    nom_facturation: address?.nom_facturation || "",
    adresse_facturation: address?.adresse_facturation || "",
    complement_adresse_facturation:
      address?.complement_adresse_facturation || "",
    code_postal_facturation: address?.code_postal_facturation || "",
    ville_facturation: address?.ville_facturation || "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = () => {
    onSave(formData);
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
          width: "94%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginBottom: 20 }}>Modifier l'adresse de facturation</h3>
        <div>
          {[
            { label: "Prénom", name: "prenom_facturation" },
            { label: "Nom", name: "nom_facturation" },
            { label: "Adresse", name: "adresse_facturation" },
            {
              label: "Complément d'adresse",
              name: "complement_adresse_facturation",
              required: false,
            },
            {
              label: "Code postal",
              name: "code_postal_facturation",
              pattern: "[0-9]{5}",
              maxLength: 5,
            },
            { label: "Ville", name: "ville_facturation" },
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
              type="button"
              onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}

const PaymentForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardHolder, setCardHolder] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [showBillingEditor, setShowBillingEditor] = useState(false);

  // Chargement dynamique de l'adresse de facturation pour matcher la route
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.REACT_APP_API_URL}/adresse-facturation`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        console.log("[DEBUG] GET /adresse-facturation status", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("[DEBUG] billingAddress initial load:", data);
        setBillingAddress(data);
      });
  }, []);

  const handleBillingSave = async (newAddress) => {
    console.log("handleBillingSave appelé avec:", newAddress);
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/adresse-facturation`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(newAddress),
      }
    );
    console.log("Réponse brute du PUT:", res);
    if (res.ok) {
      const updated = await res.json();
      console.log("[DEBUG] updated:", updated);
      setBillingAddress(updated);
      setShowBillingEditor(false);
    } else {
      alert("Erreur lors de la mise à jour de l'adresse de facturation");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const cardNumberElement = elements.getElement(CardNumberElement);

    const response = await fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000 }),
    });
    const { clientSecret } = await response.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumberElement,
        billing_details: billingAddress
          ? {
              name: cardHolder,
              address: {
                line1: billingAddress.adresse_facturation,
                line2: billingAddress.complement_adresse_facturation || "",
                city: billingAddress.ville_facturation,
                postal_code: billingAddress.code_postal_facturation,
                country: "FR",
              },
            }
          : { name: cardHolder },
      },
    });

    setProcessing(false);

    if (result.error) {
      setError(result.error.message);
      setSuccess(false);
    } else if (
      result.paymentIntent &&
      result.paymentIntent.status === "succeeded"
    ) {
      setSuccess(true);
      setError(null);
      onPaymentSuccess && onPaymentSuccess(result.paymentIntent);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 480,
        minWidth: 330,
        margin: "0 auto",
        background: "#fafafa",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
      autoComplete="off"
    >
      <h4
        style={{
          fontSize: 21,
          fontWeight: 700,
          textAlign: "left",
          color: "#222",
          marginBottom: 16,
        }}
      >
        Paiement sécurisé
      </h4>
      {billingAddress && (
        <>
          <div style={addressBoxStyle}>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 3,
                display: "flex",
                alignItems: "center",
              }}
            >
              Adresse de facturation
              <button
                onClick={() => setShowBillingEditor(true)}
                style={{
                  marginLeft: 12,
                  color: "#2671ff",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                }}
                type="button"
              >
                Changer
              </button>
            </div>
            <div>
              {billingAddress.nom_facturation}{" "}
              {billingAddress.prenom_facturation} <br />
              {billingAddress.adresse_facturation}&nbsp;
              {billingAddress.complement_adresse_facturation && (
                <span>
                  {billingAddress.complement_adresse_facturation}
                  <br />
                </span>
              )}
              {billingAddress.code_postal_facturation}{" "}
              {billingAddress.ville_facturation}
            </div>
          </div>
          {showBillingEditor && (
            <BillingAddressEditModal
              address={billingAddress}
              onSave={handleBillingSave}
              onCancel={() => setShowBillingEditor(false)}
            />
          )}
        </>
      )}

      <label htmlFor="cardHolder" style={labelStyle}>
        Titulaire de la carte
      </label>
      <input
        id="cardHolder"
        value={cardHolder}
        onChange={(e) => setCardHolder(e.target.value)}
        style={{
          ...inputContainer,
          marginBottom: 18,
        }}
        type="text"
        placeholder="Nom Prénom"
        required
        autoComplete="cc-name"
      />

      <label style={labelStyle}>Numéro de la carte</label>
      <div style={inputContainer}>
        <CardNumberElement options={ELEMENT_STYLE} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Date d'expiration</label>
          <div style={inputContainer}>
            <CardExpiryElement options={ELEMENT_STYLE} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Code de sécurité</label>
          <div style={inputContainer}>
            <CardCvcElement options={ELEMENT_STYLE} />
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: "#fa755a",
            marginBottom: 20,
            textAlign: "center",
            fontSize: 17,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            color: "#187a2f",
            marginBottom: 18,
            textAlign: "center",
            fontSize: 17,
          }}
        >
          Paiement réussi ! Merci pour votre commande.
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          background: "#2671ff",
          color: "#fff",
          padding: "16px 0",
          width: "100%",
          border: "none",
          borderRadius: 8,
          fontSize: 19,
          fontWeight: 700,
          cursor: processing ? "not-allowed" : "pointer",
          marginTop: 15,
          transition: "background 0.2s",
        }}
      >
        {processing ? "Paiement en cours..." : "Payer"}
      </button>
    </form>
  );
};

export default PaymentForm;
