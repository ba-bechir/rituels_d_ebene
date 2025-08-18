import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Récupération produits et catégories
  useEffect(() => {
    if (!token) {
      navigate("/connexion");
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3001/liste-produits", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/connexion");
          return;
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:3001/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [token, navigate]);

  const handleEdit = (product) => {
    setCurrentProduct({
      ...product,
      id_categorie_produit: product.id_categorie_produit || "",
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    try {
      const response = await fetch(
        `http://localhost:3001/produit/${currentProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(currentProduct),
        }
      );

      if (response.ok) {
        // Trouver la catégorie mise à jour
        const updatedCategory = categories.find(
          (cat) => cat.id === Number(currentProduct.id_categorie_produit)
        );

        const updatedProduct = {
          ...currentProduct,
          nom_categorie: updatedCategory ? updatedCategory.nom_categorie : "",
        };

        // Met à jour le produit dans le state
        setProducts((prev) =>
          prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );

        setShowModal(false);
        setShowSuccess(true); // Affiche modal succès
      } else {
        alert("Impossible de mettre à jour le produit");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Liste des produits</h2>

      {products.length > 0 ? (
        <table className="table">
          <thead className="thead-dark">
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Quantité</th>
              <th>Catégorie</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.id}>
                <th>{index + 1}</th>
                <td>{product.nom_produit}</td>
                <td>{product.prix}</td>
                <td>{product.quantite_stock}</td>
                <td>{product.nom_categorie}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(product)}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucun produit disponible.</p>
      )}

      {/* Modal édition */}
      {showModal && currentProduct && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content" style={{ backgroundColor: "#fff", color: "#000" }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  Modifier le produit : {currentProduct.nom_produit}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label>Nom du produit</label>
                    <input
                      type="text"
                      name="nom_produit"
                      value={currentProduct.nom_produit}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Prix</label>
                    <input
                      type="number"
                      name="prix"
                      value={currentProduct.prix}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Quantité</label>
                    <input
                      type="number"
                      name="quantite_stock"
                      value={currentProduct.quantite_stock}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Catégorie</label>
                    <select
                      name="id_categorie_produit"
                      value={currentProduct.id_categorie_produit || ""}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom_categorie}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-success me-2">
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal succès */}
      {showSuccess && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-center">
              <div className="modal-body">
                <p>Produit mis à jour avec succès</p>
                <button
                  className="btn btn-success"
                  onClick={() => setShowSuccess(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
