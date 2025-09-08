import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import config from "../../config.js";

function ModifierProduit() {
  const { id } = useParams(); // récupère l'id du produit depuis l'URL
  const [produit, setProduit] = useState({
    nom_produit: "",
    prix: "",
    quantite_stock: "",
    id_categorie: "",
    description: "",
    bienfait: "",
    mode_d_emploi: "",
    contre_indication: "",
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/connexion");
      return;
    }

    // Récupérer le produit existant
    const fetchProduit = async () => {
      console.log("fetchProduit appelé");
      try {
        const response = await fetch(`${config.apiUrl}/produit/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log(data);
        setProduit({
          nom_produit: data.nom_produit,
          prix: data.prix,
          quantite_stock: data.quantite_stock,
          id_categorie: data.id_categorie,
          description: data.description,
          bienfait: data.bienfait || "",
          mode_d_emploi: data.mode_d_emploi || "",
          contre_indication: data.contre_indication || "",
        });
      } catch (err) {
        console.error(err);
        setMessage("Erreur serveur");
      }
    };

    // Récupérer la liste des catégories pour le select
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProduit();
    fetchCategories();
  }, [id, navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`${name} changé à`, value);
    setProduit({ ...produit, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const produitToSend = {
        nom_produit: produit.nom_produit,
        prix: produit.prix,
        quantite_stock: produit.quantite_stock,
        id_categorie_produit: produit.id_categorie, // clé corrigée pour backend
        description: produit.description,
        bienfait: produit.bienfait,
        mode_d_emploi: produit.mode_d_emploi,
        contre_indication: produit.contre_indication,
        // Ajoutez ici mode_vente, quantite_en_g, quantite_en_sachet si nécessaire
      };

      const response = await fetch(`${config.apiUrl}/produit/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(produitToSend),
      });

      if (response.ok) {
        setMessage("Produit mis à jour avec succès");
        setTimeout(() => navigate("/liste-produits"), 1500);
      } else {
        setMessage("Impossible de mettre à jour le produit");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur");
    }
  };

  return (
    <div>
      <h2>Modifier le produit</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Nom du produit</label>
          <input
            type="text"
            name="nom_produit"
            value={produit.nom_produit}
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
            value={produit.prix}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label>Quantité en stock</label>
          <input
            type="number"
            name="quantite_stock"
            value={produit.quantite_stock}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label>Catégorie</label>
          <select
            name="id_categorie"
            value={produit.id_categorie}
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

        <div className="mb-3">
          <label>Description</label>
          <textarea
            name="description"
            value={produit.description}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label>Bienfait</label>
          <Editor
            apiKey="5980sbu4qcqa2kud4o26a9rfa2zvbn8iv3ttyv0yo3r7o9jx"
            value={produit.bienfait}
            init={{
              height: 150,
              menubar: false,
              plugins: [
                "advlist",
                "lists",
                "charmap",
                "anchor",
                "searchreplace",
                "visualblocks",
              ],
              toolbar:
                "undo redo | bold italic underline | bullist numlist | link image media | removeformat",
            }}
            onEditorChange={(content) =>
              setProduit({ ...produit, bienfait: content })
            }
          />
        </div>

        <div className="mb-3">
          <label>Mode d'emploi</label>
          <Editor
            apiKey="5980sbu4qcqa2kud4o26a9rfa2zvbn8iv3ttyv0yo3r7o9jx"
            value={produit.mode_d_emploi}
            init={{
              height: 150,
              menubar: false,
              plugins: [
                "advlist",
                "lists",
                "charmap",
                "anchor",
                "searchreplace",
                "visualblocks",
              ],
              toolbar:
                "undo redo | bold italic underline | bullist numlist | link image media | removeformat",
            }}
            onEditorChange={(content) =>
              setProduit({ ...produit, mode_d_emploi: content })
            }
          />
        </div>

        <div className="mb-3">
          <label>Contre-indication</label>
          <Editor
            apiKey="5980sbu4qcqa2kud4o26a9rfa2zvbn8iv3ttyv0yo3r7o9jx"
            value={produit.contre_indication}
            init={{
              height: 150,
              menubar: false,
              plugins: [
                "advlist",
                "lists",
                "charmap",
                "anchor",
                "searchreplace",
                "visualblocks",
              ],
              toolbar:
                "undo redo | bold italic underline | bullist numlist | link image media | removeformat",
            }}
            onEditorChange={(content) =>
              setProduit({ ...produit, contre_indication: content })
            }
          />
        </div>

        <button type="submit" className="btn btn-success">
          Mettre à jour
        </button>
      </form>
    </div>
  );
}

export default ModifierProduit;
