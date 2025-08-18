import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3001/liste-produits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(
        data.map((p) => ({
          ...p,
          id_categorie_produit: p.id_categorie_produit ? Number(p.id_categorie_produit) : null,
          nom_categorie: p.nom_categorie || "",
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/connexion");

    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3001/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [token, navigate]);

  // Filtrage insensible à la casse et accents
  const normalizeText = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProducts = products.filter((p) => {
    const textMatch = normalizeText(p.nom_produit || "").includes(normalizeText(searchTerm));
    const catMatch = categoryFilter ? p.id_categorie_produit === Number(categoryFilter) : true;
    return textMatch && catMatch;
  });

  const openEditModal = (product = null) => {
    setModalProduct(
      product
        ? { ...product }
        : { nom_produit: "", prix: "", quantite_stock: "", id_categorie_produit: "" }
    );
    setErrors({});
    setOpenModal(true);
  };

  const handleModalChange = (e) => {
  const { name, value } = e.target;
  setModalProduct((prev) => ({
    ...prev,
    [name]: value, // on stocke toujours la valeur brute
  }));
};
 const validate = () => {
  const newErrors = {};
  if (!modalProduct.nom_produit?.trim()) newErrors.nom_produit = "Nom requis";
  if (!modalProduct.prix?.toString().trim()) newErrors.prix = "Prix requis";
  if (!modalProduct.quantite_stock?.toString().trim()) newErrors.quantite_stock = "Quantité requise";
  if (!modalProduct.id_categorie_produit) newErrors.id_categorie_produit = "Catégorie requise";

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleModalSubmit = async () => {
  if (!validate()) return; // bloque si champ vide

  const payload = {
    ...modalProduct,
    prix: Number(modalProduct.prix),
    quantite_stock: Number(modalProduct.quantite_stock),
    id_categorie_produit: Number(modalProduct.id_categorie_produit),
  };

  const isEdit = !!modalProduct.id;
  const url = isEdit
    ? `http://localhost:3001/produit/${modalProduct.id}`
    : `http://localhost:3001/produit`;

  try {
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Erreur API");

    await fetchProducts(); // recharge la liste
    setOpenModal(false);
    setModalProduct(null);
    setErrors({});
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la sauvegarde");
  }
};

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      const res = await fetch(`http://localhost:3001/produit/${deleteProduct.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur API");

      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const columns = [
    { field: "nom_produit", headerName: "Nom", width: 200 },
    { field: "prix", headerName: "Prix", width: 100 },
    { field: "quantite_stock", headerName: "Quantité", width: 100 },
    { field: "nom_categorie", headerName: "Catégorie", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => (
        <div style={{ display: "flex", gap: 8, alignItems: "center", height: "100%" }}>
          <Button
            onClick={() => openEditModal(params.row)}
            variant="contained"
            color="primary"
            size="small"
          >
            Modifier
          </Button>
          <Button
            onClick={() => setDeleteProduct(params.row)}
            variant="contained"
            color="error"
            size="small"
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Liste des produits</h2>
        <Button variant="contained" color="success" onClick={() => openEditModal()}>
          Ajouter
        </Button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <TextField
          label="Rechercher"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FormControl style={{ minWidth: 180 }}>
          <InputLabel>Catégorie</InputLabel>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">Toutes</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nom_categorie}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div style={{ height: 600, width: "100%" }}>
        <DataGrid rows={filteredProducts} columns={columns} pageSize={10} />
      </div>

      {/* Modal ajout/modif */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>
          {modalProduct?.id
            ? `Modifier le produit : ${modalProduct.nom_produit}`
            : "Ajouter un produit"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            name="nom_produit"
            fullWidth
            margin="dense"
            value={modalProduct?.nom_produit || ""}
            onChange={handleModalChange}
            error={!!errors.nom_produit}
            helperText={errors.nom_produit}
          />
          <TextField
            label="Prix"
            name="prix"
            type="number"
            fullWidth
            margin="dense"
            value={modalProduct?.prix || ""}
            onChange={handleModalChange}
            InputProps={{
              inputProps: { min: 0 },
              style: { MozAppearance: "textfield" },
            }}
            sx={{
              "& input[type=number]::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
              "& input[type=number]::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
            }}
            error={!!errors.prix}
            helperText={errors.prix}
          />
          <TextField
            label="Quantité"
            name="quantite_stock"
            type="number"
            fullWidth
            margin="dense"
            value={modalProduct?.quantite_stock || ""}
            onChange={handleModalChange}
            InputProps={{
              inputProps: { min: 0 },
              style: { MozAppearance: "textfield" },
            }}
            sx={{
              "& input[type=number]::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
              "& input[type=number]::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
            }}
            error={!!errors.quantite_stock}
            helperText={errors.quantite_stock}
          />

          <FormControl fullWidth margin="dense" error={!!errors.id_categorie_produit}>

          <TextField
          select
          label="Catégorie"
          name="id_categorie_produit"
          fullWidth
          margin="dense"
          value={modalProduct?.id_categorie_produit || ""}
          onChange={handleModalChange}
          error={!!errors.id_categorie_produit}
          helperText={errors.id_categorie_produit || ""} 
        >
          <MenuItem value="">-- Sélectionner --</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nom_categorie}
            </MenuItem>
          ))}
        </TextField>

  {errors.id_categorie_produit && (
    <p style={{ color: "red", fontSize: 12, margin: 0 }}>
      {errors.id_categorie_produit}
    </p>
  )}
</FormControl>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleModalSubmit} color="primary">
            {modalProduct?.id ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={!!deleteProduct} onClose={() => setDeleteProduct(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment supprimer <strong>{deleteProduct?.nom_produit}</strong> ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProduct(null)} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
