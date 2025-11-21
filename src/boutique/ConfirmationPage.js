import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import config from "../config.js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export default function ConfirmationPage() {
  const [message, setMessage] = useState("Vérification du paiement...");
  // Déclaration du state pour bloquer les appels multiples
  const [isProcessing, setIsProcessing] = useState(false);
  const invoked = React.useRef(false);

  useEffect(() => {
    if (invoked.current) return;
    invoked.current = true;

    async function verifyAndUpdate() {
      if (isProcessing) return; // Stop si déjà en traitement
      setIsProcessing(true);
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

        const relayInfo = JSON.parse(
          localStorage.getItem("relayInfo") || "null"
        );
        let idLivraison = localStorage.getItem("idLivraison");
        if (relayInfo) {
          try {
            const token = localStorage.getItem("token");
            const responseRelay = await fetch(
              `${config.apiUrl}/persist-adresse-mondial-relay`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token,
                },
                body: JSON.stringify({
                  lg_adr1: relayInfo.lg_adr1,
                  information: relayInfo.information,
                  lg_adr3: relayInfo.lg_adr3,
                  cp: relayInfo.cp,
                  ville: relayInfo.ville,
                  prenom_livraison: relayInfo.prenom_livraison,
                  nom_livraison: relayInfo.nom_livraison,
                  num: relayInfo.num,
                }),
              }
            );
            const dataRelay = await responseRelay.json();
            const idLivraison = dataRelay.id_livraison || dataRelay.id;

            if (!idLivraison) {
              setMessage(
                "Erreur lors de la sauvegarde de l'adresse Mondial Relay (pas d'id reçu)"
              );
              return;
            }

            // Utilise cet id directement pour la commande !
            const idFacturation = localStorage.getItem("idFacturation");
            const modeLivraison = localStorage.getItem("modeLivraison");
            console.log(
              "idFacturation:",
              idFacturation,
              "idLivraison:",
              idLivraison,
              "modeLivraison:",
              modeLivraison
            );

            const response = await fetch(`${config.apiUrl}/cart/payee`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
              },
              body: JSON.stringify({
                idFacturation,
                idLivraison,
                modeLivraison,
              }),
            });

            if (response.ok) {
              localStorage.removeItem("panier");
              localStorage.removeItem("idFacturation");
              localStorage.removeItem("idLivraison");
              localStorage.removeItem("relayInfo");
              localStorage.removeItem("modeLivraison");
              setMessage(
                "Merci pour votre commande ! Votre paiement a été accepté."
              );
            } else {
              setMessage("Erreur lors de la mise à jour de la commande.");
            }
            return; // <-- Important : ne pas poursuivre la suite du useEffect
          } catch (err) {
            setMessage(
              "Erreur lors de la sauvegarde de l'adresse Mondial Relay."
            );
            return;
          }
        }
        // Ici, le workflow classique "adresse classique" (sinon relayInfo)

        // Récupération des IDs d'adresse stockés localement
        const idFacturation = localStorage.getItem("idFacturation");
        const modeLivraison = localStorage.getItem("modeLivraison");
        /*if (!idFacturation || !idLivraison) {
          setMessage("Commande déjà finalisée ou informations manquantes.");
          return;
        }*/
        console.log(
          "idFacturation:",
          idFacturation,
          "idLivraison:",
          idLivraison,
          "modeLivraison:",
          modeLivraison
        );

        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${config.apiUrl}/cart/payee`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              idFacturation,
              idLivraison,
              modeLivraison,
            }),
          });

          if (response.ok) {
            localStorage.removeItem("panier");
            localStorage.removeItem("idFacturation");
            localStorage.removeItem("idLivraison");
            localStorage.removeItem("relayInfo");
            localStorage.removeItem("modeLivraison");
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
      setIsProcessing(false);
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
