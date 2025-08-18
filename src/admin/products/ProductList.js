import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/connexion");
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3001/liste-produits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          // Token invalide ou rôle non-admin
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/connexion");
          return;
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setMessage("Erreur serveur");
      }
    };

    fetchProducts();
  }, [token, navigate]);

  return (
    <div>
      <h2>Liste des produits</h2>
      {message && <p>{message}</p>}

      {products.length > 0 ? (
        <table className="table">
          <thead className="thead-dark">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Nom</th>
              <th scope="col">Prix</th>
              <th scope="col">Quantité</th>
            </tr>
        </thead>
        <tbody>
    {products.map((product, index) => (
      <tr key={product.id}>
        <th scope="row">{index + 1}</th>
        <td>{product.nom_produit}</td>
        <td>{product.prix}</td>
        <td>{product.quantite_stock}</td>
      </tr>
    ))}
      </tbody>
</table>

      ) : (
        <p>Aucun produit disponible.</p>
      )}
    </div>
  );
}

export default ProductList;
