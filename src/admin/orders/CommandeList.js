import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config.js";

function CommandeList() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCommandes() {
      try {
        const res = await fetch(`${config.apiUrl}/list-commandes`);
        const data = await res.json();
        setCommandes(data);
      } catch (error) {
        console.error("Erreur récupération commandes :", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCommandes();
  }, []);

  if (loading) return <p>Chargement des commandes...</p>;

  return (
    <div>
      <h2>Liste des commandes</h2>
      <table>
        <thead>
          <tr>
            <th>N° Commande</th>
            <th>Date</th>
            <th>Détail</th>
          </tr>
        </thead>
        <tbody>
          {commandes.length === 0 ? (
            <tr>
              <td colSpan={3}>Aucune commande disponible.</td>
            </tr>
          ) : (
            commandes.map((commande) => (
              <tr key={commande.id_commande}>
                <td>{commande.id_commande}</td>
                <td>{new Date(commande.created_at).toLocaleString("fr-FR")}</td>
                <td>
                  <button
                    onClick={() =>
                      navigate(`/details-commande/${commande.id_commande}`)
                    }
                  >
                    Détail
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CommandeList;
