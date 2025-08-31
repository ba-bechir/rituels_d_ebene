const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

 const path = require('path');

 app.use(express.static(path.join(__dirname, 'build')));

require('dotenv').config({ path: path.join(__dirname, envFile) });
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require("multer");

const { getConnection } = require('./db');

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

const SECRET_JWT = process.env.SECRET_JWT;

// ==============================
// Multer: stockage en mémoire
// ==============================
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
// Login
// ==============================
app.post('/login', async (req, res) => {
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

// ==============================
// Récupérer toutes les catégories
// ==============================
app.get('/categories', authorizeRole('admin'), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(
      'SELECT id, nom_categorie FROM categorie_produit ORDER BY nom_categorie'
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Récupérer tous les produits
// ==============================
app.get('/liste-produits', authorizeRole('admin'), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(
      `SELECT p.id, p.nom_produit, p.prix, p.quantite_stock, p.id_categorie_produit, c.nom_categorie, p.image
       FROM produit p
       LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
       ORDER BY p.nom_produit`
    );

    const productsWithImages = results.map(p => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString('base64') : null
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Produits "Plantes brutes"
// ==============================
app.get("/plantes-brutes", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT p.id, p.nom_produit, p.prix, p.image
       FROM produit p
       INNER JOIN categorie_produit c ON p.id_categorie_produit = c.id
       WHERE c.nom_categorie = ?
       ORDER BY p.nom_produit`,
      ["Plantes brutes"]
    );

    const productsWithImages = rows.map(p => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString('base64') : null
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Ajouter un produit avec image
// ==============================
app.post('/produit', authorizeRole('admin'), upload.single('image'), async (req, res) => {
  const { nom_produit, prix, quantite_stock, id_categorie_produit } = req.body;

  if (!nom_produit || prix == null || quantite_stock == null) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  let connection;
  try {
    connection = await getConnection();
    const imageBuffer = req.file ? req.file.buffer : null;

    const [result] = await connection.execute(
      `INSERT INTO produit (nom_produit, prix, quantite_stock, id_categorie_produit, image)
       VALUES (?, ?, ?, ?, ?)`,
      [nom_produit, prix, quantite_stock, id_categorie_produit || null, imageBuffer]
    );

    const newProductId = result.insertId;

    const [rows] = await connection.execute(
      `SELECT p.id, p.nom_produit, p.prix, p.quantite_stock, p.id_categorie_produit, c.nom_categorie, p.image
       FROM produit p
       LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
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

// ==============================
// Modifier un produit avec image
// ==============================
app.put("/produit/:id", authorizeRole("admin"), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { nom_produit, prix, quantite_stock, id_categorie_produit } = req.body;
  const imageBuffer = req.file ? req.file.buffer : null;

  let connection;
  try {
    connection = await getConnection();

    const query = imageBuffer
      ? `UPDATE produit 
         SET nom_produit = ?, prix = ?, quantite_stock = ?, id_categorie_produit = ?, image = ?
         WHERE id = ?`
      : `UPDATE produit 
         SET nom_produit = ?, prix = ?, quantite_stock = ?, id_categorie_produit = ?
         WHERE id = ?`;

    const params = imageBuffer
      ? [nom_produit, prix, quantite_stock, id_categorie_produit, imageBuffer, id]
      : [nom_produit, prix, quantite_stock, id_categorie_produit, id];

    const [result] = await connection.execute(query, params);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Produit non trouvé" });

    res.json({ message: "Produit mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Supprimer un produit
// ==============================
app.delete("/produit/:id", authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.execute("DELETE FROM produit WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Produit non trouvé" });
    res.json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Démarrage du serveur
// ==============================
app.listen(3001, () => {
  console.log('API démarrée sur http://localhost:3001');
});
