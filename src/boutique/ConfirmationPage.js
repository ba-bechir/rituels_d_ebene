import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import config from "../config.js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export default function ConfirmationPage() {
  const [message, setMessage] = useState("Vérification du paiement...");

  useEffect(() => {
    async function verifyAndUpdate() {
      const params = new URLSearchParams(window.location.search);
      const clientSecret = params.get("payment_intent_client_secret");

      if (!clientSecret) {
        setMessage("Aucun paiement à vérifier.");
        return;
      }

      const stripe = await stripePromise;
      const { paymentIntent, error } = await stripe.retrievePaymentIntent(
        clientSecret
      );

      if (error) {
        setMessage(
          "Erreur lors de la récupération du paiement : " + error.message
        );
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        setMessage("Paiement confirmé, mise à jour de votre commande...");

        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${config.apiUrl}/cart/payee`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
          });

          if (response.ok) {
            setMessage(
              "Merci pour votre commande ! Votre paiement a été accepté."
            );
          } else {
            setMessage("Erreur lors de la mise à jour de la commande.");
          }
        } catch (err) {
          setMessage("Erreur serveur : " + err.message);
        }
      } else {
        setMessage("Le paiement n'a pas pu être confirmé.");
      }
    }

    verifyAndUpdate();
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>{message}</h1>
      {message.startsWith("Merci") && (
        <p>Un email de confirmation vient de vous être envoyé.</p>
      )}
    </div>
  );
}
