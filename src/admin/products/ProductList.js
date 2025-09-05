import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { TextField, MenuItem, Select, FormControl, InputLabel, Button,  Dialog,  DialogTitle, DialogContent, DialogActions, Snackbar, Alert, RadioGroup, 
  FormControlLabel, Radio, FormLabel, FormHelperText} from "@mui/material";
import config from '../../config.js';
import '../../css/admin/products/ProductList.css'; // import du CSS

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/liste-produits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(data.map((p) => ({
        ...p,
        id_categorie_produit: p.id_categorie_produit ? Number(p.id_categorie_produit) : null,
        nom_categorie: p.nom_categorie || "",
        prix: p.prix || 0,
        quantite_stock: p.quantite_stock || 0,
        quantite_en_g: p.quantite_en_g || 0,
        quantite_en_sachet: p.quantite_en_sachet || 0,
        mode_vente: p.quantite_en_g ? 'gramme' : 'boite'
    })));

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/connexion");

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/categories`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [token, navigate]);

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
    ? { ...product } // si c’est une édition, tu peux aussi ajouter les champs manquants pour être sûr
    : { 
        nom_produit: "", 
        prix: "", 
        quantite_stock: "", 
        id_categorie_produit: "", 
        mode_vente: "",          // obligatoire pour le RadioGroup
        quantite_en_g: "" // quantité en grammes
      }
);

    setErrors({});
    setOpenModal(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalProduct((prev) => ({ ...prev, [name]: value }));
  };

  console.log(modalProduct)

  const validate = () => {
    const newErrors = {};
    if (!modalProduct.nom_produit?.trim()) newErrors.nom_produit = "Nom requis";
    if (!modalProduct.prix?.toString().trim()) newErrors.prix = "Prix requis";
    if (!modalProduct.quantite_stock?.toString().trim()) newErrors.quantite_stock = "Quantité requise";
    if (!modalProduct.id_categorie_produit) newErrors.id_categorie_produit = "Catégorie requise";
    if (!modalProduct.nom_produit?.trim()) newErrors.nom_produit = "Nom requis";
  if (!modalProduct.mode_vente) newErrors.mode_vente = "Mode de vente requis";

 if (modalProduct.mode_vente === "gramme") {
    if (!modalProduct.prix?.toString().trim()) newErrors.prix = "Prix requis";
    if (!modalProduct.quantite_en_g?.toString().trim()) newErrors.quantite_en_g = "Poids requis";
    if (!modalProduct.quantite_stock?.toString().trim()) newErrors.quantite_stock = "Quantité en grammes requise";

  } else if (modalProduct.mode_vente === "boite") {
    if (!modalProduct.prix?.toString().trim()) newErrors.prix = "Prix requis";
    if (!modalProduct.quantite_en_sachet?.toString().trim()) newErrors.quantite_en_sachet = "Quantité par boîte requise";

  }

  if (!modalProduct.quantite_stock?.toString().trim()) newErrors.quantite_stock = "Quantité requise";
  if (!modalProduct.id_categorie_produit) newErrors.id_categorie_produit = "Catégorie requise";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleModalSubmit = async () => {
  if (!validate()) return;

  const formData = new FormData();
  if (modalProduct.id_produit) {
    formData.append("id_produit", modalProduct.id_produit);
  }

  formData.append("nom_produit", modalProduct.nom_produit);
  formData.append("id_categorie_produit", modalProduct.id_categorie_produit);
  formData.append("description", modalProduct.description || "");
  formData.append("quantite_stock", modalProduct.quantite_stock || "");

  if (modalProduct.mode_vente === "gramme") {
    formData.append("prix", modalProduct.prix);
    formData.append("quantite_en_g", modalProduct.quantite_en_g || "");
  } else if (modalProduct.mode_vente === "boite") {
    formData.append("prix", modalProduct.prix);
    formData.append("quantite_en_sachet", modalProduct.quantite_en_sachet || "");
  }

  formData.append("mode_vente", modalProduct.mode_vente);

  if (modalProduct.image) {
    formData.append("image", modalProduct.image);
  }

    const isEdit = !!modalProduct.id_produit;
    const url = isEdit ? `${config.apiUrl}/produit/${modalProduct.id_produit}` : `${config.apiUrl}/produit`;

    try {
      console.log("Sending:", {
  prix: modalProduct.prix,
  quantite_en_g: modalProduct.quantite_en_g,
  quantite_en_sachet: modalProduct.quantite_en_sachet,
  quantite_stock: modalProduct.quantite_stock,
  mode_vente: modalProduct.mode_vente
});

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Erreur API");
      await fetchProducts();
      setOpenModal(false);
      setModalProduct(null);
      setErrors({});
      setSnackbar({ open: true, message: isEdit ? "Produit mis à jour !" : "Produit ajouté !", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors de la sauvegarde", severity: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      const res = await fetch(`${config.apiUrl}/produit/${deleteProduct.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur API");
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
      setSnackbar({ open: true, message: "Produit supprimé !", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors de la suppression", severity: "error" });
    }
  };

  const columns = [
    { field: "nom_produit", headerName: "Nom", width: 200 },
    { field: "prix", headerName: "Prix", width: 100 },
    { field: "quantite_stock", headerName: "Quantité en stock", width: 100 },
    { field: "nom_categorie", headerName: "Catégorie", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => (
        <div className="action-buttons">
          <Button onClick={() => openEditModal(params.row)} variant="contained" color="primary" size="small">Modifier</Button>
          <Button onClick={() => setDeleteProduct(params.row)} variant="contained" color="error" size="small">Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="header">
        <h2>Liste des produits</h2>
        <Button variant="contained" color="success" onClick={() => openEditModal()}>Ajouter un produit</Button>
      </div>

      <div className="filter-container">
        <TextField label="Rechercher" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <FormControl className="form-control-min-width">
          <InputLabel>Catégorie</InputLabel>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">Toutes</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.nom_categorie}</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      <div className="data-grid-container">
        <DataGrid rows={filteredProducts} columns={columns} pageSize={10} />
      </div>

      {/* Modal ajout/modif */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>{modalProduct?.id ? `Modifier le produit : ${modalProduct.nom_produit}` : "Ajouter un produit"}</DialogTitle>
        <DialogContent>
          <TextField label="Nom" name="nom_produit" fullWidth margin="dense" value={modalProduct?.nom_produit || ""} onChange={handleModalChange} error={!!errors.nom_produit} helperText={errors.nom_produit} />

          <FormControl component="fieldset" fullWidth margin="dense" error={!!errors.mode_vente}>
            <FormLabel component="legend">Mode de vente</FormLabel>
            <RadioGroup row name="mode_vente" value={modalProduct?.mode_vente || ""} onChange={handleModalChange} className="radio-group-container">
              {["gramme", "boite"].map((option) => (
                <FormControlLabel key={option} value={option} control={<Radio style={{ display: "none" }} />} label={option === "gramme" ? "Gramme" : "Boîte"} className={`radio-button ${modalProduct?.mode_vente === option ? "selected" : ""}`} />
              ))}
            </RadioGroup>
            {errors.mode_vente && <FormHelperText>{errors.mode_vente}</FormHelperText>}
          </FormControl>

                    {/* Champs selon mode de vente */}
          {modalProduct?.mode_vente === "gramme" && (
            <>
              <TextField
                label="Prix (€/gramme)"
                name="prix"
                type="number"
                fullWidth
                margin="dense"
                value={modalProduct?.prix || ""}
                onChange={handleModalChange}
                error={!!errors.prix}
                helperText={errors.prix}
              />
              <TextField
                label="Poids en grammes"
                name="quantite_en_g"
                type="number"
                fullWidth
                margin="dense"
                value={modalProduct?.quantite_en_g || ""}
                onChange={handleModalChange}
                error={!!errors.quantite_en_g}
                helperText={errors.quantite_en_g}
              />
              <TextField
                  label="Quantité de grammes en stock"
                  name="quantite_stock"
                  type="number"
                  fullWidth
                  margin="dense"
                  value={modalProduct?.quantite_stock || ""}
                  onChange={handleModalChange}
                  error={!!errors.quantite_stock}
                  helperText={errors.quantite_stock}
                />
                        </>
                      )}

                      {modalProduct?.mode_vente === "boite" && (
              <>
                <TextField
                  label="Prix (€/boîte)"
                  name="prix"
                  type="number"
                  fullWidth
                  margin="dense"
                  className="conditional-field"
                  value={modalProduct?.prix || ""}
                  onChange={handleModalChange}
                  error={!!errors.prix}
                  helperText={errors.prix}
                />
                <TextField
                  label="Quantité par boîte"
                  name="quantite_en_sachet"
                  type="number"
                  fullWidth
                  margin="dense"
                  className="conditional-field"
                  value={modalProduct?.quantite_en_sachet || ""}
                  onChange={handleModalChange}
                  error={!!errors.quantite_en_sachet}
                  helperText={errors.quantite_en_sachet}
                />
                <TextField
                  label="Nombre de boîtes en stock"
                  name="quantite_stock"
                  type="number"
                  fullWidth
                  margin="dense"
                  className="conditional-field"
                  value={modalProduct?.quantite_stock || ""}
                  onChange={handleModalChange}
                  error={!!errors.quantite_stock}
                  helperText={errors.quantite_stock}
                />
              </>
            )}

          <TextField select label="Catégorie" name="id_categorie_produit" fullWidth margin="dense" value={modalProduct?.id_categorie_produit || ""} onChange={handleModalChange} error={!!errors.id_categorie_produit} helperText={errors.id_categorie_produit || ""}>
            <MenuItem value="">-- Sélectionner --</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.nom_categorie}</MenuItem>)}
          </TextField>

            {/* Description commune pour les deux modes */}
          <TextField
            label="Description"
            name="description"
            multiline
            rows={3}
            fullWidth
            margin="dense"
            className="conditional-field"
            value={modalProduct?.description || ""}
            onChange={handleModalChange}
            error={!!errors.description}
            helperText={errors.description}
          />

          <TextField type="file" fullWidth margin="dense" onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              setModalProduct((prev) => ({ ...prev, image: file }));
              const reader = new FileReader();
              reader.onloadend = () => { setModalProduct((prev) => ({ ...prev, preview: reader.result })); };
              reader.readAsDataURL(file);
            }
          }} helperText="Choisir une image pour le produit" />

          {modalProduct?.preview && <img src={modalProduct.preview} alt="Produit" className="modal-image" />}
          {!modalProduct?.preview && modalProduct?.image && <img src={typeof modalProduct.image === "string" ? `data:image/jpeg;base64,${modalProduct.image}` : URL.createObjectURL(modalProduct.image)} alt="Produit" className="modal-image" />}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="secondary">Annuler</Button>
          <Button onClick={handleModalSubmit} color="primary">{modalProduct?.id ? "Mettre à jour" : "Ajouter"}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={!!deleteProduct} onClose={() => setDeleteProduct(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>Voulez-vous vraiment supprimer <strong>{deleteProduct?.nom_produit}</strong> ?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProduct(null)} color="secondary">Annuler</Button>
          <Button onClick={handleDelete} color="error">Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} style={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
