import { useEffect, useState, useCallback } from "react";
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
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  FormHelperText,
} from "@mui/material";
import config from "../../config.js";
import "../../css/admin/products/ProductList.css";

export default function ProductList() {
  const [rawProducts, setRawProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchAll = useCallback(async () => {
    try {
      const resCategories = await fetch(`${config.apiUrl}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriesData = await resCategories.json();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      const resProducts = await fetch(`${config.apiUrl}/liste-produits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productsData = await resProducts.json();
      setRawProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return navigate("/connexion");
    fetchAll();
    // eslint-disable-next-line
  }, [token, navigate, fetchAll]);

  useEffect(() => {
    setProducts(
      rawProducts.map((p) => ({
        ...p,
        id: p.id,
        id_categorie_produit: p.id_categorie_produit
          ? Number(p.id_categorie_produit)
          : null,
        nom_categorie:
          categories.find((c) => c.id === Number(p.id_categorie_produit))
            ?.nom_categorie || "",
        mode_vente: p.quantite_en_g ? "gramme" : "boite",
      }))
    );
  }, [rawProducts, categories]);

  const normalizeText = (text) =>
    text
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || "";

  const filteredProducts = products.filter((p) => {
    const textMatch = normalizeText(p.nom_produit).includes(
      normalizeText(searchTerm)
    );
    const catMatch = categoryFilter
      ? p.id_categorie_produit === Number(categoryFilter)
      : true;
    return textMatch && catMatch;
  });

  // Modifié : gestion image base64 ou preview fichier
  const openEditModal = (product = null) => {
    setModalProduct(
      product
        ? {
            ...product,
            // Si product.image existe en base64, on crée un data URL
            preview: product.image
              ? product.image.startsWith("data:")
                ? product.image
                : `data:image/jpeg;base64,${product.image}`
              : "",
          }
        : {
            nom_produit: "",
            prix: "",
            quantite_stock: "",
            id_categorie_produit: "",
            mode_vente: "",
            quantite_en_g: "",
            quantite_en_sachet: "",
            description: "",
            preview: "",
          }
    );
    setErrors({});
    setOpenModal(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalProduct((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!modalProduct.nom_produit?.trim()) newErrors.nom_produit = "Nom requis";
    if (!modalProduct.mode_vente) newErrors.mode_vente = "Mode de vente requis";
    if (!modalProduct.id_categorie_produit)
      newErrors.id_categorie_produit = "Catégorie requise";
    if (!modalProduct.quantite_stock?.toString().trim())
      newErrors.quantite_stock = "Quantité requise";
    if (modalProduct.mode_vente === "gramme") {
      if (!modalProduct.prix?.toString().trim()) newErrors.prix = "Prix requis";
      if (!modalProduct.quantite_en_g?.toString().trim())
        newErrors.quantite_en_g = "Poids requis";
    }
    if (modalProduct.mode_vente === "boite") {
      if (!modalProduct.prix?.toString().trim()) newErrors.prix = "Prix requis";
      if (!modalProduct.quantite_en_sachet?.toString().trim())
        newErrors.quantite_en_sachet = "Quantité par boîte requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModalSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    if (modalProduct.id) formData.append("id_produit", modalProduct.id);
    formData.append("nom_produit", modalProduct.nom_produit);
    formData.append("id_categorie_produit", modalProduct.id_categorie_produit);
    formData.append("description", modalProduct.description || "");
    formData.append("quantite_stock", modalProduct.quantite_stock || "");
    formData.append("mode_vente", modalProduct.mode_vente);
    formData.append("prix", modalProduct.prix || "");
    if (modalProduct.mode_vente === "gramme")
      formData.append("quantite_en_g", modalProduct.quantite_en_g || "");
    if (modalProduct.mode_vente === "boite")
      formData.append(
        "quantite_en_sachet",
        modalProduct.quantite_en_sachet || ""
      );
    if (modalProduct.image) formData.append("image", modalProduct.image);

    const isEdit = !!modalProduct.id;
    const url = isEdit
      ? `${config.apiUrl}/produit/${modalProduct.id}`
      : `${config.apiUrl}/produit`;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Erreur API");
      await res.json();

      await fetchAll();

      setOpenModal(false);
      setModalProduct(null);
      setSnackbar({
        open: true,
        message: isEdit ? "Produit mis à jour !" : "Produit ajouté !",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Erreur lors de la sauvegarde",
        severity: "error",
      });
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

      await fetchAll();

      setDeleteProduct(null);
      setSnackbar({
        open: true,
        message: "Produit supprimé !",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Erreur lors de la suppression",
        severity: "error",
      });
    }
  };

  const columns = [
    { field: "nom_produit", headerName: "Nom", width: 200 },
    { field: "prix", headerName: "Prix", width: 100 },
    { field: "quantite_stock", headerName: "Quantité en stock", width: 130 },
    {
      field: "nom_categorie",
      headerName: "Catégorie",
      width: 150,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => (
        <div className="action-buttons">
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
    <div className="container">
      <div className="header">
        <h2>Liste des produits</h2>
        <Button
          variant="contained"
          color="success"
          onClick={() => openEditModal()}
        >
          Ajouter un produit
        </Button>
      </div>

      <div className="filter-container">
        <TextField
          label="Rechercher"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FormControl className="form-control-min-width">
          <InputLabel>Catégorie</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nom_categorie}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="data-grid-container">
        <DataGrid
          rows={filteredProducts}
          columns={columns}
          pageSize={10}
          pagination
          rowsPerPageOptions={[10, 25, 50]}
        />
      </div>

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

          <FormControl
            component="fieldset"
            fullWidth
            margin="dense"
            error={!!errors.mode_vente}
          >
            <FormLabel component="legend">Mode de vente</FormLabel>
            <RadioGroup
              row
              name="mode_vente"
              value={modalProduct?.mode_vente || ""}
              onChange={handleModalChange}
            >
              {["gramme", "boite"].map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option === "gramme" ? "Gramme" : "Boîte"}
                />
              ))}
            </RadioGroup>
            {errors.mode_vente && (
              <FormHelperText>{errors.mode_vente}</FormHelperText>
            )}
          </FormControl>

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
                label="Quantité en stock"
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
                value={modalProduct?.quantite_stock || ""}
                onChange={handleModalChange}
                error={!!errors.quantite_stock}
                helperText={errors.quantite_stock}
              />
            </>
          )}

          <TextField
            select
            label="Catégorie"
            name="id_categorie_produit"
            fullWidth
            margin="dense"
            value={modalProduct?.id_categorie_produit || ""}
            onChange={handleModalChange}
            error={!!errors.id_categorie_produit}
            helperText={errors.id_categorie_produit}
          >
            <MenuItem value="">-- Sélectionner --</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nom_categorie}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Description"
            name="description"
            multiline
            rows={3}
            fullWidth
            margin="dense"
            value={modalProduct?.description || ""}
            onChange={handleModalChange}
          />

          <TextField
            type="file"
            fullWidth
            margin="dense"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                setModalProduct((prev) => ({ ...prev, image: file }));
                const reader = new FileReader();
                reader.onloadend = () =>
                  setModalProduct((prev) => ({
                    ...prev,
                    preview: reader.result,
                  }));
                reader.readAsDataURL(file);
              }
            }}
            helperText="Choisir une image pour le produit"
          />
          {modalProduct?.preview && (
            <img
              src={modalProduct.preview}
              alt="Produit"
              className="modal-image"
            />
          )}
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

      <Dialog open={!!deleteProduct} onClose={() => setDeleteProduct(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment supprimer{" "}
          <strong>{deleteProduct?.nom_produit}</strong> ?
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          style={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
