import React, { useEffect, useState } from "react";
import config from "../../config.js";

function CommandeList() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommandes() {
      try {
        const response = await fetch(`${config.apiUrl}/list-commandes`);
        const data = await response.json();
        setCommandes(data);
      } catch (error) {
        console.error("Erreur récupération commandes :", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCommandes();
  }, []);

  const handleDetailClick = (commande) => {
    alert("Détails commande ID : " + commande.id_commande);
  };

  if (loading) return <p>Chargement des commandes...</p>;

  return (
    <div>
      <h2>Liste des commandes</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              N° Commande
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Date</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Détail</th>
          </tr>
        </thead>
        <tbody>
          {commandes.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "8px" }}>
                Aucune commande disponible.
              </td>
            </tr>
          ) : (
            commandes.map((commande) => (
              <tr key={commande.id_commande}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {commande.id_commande}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {new Date(commande.created_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <button onClick={() => handleDetailClick(commande)}>
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
