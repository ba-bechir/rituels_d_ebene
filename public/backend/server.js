require('dotenv').config({ path: __dirname + '/../../.env' });
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { getConnection } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_JWT = process.env.SECRET_JWT;

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
// Routes publiques
// ==============================
app.post('/login', async (req, res) => {
  const { email, mdp } = req.body;

  if (!email || !mdp) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

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
      `SELECT p.id, p.nom_produit, p.prix, p.quantite_stock, p.id_categorie_produit, c.nom_categorie
       FROM produit p
       LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
       ORDER BY p.nom_produit`
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
// Ajouter un produit
// ==============================
app.post('/produit', authorizeRole('admin'), async (req, res) => {
  const { nom_produit, prix, quantite_stock, id_categorie_produit } = req.body;
  if (!nom_produit || prix == null || quantite_stock == null) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.execute(
      `INSERT INTO produit (nom_produit, prix, quantite_stock, id_categorie_produit)
       VALUES (?, ?, ?, ?)`,
      [nom_produit, prix, quantite_stock, id_categorie_produit || null]
    );

    const newProductId = result.insertId;

    const [rows] = await connection.execute(
      `SELECT p.id, p.nom_produit, p.prix, p.quantite_stock, p.id_categorie_produit, c.nom_categorie
       FROM produit p
       LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
       WHERE p.id = ?`,
      [newProductId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==============================
// Modifier un produit
// ==============================
app.put("/produit/:id", authorizeRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { nom_produit, prix, quantite_stock, id_categorie_produit } = req.body;

  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.execute(
      `UPDATE produit 
       SET nom_produit = ?, prix = ?, quantite_stock = ?, id_categorie_produit = ?
       WHERE id = ?`,
      [nom_produit, prix, quantite_stock, id_categorie_produit, id]
    );

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
