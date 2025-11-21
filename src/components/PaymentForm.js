import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const styles = {
  form: {
    maxWidth: 450,
    margin: "32px auto",
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    boxShadow: "0 0 8px rgba(0,0,0,0.1)",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: "#2d3748",
  },
  label: {
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: 6,
    display: "block",
  },
  stripeElementContainer: {
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 6,
    marginBottom: 18,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 16,
    borderRadius: 6,
    border: "1.5px solid #e2e8f0",
    marginBottom: 18,
    boxSizing: "border-box",
    outlineOffset: 2,
    transition: "border-color 0.2s ease",
  },
  button: {
    width: "100%",
    padding: 14,
    backgroundColor: "#3182ce",
    borderRadius: 6,
    border: "none",
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  buttonDisabled: {
    backgroundColor: "#a0aec0",
    cursor: "not-allowed",
  },
  error: {
    color: "#e53e3e",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  success: {
    color: "#38a169",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
};

const PaymentForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [cardHolder, setCardHolder] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    console.log("l’utilisateur soumet bien le formulaire de paiement");
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");
    setSuccess(false);

    try {
      // Confirmer le paiement avec Payment Element (carte + Paypal)
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: process.env.REACT_APP_CONFIRM_URL,
        },
        // redirect: "if_required" par défaut
      });

      if (result.error) {
        console.log("Erreur Stripe:", result.error);
        setError(result.error.message);
        setSuccess(false);
      } else if (result.paymentIntent) {
        console.log("PaymentIntent reçu:", result.paymentIntent);
        if (result.paymentIntent.status === "succeeded") {
          setSuccess(true);
          setError("");
          onPaymentSuccess && onPaymentSuccess(result.paymentIntent);
        } else {
          console.log("PaymentIntent status:", result.paymentIntent.status);
        }
      }
    } catch (err) {
      console.error("Exception lors du paiement:", err);
      setError("Erreur lors du paiement. Veuillez réessayer.");
      setSuccess(false);
    }

    setProcessing(false);
  };

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <label style={styles.label}>Moyen de paiement</label>
      <div style={styles.stripeElementContainer}>
        <PaymentElement />
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}
      {success && (
        <div role="alert" style={styles.success}>
          Paiement réussi ! Merci pour votre commande.
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...styles.button,
          ...(processing || !stripe ? styles.buttonDisabled : {}),
        }}
      >
        {processing ? "Paiement en cours..." : "Payer"}
      </button>
    </form>
  );
};

export default PaymentForm;
