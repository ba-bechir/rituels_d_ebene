import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "../css/boutique/Panier.module.css";

export default function Panier() {
  const [panier, setPanier] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const panierStocke = JSON.parse(localStorage.getItem("panier")) || [];
    setPanier(panierStocke);
    console.table(panierStocke);
  }, []);

  // Met à jour localStorage + state
  const updateLocalStorageAndState = (newPanier) => {
    localStorage.setItem("panier", JSON.stringify(newPanier));
    setPanier(newPanier);
  };

  // API call pour mettre à jour la quantité en base
  const updateQuantiteBackend = async (id_produit, quantite) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/cart/quantite`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ id_produit, quantite }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      toast.success("Quantité mise à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour en base");
      console.error(error);
    }
  };

  // Diminuer la quantité localement et côté backend
  const diminuerQuantite = (id) => {
    const newPanier = panier.map((item) =>
      item.id === id
        ? { ...item, quantite: item.quantite > 1 ? item.quantite - 1 : 1 }
        : item
    );
    updateLocalStorageAndState(newPanier);
    const quantiteMaj = newPanier.find((item) => item.id === id)?.quantite || 1;
    updateQuantiteBackend(id, quantiteMaj);
  };

  // Augmenter la quantité localement et côté backend, avec contrôle stock
  const augmenterQuantite = (id) => {
    let quantiteChangee = false;
    const newPanier = panier.map((item) => {
      if (item.id === id) {
        const stockDisponible = Number(item.quantite_stock) ?? 0;
        if (item.quantite < stockDisponible) {
          quantiteChangee = true;
          return { ...item, quantite: item.quantite + 1 };
        } else {
          toast.info(
            `Stock maximal atteint pour ${item.nom} : ${stockDisponible}`
          );
        }
      }
      return item;
    });
    if (quantiteChangee) {
      updateLocalStorageAndState(newPanier);
      const quantiteMaj =
        newPanier.find((item) => item.id === id)?.quantite || 1;
      updateQuantiteBackend(id, quantiteMaj);
    }
  };

  // Supprimer produit localement et optionnellement côté backend (à gérer dans autre route)
  const supprimerProduit = async (id) => {
    // Mise à jour locale (state + localStorage)
    const newPanier = panier.filter((item) => item.id !== id);
    updateLocalStorageAndState(newPanier);

    // Supprimer en base si utilisateur connecté
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/cart/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur serveur ${response.status}`);
        }

        toast.success("Produit supprimé du panier.");
      } catch (error) {
        toast.error("Erreur lors de la suppression en base.");
        console.error("Erreur suppression panier backend :", error);
      }
    } else {
      toast.info("Connectez-vous pour synchroniser votre panier.");
    }
  };

  const total = panier.reduce(
    (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 0),
    0
  );

  // Redirection selon login
  const handleCommander = () => {
    console.table(panier);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/compte?from=checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (panier.length === 0) {
    return <p className={styles.empty}>Votre panier est vide.</p>;
  }

  return (
    <div className={styles.cartPageContainer}>
      <section className={styles.cartListColumn}>
        <h1 className={styles.title}>Mon panier</h1>
        <ul className={styles.cartList}>
          {panier.map((item) => {
            const stockDisponible = Number(item.quantite_stock) ?? 0;
            const canIncrease = (item.quantite || 0) < stockDisponible;
            return (
              <li key={item.id} className={styles.cartItem}>
                <div className={styles.productInfo}>
                  {item.image && (
                    <img
                      src={`data:image/jpeg;base64,${item.image}`}
                      alt={item.nom}
                      className={styles.productImage}
                    />
                  )}
                  <div className={styles.productDetails}>
                    <h2 className={styles.productName}>{item.nom}</h2>
                    <p className={styles.price}>
                      Prix unitaire : {(Number(item.prix) || 0).toFixed(2)} €
                    </p>
                    {item.quantite_en_sachet == null ||
                    item.quantite_en_sachet === 0
                      ? `Sachet de ${item.quantite_en_g ?? 0} g`
                      : `Boite de ${item.quantite_en_sachet ?? 0} infusions`}
                  </div>
                </div>
                <div className={styles.quantityControl}>
                  <button
                    onClick={() => diminuerQuantite(item.id)}
                    aria-label={`Diminuer la quantité de ${item.nom}`}
                    className={styles.qtyBtn}
                  >
                    -
                  </button>
                  <span className={styles.qtyValue}>{item.quantite ?? 0}</span>
                  <button
                    onClick={() => augmenterQuantite(item.id)}
                    aria-label={`Augmenter la quantité de ${item.nom}`}
                    className={styles.qtyBtn}
                    disabled={!canIncrease}
                  >
                    +
                  </button>
                </div>
                <div className={styles.subtotal}>
                  {((Number(item.prix) || 0) * (item.quantite || 0)).toFixed(2)}{" "}
                  €
                </div>
                <button
                  onClick={() => supprimerProduit(item.id)}
                  aria-label={`Supprimer ${item.nom} du panier`}
                  className={styles.deleteBtn}
                >
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <aside className={styles.summaryColumn}>
        <h2 className={styles.summaryTitle}>Récapitulatif</h2>
        <div className={styles.summaryBlock}>
          <div className={styles.summaryRow}>
            <span>
              Sous-total (
              {panier.reduce((acc, elt) => acc + (elt.quantite || 0), 0)}{" "}
              article
              {panier.reduce((acc, elt) => acc + (elt.quantite || 0), 0) > 1
                ? "s"
                : ""}
              )
            </span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Livraison</span>
            <span>Calculé à l’étape suivante</span>
          </div>
        </div>
        <div className={styles.totalEstimeRow}>
          <span className={styles.totalLabel}>Total estimé</span>
          <span className={styles.totalValue}>{total.toFixed(2)}€</span>
        </div>
        <button className={styles.commanderBtn} onClick={handleCommander}>
          COMMANDER | {total.toFixed(2)} €
        </button>
        <div className={styles.paymentIcons}>
          <img src="/cb.png" alt="CB" height={32} />
          <img src="/visa.png" alt="Visa" height={32} />
          <img src="/mastercard.png" alt="Mastercard" height={32} />
          <img src="/amex.png" alt="Amex" height={32} />
          <img src="/paypal.png" alt="Paypal" height={32} />
        </div>
        <div className={styles.secureText}>Paiement sécurisé</div>
      </aside>
    </div>
  );
}
