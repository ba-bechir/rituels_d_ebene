const path = require("path");
require("dotenv").config({
  path: path.join(
    __dirname,
    "..",
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development"
  ),
});

const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const { getConnection } = require("./db");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SECRET_JWT = process.env.SECRET_JWT;
const BASE_PATH = process.env.NODE_ENV === "production" ? "/api" : "";

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fieldSize: 10 * 1024 * 1024, fileSize: 5 * 1024 * 1024 },
});

// -------------- Middleware rôle --------------
function authorizeRole(role) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token manquant" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, SECRET_JWT);
      if (decoded.role !== role)
        return res.status(403).json({ message: "Accès refusé" });
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token invalide" });
    }
  };
}

// =====================================
// ROUTES API ADAPTÉES POUR CHAMP IMAGE
// =====================================

// ------ Login ------
app.post(`${BASE_PATH}/login`, async (req, res) => {
  const { email, mdp } = req.body;
  if (!email || !mdp)
    return res.status(400).json({ message: "Email et mot de passe requis" });
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT email, mdp, role FROM utilisateur WHERE email = ?",
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: "Identifiants invalides" });
    const user = rows[0];
    const validPassword = await bcrypt.compare(mdp, user.mdp);
    if (!validPassword)
      return res.status(401).json({ message: "Identifiants invalides" });
    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_JWT, {
      expiresIn: "1h",
    });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ------ Catégories ------
