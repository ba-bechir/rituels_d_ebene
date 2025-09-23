import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "../css/boutique/Panier.module.css";

export default function Panier() {
  const [panier, setPanier] = useState([]);

  useEffect(() => {
    const panierStocke = JSON.parse(localStorage.getItem("panier")) || [];
    setPanier(panierStocke);
  }, []);

  const updateLocalStorageAndState = (newPanier) => {
    localStorage.setItem("panier", JSON.stringify(newPanier));
    setPanier(newPanier);
  };

  const diminuerQuantite = (id) => {
    const newPanier = panier.map((item) => {
      console.log(
        item.nom,
        "quantite:",
        item.quantite,
        "stock:",
        item.quantite_stock,
        typeof item.quantite_stock
      );
      const stockDisponible = Number(item.quantite_stock) || 0;
      const canIncrease = item.quantite < stockDisponible;
      if (item.id === id) {
        return {
          ...item,
          quantite: item.quantite > 1 ? item.quantite - 1 : 1,
        };
      }
      return item;
    });
    updateLocalStorageAndState(newPanier);
  };

  const augmenterQuantite = (id) => {
    let quantiteChangee = false;
    const newPanier = panier.map((item) => {
      if (item.id === id) {
        const stockDisponible = Number(item.quantite_stock) || 0;
        if (item.quantite < stockDisponible) {
          quantiteChangee = true;
          return {
            ...item,
            quantite: item.quantite + 1,
          };
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
    }
  };

  const supprimerProduit = (id) => {
    const newPanier = panier.filter((item) => item.id !== id);
    updateLocalStorageAndState(newPanier);
  };

  const total = panier.reduce(
    (sum, item) => sum + Number(item.prix) * item.quantite,
    0
  );

  if (panier.length === 0) {
    return <p className={styles.empty}>Votre panier est vide.</p>;
  }

  return (
    <section className={styles.cartContainer}>
      <h1 className={styles.title}>Votre panier</h1>
      <ul className={styles.cartList}>
        {panier.map((item) => {
          const stockDisponible = Number(item.quantite_stock) || 0;
          const canIncrease = item.quantite < stockDisponible;
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
                    Prix unitaire : {Number(item.prix).toFixed(2)} €
                  </p>
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
                <span className={styles.qtyValue}>{item.quantite}</span>
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
                {(Number(item.prix) * item.quantite).toFixed(2)} €
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
      <div className={styles.totalContainer}>
        <strong>Total : {total.toFixed(2)} €</strong>
      </div>
    </section>
  );
}
