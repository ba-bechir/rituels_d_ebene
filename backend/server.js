// ==============================
// Chargement des modules et variables d'environnement
// ==============================
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development')
});

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const { getConnection } = require('./db');

const app = express();

// ==============================
// Variables d'environnement
// ==============================
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SECRET_JWT = process.env.SECRET_JWT;
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/api' : '';
// ==============================
// Middleware globaux
// ==============================
app.use(cors());
app.use(express.json());

// Multer pour upload en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==============================
// Middleware pour vérifier rôle
// ==============================
function authorizeRole(role) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Token manquant' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET_JWT);
      if (decoded.role !== role) return res.status(403).json({ message: 'Accès refusé' });
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token invalide' });
    }
  };
}

// ==============================
// Routes API
// ==============================

// Login
app.post(`${BASE_PATH}/login`, async (req, res) => {
  const { email, mdp } = req.body;
  if (!email || !mdp) return res.status(400).json({ message: 'Email et mot de passe requis' });

  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT email, mdp, role FROM utilisateur WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ message: 'Identifiants invalides' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(mdp, user.mdp);
    if (!validPassword) return res.status(401).json({ message: 'Identifiants invalides' });

    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_JWT, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// Récupérer toutes les catégories
app.get(`${BASE_PATH}/categories`, authorizeRole('admin'), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(
      'SELECT id, nom_categorie FROM categorie_produit ORDER BY nom_categorie'
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// Récupérer tous les produits
app.get(`${BASE_PATH}/liste-produits`, authorizeRole('admin'), async (req, res) => {

  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(
`SELECT 
      p.id, 
      p.nom_produit, 
      uv.prix AS prix_produit, 
      p.id_categorie_produit, 
      c.nom_categorie, 
      p.image,
      uv.id AS id_unite_vente,
      uv.quantite_en_g,
      uv.quantite_en_sachet,
      uv.prix AS prix_unite,
      uv.quantite_stock AS quantite_stock,
      p.description AS description_unite
   FROM produit p
   LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
   LEFT JOIN unite_vente uv ON uv.id_produit = p.id
   ORDER BY p.nom_produit`
    );

      const productsWithImages = results.map(p => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString('base64') : null,
      prix: p.prix_unite,
      quantite_stock: p.quantite_stock,
      quantite_en_g: p.quantite_en_g,
      quantite_en_sachet: p.quantite_en_sachet,
      mode_vente: p.quantite_en_g ? 'gramme' : 'boite'
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// Produits "Plantes brutes"
app.get(`${BASE_PATH}/plantes-brutes`, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT 
    p.id,
    p.nom_produit,
    uv.prix AS prix_unite,
    p.image,
    uv.quantite_en_g,
    uv.quantite_en_sachet,
    uv.stock AS quantite_stock,
    uv.description AS description_unite
FROM produit p
INNER JOIN categorie_produit c ON p.id_categorie_produit = c.id
INNER JOIN unite_vente uv ON uv.id_produit = p.id
WHERE c.nom_categorie = ?
ORDER BY p.nom_produit`,
      ['Plantes brutes']
    );

    const productsWithImages = rows.map(p => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString('base64') : null
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// Ajouter un produit avec image
app.post(`${BASE_PATH}/produit`, authorizeRole('admin'), upload.single('image'), async (req, res) => {
  const {
    nom_produit,
    prix,
    quantite_stock,
    id_categorie_produit,
    mode_vente,
    quantite_en_g,
    quantite_en_sachet,
    description
  } = req.body;
 

  // Validation côté serveur
  const newErrors = {};
  if (!nom_produit?.trim()) newErrors.nom_produit = "Nom requis";
  if (prix == null) newErrors.prix = "Prix requis";
  if (quantite_stock == null) newErrors.quantite_stock = "Quantité requise";
  if (!id_categorie_produit) newErrors.id_categorie_produit = "Catégorie requise";


  if (mode_vente === "gramme") {
    if (quantite_en_g == null) newErrors.quantite_en_g = "Poids requis";
  } else if (mode_vente === "boite") {
    if (quantite_en_sachet == null) newErrors.quantite_en_sachet = "Quantité par boîte requise";
  }

  if (Object.keys(newErrors).length) return res.status(400).json({ errors: newErrors });

  let connection;
  try {
    connection = await getConnection();
    const imageBuffer = req.file ? req.file.buffer : null;


    // 1️⃣ Insertion du produit
    const [result] = await connection.execute(
      `INSERT INTO produit (nom_produit, id_categorie_produit, image, description)
       VALUES (?, ?, ?, ?)`,
      [nom_produit,  id_categorie_produit || null, imageBuffer ||null, description]
    );

        const newProductId = result.insertId;


        // 2️⃣ Insertion de l'unité de vente
    const quantiteEnGNum = mode_vente === "gramme" && quantite_en_g !== undefined && quantite_en_g !== ''
      ? parseInt(quantite_en_g, 10)
      : null

    const quantiteEnSachetNum = mode_vente === "boite" && quantite_en_sachet !== undefined && quantite_en_sachet !== ''
      ? parseInt(quantite_en_sachet, 10)
      : null

    const quantiteStockNum = parseInt(quantite_stock || 0, 10);
    const prixNum = parseFloat(prix || 0);

    await connection.execute(
      `INSERT INTO unite_vente
      (id_produit, quantite_en_g, quantite_en_sachet, quantite_stock, prix)
      VALUES (?, ?, ?, ?, ?)`,
      [newProductId, quantiteEnGNum, quantiteEnSachetNum, quantiteStockNum, prixNum]
    );

    // 3️⃣ Récupération du produit avec catégorie et image
    const [rows] = await connection.execute(
  `SELECT 
      p.id, 
      p.nom_produit, 
      uv.prix AS prix_produit, 
      uv.quantite_stock AS stock_produit, 
      p.id_categorie_produit, 
      c.nom_categorie, 
      p.image,
      uv.id AS id_unite_vente,
      uv.quantite_en_g,
      uv.quantite_en_sachet,
      uv.prix AS prix_unite,
      uv.quantite_stock AS stock_unite,
      p.description AS description_unite
   FROM produit p
   LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
   LEFT JOIN unite_vente uv ON uv.id_produit = p.id
   WHERE p.id = ?`,
  [newProductId]
);


    const newProduct = rows[0];
    newProduct.image = newProduct.image ? Buffer.from(newProduct.image).toString('base64') : null;

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});


// Modifier un produit avec image
app.put(`${BASE_PATH}/produit/:id`, authorizeRole('admin'), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { nom_produit, prix, quantite_stock, id_categorie_produit, mode_vente, quantite_en_g, quantite_en_sachet, description } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  let connection;
  try {
    connection = await getConnection();

    const query = imageBuffer
      ? `UPDATE produit 
         SET nom_produit = ?, id_categorie_produit = ?, description = ?, image = ?
         WHERE id = ?`
      : `UPDATE produit 
         SET nom_produit = ?, id_categorie_produit = ?, description = ? 
         WHERE id = ?`;

      const paramsProduit = imageBuffer
      ? [nom_produit, id_categorie_produit, description, imageBuffer, id]
      : [nom_produit, id_categorie_produit, description, id];

    await connection.execute(query, paramsProduit);

    // Récupération de l'unité de vente existante
const [uvRows] = await connection.execute(
  "SELECT * FROM unite_vente WHERE id_produit = ?",
  [id]
);
const uv = uvRows[0];

// Préparer les valeurs à mettre à jour
const quantiteEnGNum = mode_vente === "gramme"
  ? parseInt(quantite_en_g || uv.quantite_en_g, 10)
  : uv.quantite_en_g; // si mode boîtes, on garde l'existant

const quantiteEnSachetNum = mode_vente === "boite"
  ? parseInt(quantite_en_sachet || uv.quantite_en_sachet, 10)
  : uv.quantite_en_sachet;

const quantiteStockNum = parseInt(quantite_stock || uv.quantite_stock, 10);
const prixNum = parseFloat(prix || uv.prix);

// Update unite_vente
await connection.execute(
  `UPDATE unite_vente
   SET prix = ?, quantite_stock = ?, quantite_en_g = ?, quantite_en_sachet = ?
   WHERE id_produit = ?`,
  [prixNum, quantiteStockNum, quantiteEnGNum, quantiteEnSachetNum, id]
);


    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// Supprimer un produit
app.delete(`${BASE_PATH}/produit/:id`, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.execute('DELETE FROM produit WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Démarrage du serveur
// ==============================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