app.get(`${BASE_PATH}/categories`, authorizeRole("admin"), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(
      "SELECT id, nom_categorie FROM categorie_produit ORDER BY nom_categorie"
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ------ Liste produits ------
app.get(
  `${BASE_PATH}/liste-produits`,
  authorizeRole("admin"),
  async (req, res) => {
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
        p.description AS description,
        p.bienfait AS bienfait,
        p.mode_d_emploi AS mode_d_emploi,
        p.contre_indication AS contre_indication
      FROM produit p
      LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
      LEFT JOIN unite_vente uv ON uv.id_produit = p.id
      ORDER BY p.nom_produit`
      );

      const productsWithImages = results.map((p) => {
        let image = null;
        if (p.image) {
          if (Buffer.isBuffer(p.image)) {
            image = p.image.toString("base64");
          } else if (typeof p.image === "string") {
            image = p.image;
          }
        }
        return {
          ...p,
          image,
          prix: p.prix_unite,
          quantite_stock: p.quantite_stock,
          quantite_en_g: p.quantite_en_g,
          quantite_en_sachet: p.quantite_en_sachet,
          mode_vente: p.quantite_en_g ? "gramme" : "boite",
        };
      });

      res.json(productsWithImages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    } finally {
      if (connection) await connection.end();
    }
  }
);

// ------ Plantes brutes ------
app.get(`${BASE_PATH}/plantes-brutes`, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT p.id, p.nom_produit, uv.prix AS prix, p.image, uv.quantite_en_g, p.description AS description
       FROM produit p
       INNER JOIN categorie_produit c ON p.id_categorie_produit = c.id
       INNER JOIN unite_vente uv ON uv.id_produit = p.id
       WHERE c.nom_categorie = ?
       ORDER BY p.nom_produit`,
      ["Plantes brutes"]
    );

    const productsWithImages = rows.map((p) => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString("base64") : null,
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

app.get(`${BASE_PATH}/tisanes`, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT p.id, p.nom_produit, uv.prix AS prix, p.image, uv.quantite_en_g, p.description AS description
       FROM produit p
       INNER JOIN categorie_produit c ON p.id_categorie_produit = c.id
       INNER JOIN unite_vente uv ON uv.id_produit = p.id
       WHERE c.nom_categorie = ?
       ORDER BY p.nom_produit`,
      ["Tisanes (sachet)"]
    );

    const productsWithImages = rows.map((p) => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString("base64") : null,
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

app.get(`${BASE_PATH}/poudres`, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT p.id, p.nom_produit, uv.prix AS prix, p.image, uv.quantite_en_g, p.description AS description
       FROM produit p
       INNER JOIN categorie_produit c ON p.id_categorie_produit = c.id
       INNER JOIN unite_vente uv ON uv.id_produit = p.id
       WHERE c.nom_categorie = ?
       ORDER BY p.nom_produit`,
      ["Poudres"]
    );

    const productsWithImages = rows.map((p) => ({
      ...p,
      image: p.image ? Buffer.from(p.image).toString("base64") : null,
    }));

    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ------ Ajouter produit ------
app.post(
  `${BASE_PATH}/produit`,
  authorizeRole("admin"),
  upload.single("image"),
  async (req, res) => {
    const {
      nom_produit,
      prix,
      quantite_stock,
      id_categorie_produit,
      mode_vente,
      quantite_en_g,
      quantite_en_sachet,
      description,
      bienfait,
      mode_d_emploi,
      contre_indication,
    } = req.body;

    const newErrors = {};
    if (!nom_produit?.trim()) newErrors.nom_produit = "Nom requis";
    if (prix == null) newErrors.prix = "Prix requis";
    if (quantite_stock == null) newErrors.quantite_stock = "Quantité requise";
    if (!id_categorie_produit)
      newErrors.id_categorie_produit = "Catégorie requise";

    if (mode_vente === "gramme") {
      if (quantite_en_g == null) newErrors.quantite_en_g = "Poids requis";
    } else if (mode_vente === "boite") {
      if (quantite_en_sachet == null)
        newErrors.quantite_en_sachet = "Quantité par boîte requise";
    }

    if (Object.keys(newErrors).length)
      return res.status(400).json({ errors: newErrors });

    let connection;
    try {
      connection = await getConnection();
      const imageBuffer = req.file ? req.file.buffer : null;
      // 1️⃣ Insertion du produit
      const [result] = await connection.execute(
        `INSERT INTO produit (nom_produit, id_categorie_produit, image, description, bienfait, mode_d_emploi, contre_indication)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nom_produit,
          id_categorie_produit || null,
          imageBuffer || null,
          description,
          bienfait || null,
          mode_d_emploi || null,
          contre_indication || null,
        ]
      );
      const newProductId = result.insertId;

      // 2️⃣ Insertion de l'unité de vente
      const quantiteEnGNum =
        mode_vente === "gramme" &&
        quantite_en_g !== undefined &&
        quantite_en_g !== ""
          ? parseInt(quantite_en_g, 10)
          : null;
      const quantiteEnSachetNum =
        mode_vente === "boite" &&
        quantite_en_sachet !== undefined &&
        quantite_en_sachet !== ""
          ? parseInt(quantite_en_sachet, 10)
          : null;
      const quantiteStockNum = parseInt(quantite_stock || 0, 10);
      const prixNum = parseFloat(prix || 0);

      await connection.execute(
        `INSERT INTO unite_vente
         (id_produit, quantite_en_g, quantite_en_sachet, quantite_stock, prix)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newProductId,
          quantiteEnGNum,
          quantiteEnSachetNum,
          quantiteStockNum,
          prixNum,
        ]
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
          p.description AS description
        FROM produit p
        LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
        LEFT JOIN unite_vente uv ON uv.id_produit = p.id
        WHERE p.id = ?`,
        [newProductId]
      );

      const newProduct = rows[0];
      let image = null;
      if (newProduct.image) {
        if (Buffer.isBuffer(newProduct.image)) {
          image = newProduct.image.toString("base64");
        } else if (typeof newProduct.image === "string") {
          image = newProduct.image;
        }
      }
      newProduct.image = image;

      res.status(201).json(newProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    } finally {
      if (connection) await connection.end();
    }
  }
);

// ------ Modifier un produit ------
app.put(
  `${BASE_PATH}/produit/:id`,
  authorizeRole("admin"),
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const {
      nom_produit,
      prix,
      quantite_stock,
      id_categorie_produit,
      mode_vente,
      quantite_en_g,
      quantite_en_sachet,
      description,
      bienfait,
      mode_d_emploi,
      contre_indication,
    } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;

    let connection;
    try {
      connection = await getConnection();

      const query = imageBuffer
        ? `UPDATE produit 
           SET nom_produit = ?, id_categorie_produit = ?, description = ?, bienfait = ?, mode_d_emploi = ?, contre_indication = ?, image = ?
           WHERE id = ?`
        : `UPDATE produit 
           SET nom_produit = ?, id_categorie_produit = ?, description = ?, bienfait = ?, mode_d_emploi = ?, contre_indication = ? 
           WHERE id = ?`;

      const paramsProduit = imageBuffer
        ? [
            nom_produit,
            id_categorie_produit,
            description,
            bienfait,
            mode_d_emploi,
            contre_indication,
            imageBuffer,
            id,
          ]
        : [
            nom_produit,
            id_categorie_produit,
            description,
            bienfait,
            mode_d_emploi,
            contre_indication,
            id,
          ];
      await connection.execute(query, paramsProduit);

      // Update unité de vente
      const [uvRows] = await connection.execute(
        "SELECT * FROM unite_vente WHERE id_produit = ?",
        [id]
      );
      const uv = uvRows[0] || {};

      const quantiteEnGNum =
        mode_vente === "gramme"
          ? parseInt(quantite_en_g || uv.quantite_en_g || 0, 10)
          : uv.quantite_en_g || 0;
      const quantiteEnSachetNum =
        mode_vente === "boite"
          ? parseInt(quantite_en_sachet || uv.quantite_en_sachet || 0, 10)
          : uv.quantite_en_sachet || 0;
      const quantiteStockNum = parseInt(
        quantite_stock || uv.quantite_stock || 0,
        10
      );
      const prixNum = parseFloat(prix || uv.prix);

      await connection.execute(
        `UPDATE unite_vente
         SET prix = ?, quantite_stock = ?, quantite_en_g = ?, quantite_en_sachet = ?
         WHERE id_produit = ?`,
        [prixNum, quantiteStockNum, quantiteEnGNum, quantiteEnSachetNum, id]
      );

      res.json({ message: "Produit mis à jour avec succès" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    } finally {
      if (connection) await connection.end();
    }
  }
);

// ------ Supprimer produit ------
app.delete(
  `${BASE_PATH}/produit/:id`,
  authorizeRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await getConnection();
      const [result] = await connection.execute(
        "DELETE FROM produit WHERE id = ?",
        [id]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Produit non trouvé" });
      res.json({ message: "Produit supprimé avec succès" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    } finally {
      if (connection) await connection.end();
    }
  }
);

// ------ Get produit par id ------
app.get(`${BASE_PATH}/produit/:id`, async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT 
         p.id, 
         p.nom_produit, 
         uv.prix AS prix, 
         uv.quantite_stock, 
         p.id_categorie_produit, 
         c.nom_categorie, 
         p.image,
         uv.id AS id_unite_vente,
         uv.quantite_en_g,
         uv.quantite_en_sachet,
         p.description,
         p.bienfait AS bienfait,
         p.mode_d_emploi AS mode_d_emploi,
         p.contre_indication AS contre_indication
       FROM produit p
       LEFT JOIN categorie_produit c ON p.id_categorie_produit = c.id
       LEFT JOIN unite_vente uv ON uv.id_produit = p.id
       WHERE p.id = ?`,
      [id]
    );
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }

    const product = rows[0];
    let image = null;
    if (product.image) {
      if (Buffer.isBuffer(product.image)) {
        image = product.image.toString("base64");
      } else if (typeof product.image === "string") {
        image = product.image;
      }
    }
    product.image = image;

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ------ Start server ------
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => {
  console.log(`API démarrée sur http://${HOST}:${PORT}`);
});
