import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import { XMLParser } from "fast-xml-parser";
import soap from "soap";
import util from "util";
import Stripe from "stripe";
import multer from "multer";
import { getConnection } from "./db.js";
import config from "./config.js";
import { data } from "react-router-dom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // utile dans certains cas pour TLS
  },
});

dotenv.config({
  path: path.join(
    __dirname,
    "..",
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development"
  ),
});

const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SECRET_JWT = process.env.SECRET_JWT;
const BASE_PATH = process.env.NODE_ENV === "production" ? "/api" : "";
const stripe = new Stripe(process.env.REACT_APP_STRIPE_SECRET_KEY); //A changer pour la prod
const enseigne = process.env.REACT_APP_MR_API_BRAND;

const MR_API_WSDL_URL = "https://api.mondialrelay.com/Web_Services.asmx?WSDL";

const MR_API_LOGIN = process.env.MR_API_LOGIN;
const MR_API_PASSWORD = process.env.MR_API_PASSWORD;
const MR_API_URL =
  process.env.MR_API_URL || "https://connect-api.mondialrelay.com/api/shipment";

const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fieldSize: 10 * 1024 * 1024, fileSize: 5 * 1024 * 1024 },
});

async function sendConfirmationEmail(email, token) {
  const url = `${config.apiUrl}/confirm/${token}`; // adapte l’URL

  const mailOptions = {
    from: '"Rituels" <contact@rituelsdebene.com>',
    to: email,
    subject: "Confirmez votre compte",
    html: `
      <p>Merci pour votre inscription. Cliquez sur ce lien pour confirmer votre compte :</p>
      <a href="${url}">${url}</a>
    `,
  };

  await transporter.sendMail(mailOptions);
}

app.get("/confirm/:token", async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send("Token manquant.");
  }

  try {
    const connection = await getConnection();

    // Chercher utilisateur avec ce token
    const [rows] = await connection.execute(
      "SELECT id FROM utilisateur WHERE confirmation_token = ? AND confirm = 0",
      [token]
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(400).send("Token invalide ou compte déjà confirmé.");
    }

    const userId = rows[0].id;

    // Mettre à jour compte : confirmé et suppression token
    await connection.execute(
      "UPDATE utilisateur SET confirm = 1, confirmation_token = NULL WHERE id = ?",
      [userId]
    );
    await connection.end();

    res.send(
      "Votre compte a été confirmé avec succès. Vous pouvez maintenant vous connecter."
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur.");
  }
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
      "SELECT id, email, mdp, role FROM utilisateur WHERE email = ?",
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: "Identifiants invalides" });
    const user = rows[0];
    const validPassword = await bcrypt.compare(mdp, user.mdp);
    if (!validPassword)
      return res.status(401).json({ message: "Identifiants invalides" });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_JWT,
      {
        expiresIn: "1h",
      }
    );
    res.json({ token, role: user.role, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

app.post("/register", async (req, res) => {
  const confirmationToken = crypto.randomBytes(32).toString("hex");
  const { nom, prenom, pays, email, password } = req.body;

  if (!nom || !prenom || !pays || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
    const connection = await getConnection();

    // Vérifier si email existe déjà
    const [existing] = await connection.execute(
      "SELECT id FROM utilisateur WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      await connection.end();
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insérer utilisateur avec token de confirmation et confirm=0
    await connection.execute(
      `INSERT INTO utilisateur (nom, prenom, pays, email, mdp, role, confirm, confirmation_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, pays, email, hashedPassword, "client", 0, confirmationToken]
    );

    await connection.end();

    // Envoyer e-mail de confirmation (async, indépendant)
    await sendConfirmationEmail(email, confirmationToken);

    res
      .status(201)
      .json({ message: "Compte créé, un mail de confirmation a été envoyé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
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

app.get(`${BASE_PATH}/adresse-livraison`, authMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(400).json({ error: "Utilisateur non authentifié" });
    }

    const [rows] = await connection.execute(
      `SELECT l.prenom_livraison, l.nom_livraison, l.adresse_livraison,
              l.complement_adresse_livraison, l.code_postal_livraison, l.ville_livraison
       FROM livraison l
       JOIN cart c ON c.id_livraison = l.id
       WHERE c.id_utilisateur = ?
       ORDER BY c.updated_at DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Adresse de livraison non trouvée" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT - Mettre à jour l'adresse de livraison
app.put(`${BASE_PATH}/adresse-livraison`, authMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(400).json({ error: "Utilisateur non authentifié" });
    }

    const {
      prenom_livraison,
      nom_livraison,
      adresse_livraison,
      complement_adresse_livraison,
      code_postal_livraison,
      ville_livraison,
    } = req.body;

    // Validation des champs requis
    if (
      !prenom_livraison ||
      !nom_livraison ||
      !adresse_livraison ||
      !code_postal_livraison ||
      !ville_livraison
    ) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    // Validation du code postal (5 chiffres)
    if (!/^\d{5}$/.test(code_postal_livraison)) {
      return res.status(400).json({ error: "Code postal invalide" });
    }

    // Récupérer l'id_livraison actuel du panier de l'utilisateur
    const [cartRows] = await connection.execute(
      `SELECT id_livraison FROM cart WHERE id_utilisateur = ? ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );

    if (cartRows.length === 0) {
      return res.status(404).json({ error: "Panier non trouvé" });
    }

    const idLivraison = cartRows[0].id_livraison;

    // Mettre à jour l'adresse de livraison
    await connection.execute(
      `UPDATE livraison 
       SET prenom_livraison = ?,
           nom_livraison = ?,
           adresse_livraison = ?,
           complement_adresse_livraison = ?,
           code_postal_livraison = ?,
           ville_livraison = ?
       WHERE id = ?`,
      [
        prenom_livraison,
        nom_livraison,
        adresse_livraison,
        complement_adresse_livraison || null,
        code_postal_livraison,
        ville_livraison,
        idLivraison,
      ]
    );

    // Retourner l'adresse mise à jour
    const [updatedRows] = await connection.execute(
      `SELECT prenom_livraison, nom_livraison, adresse_livraison,
              complement_adresse_livraison, code_postal_livraison, ville_livraison
       FROM livraison
       WHERE id = ?`,
      [idLivraison]
    );

    res.json(updatedRows[0]);
  } catch (error) {
    console.error("Erreur mise à jour adresse :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get(
  `${BASE_PATH}/adresse-facturation`,
  authMiddleware,
  async (req, res) => {
    let connection;
    try {
      connection = await getConnection();

      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return res.status(400).json({ error: "Utilisateur non authentifié" });
      }

      const [rows] = await connection.execute(
        `SELECT f.prenom_facturation, f.nom_facturation, f.adresse_facturation,
              f.complement_adresse_facturation, f.code_postal_facturation, f.ville_facturation
       FROM facturation f
       JOIN cart c ON c.id_livraison = f.id
       WHERE c.id_utilisateur = ?
       ORDER BY c.updated_at DESC
       LIMIT 1`,
        [userId]
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Adresse de livraison non trouvée" });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error("Erreur serveur :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PUT - Mettre à jour l'adresse de facturation
app.put(
  `${BASE_PATH}/adresse-facturation`,
  authMiddleware,
  async (req, res) => {
    let connection;
    try {
      connection = await getConnection();

      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return res.status(400).json({ error: "Utilisateur non authentifié" });
      }

      const {
        prenom_facturation,
        nom_facturation,
        adresse_facturation,
        complement_adresse_facturation,
        code_postal_facturation,
        ville_facturation,
      } = req.body;

      // Validation des champs requis
      if (
        !prenom_facturation ||
        !nom_facturation ||
        !adresse_facturation ||
        !code_postal_facturation ||
        !ville_facturation
      ) {
        return res.status(400).json({ error: "Champs obligatoires manquants" });
      }

      // Validation du code postal (5 chiffres)
      if (!/^\d{5}$/.test(code_postal_facturation)) {
        return res.status(400).json({ error: "Code postal invalide" });
      }

      // Récupérer l'id_livraison actuel du panier de l'utilisateur
      const [cartRows] = await connection.execute(
        `SELECT id_facturation FROM cart WHERE id_utilisateur = ? ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );

      if (cartRows.length === 0) {
        return res.status(404).json({ error: "Panier non trouvé" });
      }

      const idFacturation = cartRows[0].id_facturation;

      // Mettre à jour l'adresse de livraison
      await connection.execute(
        `UPDATE facturation 
       SET prenom_facturation = ?,
           nom_facturation = ?,
           adresse_facturation = ?,
           complement_adresse_facturation = ?,
           code_postal_facturation = ?,
           ville_facturation = ?
       WHERE id = ?`,
        [
          prenom_facturation,
          nom_facturation,
          adresse_facturation,
          complement_adresse_facturation || null,
          code_postal_facturation,
          ville_facturation,
          idFacturation,
        ]
      );

      // Retourner l'adresse mise à jour
      const [updatedRows] = await connection.execute(
        `SELECT prenom_facturation, nom_facturation, adresse_facturation,
              complement_adresse_facturation, code_postal_facturation, ville_facturation
       FROM facturation
       WHERE id = ?`,
        [idFacturation]
      );

      res.json(updatedRows[0]);
    } catch (error) {
      console.error("Erreur mise à jour adresse :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

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
      `SELECT p.id, p.nom_produit, uv.prix AS prix, p.image, uv.quantite_en_g, uv.quantite_stock, p.description AS description
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
      `SELECT p.id, p.nom_produit, uv.prix AS prix, p.image, uv.quantite_en_g, uv.quantite_stock, p.description AS description
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

app.use((req, res, next) => {
  console.log(`REQ ${req.method} ${req.url}`);
  next();
});

app.put(`${BASE_PATH}/cart/payee`, authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { idFacturation, idLivraison, modeLivraison } = req.body;
  console.log(
    `[${new Date().toISOString()}] Requête reçue sur /cart/payee pour userId=${userId}, idFacturation=${idFacturation}, idLivraison=${idLivraison}`
  );
  console.log(req.body);
  const connection = await getConnection();

  try {
    // 1. Vérifier si le panier contient des articles NON PAYÉS
    const [cartItems] = await connection.execute(
      `SELECT c.id_produit, c.quantite, uv.prix
       FROM cart c
       JOIN unite_vente uv ON c.id_produit = uv.id_produit
       WHERE c.id_utilisateur = ? AND c.paye = 0`,
      [userId]
    );

    /*if (cartItems.length === 0) {
      return res.status(400).json({ message: "Panier vide ou déjà traité" });
    }*/

    // 2. Verrouille immédiatement le panier (évite les doubles traitements)
    await connection.execute(
      "UPDATE cart SET paye = 1 WHERE id_utilisateur = ? AND paye = 0",
      [userId]
    );

    // 3. Créer la nouvelle commande
    const [resultCommande] = await connection.execute(
      "INSERT INTO commande (id_utilisateur, created_at, updated_at, paye, commande_preparee, id_facturation, id_livraison, methode_de_livraison) VALUES (?, NOW(), NOW(), 1, 0, ?, ?, ?)",
      [userId, idFacturation || null, idLivraison || null, modeLivraison]
    );
    const idCommande = resultCommande.insertId;

    // 4. Agrège le panier par produit
    const regroupedItems = {};
    cartItems.forEach((item) => {
      if (regroupedItems[item.id_produit]) {
        regroupedItems[item.id_produit].quantite += item.quantite;
      } else {
        regroupedItems[item.id_produit] = { ...item };
      }
    });

    // 5. Crée les lignes commande_article et met à jour les stocks
    console.log("cartItems:", cartItems);
    console.log("regroupedItems:", regroupedItems);
    console.log("idCommande:", idCommande);
    for (const item of Object.values(regroupedItems)) {
      try {
        await connection.execute(
          "INSERT INTO commande_article (id_commande, id_produit, quantite, prix_unitaire) VALUES (?, ?, ?, ?)",
          [idCommande, item.id_produit, item.quantite, item.prix]
        );
        await connection.execute(
          "UPDATE unite_vente SET quantite_stock = GREATEST(quantite_stock - ?, 0) WHERE id_produit = ?",
          [item.quantite, item.id_produit]
        );
      } catch (err) {
        console.log("Erreur commande_article:", err);
      }
    }

    await connection.execute(
      "DELETE FROM cart WHERE id_utilisateur = ? AND paye = 1",
      [userId]
    );

    res.json({ message: "Commande finalisée avec succès." });
  } catch (error) {
    console.error("Erreur finalisation commande:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la finalisation de la commande",
    });
  }
});

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

app.post(
  `${BASE_PATH}/cart/sync`,
  authorizeRole("client"),
  async (req, res) => {
    try {
      const localCart = Array.isArray(req.body.panier) ? req.body.panier : [];
      const connection = await getConnection();
      const { email } = req.body;

      const [rows] = await connection.execute(
        "SELECT id, email, mdp, role FROM utilisateur WHERE email = ?",
        [email]
      );
      const user = rows[0];

      if (!user || !user.id) {
        console.error("Utilisateur non trouvé en base !");
        return res.status(404).json({ message: "Utilisateur inconnu." });
      }

      // Récupération du panier existant
      const [existingCartRows] = await connection.execute(
        "SELECT * FROM cart WHERE id_utilisateur = ?",
        [user.id]
      );

      // Liste des ids produits locaux
      const localIds = localCart
        .map((item) =>
          typeof item.id === "number" && !isNaN(item.id) ? item.id : null
        )
        .filter((id) => id !== undefined && id !== null);

      // Parcours et traitement du panier local
      for (const item of localCart) {
        // Sécurise les valeurs
        const produitId =
          typeof item.id === "number" && !isNaN(item.id) ? item.id : null;
        const quantite =
          typeof item.quantite === "number" && item.quantite > 0
            ? item.quantite
            : 1;

        // Stock check
        const [[stockInfo]] = await connection.execute(
          "SELECT quantite_stock FROM unite_vente WHERE id_produit = ?",
          [produitId]
        );

        if (
          !stockInfo ||
          !Number.isInteger(stockInfo.quantite_stock) ||
          stockInfo.quantite_stock === 0
        ) {
          console.warn(
            ">> SUPPRESSION car stock nul/indéfini :",
            user.id,
            produitId
          );

          continue;
        }

        // Recherche présence actuelle en base
        const found = existingCartRows.find(
          (ci) => ci.id_produit === produitId
        );

        if (found) {
          await connection.execute(
            "UPDATE cart SET quantite = ? WHERE id_utilisateur = ? AND id_produit = ?",
            [quantite, user.id, produitId]
          );
        } else {
          await connection.execute(
            "INSERT INTO cart (id_utilisateur, id_produit, quantite) VALUES (?, ?, ?)",
            [user.id, produitId, quantite]
          );
        }
      }

      // Renvoie l'état final du panier
      const [updatedCart] = await connection.execute(
        `SELECT c.id_produit AS id, c.quantite, p.nom_produit AS nom, uv.prix, uv.quantite_stock, p.image, uv.quantite_en_g, uv.quantite_en_sachet 
      FROM cart c JOIN produit p 
      ON c.id_produit = p.id JOIN unite_vente uv ON uv.id_produit = p.id
   WHERE c.id_utilisateur = ?`,
        [user.id]
      );

      const formatedCart = updatedCart.map((item) => ({
        ...item,
        image: item.image ? Buffer.from(item.image).toString("base64") : null,
      }));

      res.json({ panier: formatedCart });
    } catch (error) {
      console.error("Erreur synchronisation panier :", error);
      res.status(500).json({
        message: "Erreur serveur lors de la synchronisation du panier",
      });
    }
  }
);

app.put(
  `${BASE_PATH}/cart/quantite`,
  authorizeRole("client"),
  async (req, res) => {
    const { id_produit, quantite } = req.body;
    const userId = req.user.id;

    if (!id_produit || !quantite || quantite < 1) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const connection = await getConnection();

    try {
      // Vérifier si le produit existe dans le panier
      const [rows] = await connection.execute(
        "SELECT * FROM cart WHERE id_utilisateur = ? AND id_produit = ?",
        [userId, id_produit]
      );

      if (rows.length > 0) {
        // Mettre à jour
        await connection.execute(
          "UPDATE cart SET quantite = ? WHERE id_utilisateur = ? AND id_produit = ?",
          [quantite, userId, id_produit]
        );
      } else {
        // Incrémentation si nouvelle (optionnel)
        await connection.execute(
          "INSERT INTO cart (id_utilisateur, id_produit, quantite) VALUES (?, ?, ?)",
          [userId, id_produit, quantite]
        );
      }

      res.json({ message: "Quantité mise à jour" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    } finally {
      await connection.end();
    }
  }
);

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    req.user = decoded; // Contient userId ou d’autres infos

    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalide" });
  }
}

function cleanParams(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      v === undefined || v === null ? "" : v,
    ])
  );
}

app.post(`${BASE_PATH}/persist-adresses`, authMiddleware, async (req, res) => {
  const { livraison, facturation } = req.body;
  const userId = req.user.id;
  const connection = await getConnection();

  try {
    // Nettoyer données reçues
    const livrClean = cleanParams(livraison);
    const { instructions, ...facturationSansInstructions } = facturation;
    const factClean = cleanParams(facturationSansInstructions);

    // Dédoublonnage livraison
    const [livrRows] = await connection.execute(
      `SELECT id FROM livraison WHERE
        prenom_livraison = ? AND nom_livraison = ? AND adresse_livraison = ? AND complement_adresse_livraison = ? AND
        code_postal_livraison = ? AND ville_livraison = ? AND pays_livraison = ? AND telephone_livraison = ? AND instruction_livraison = ?`,
      [
        livrClean.prenom,
        livrClean.nom,
        livrClean.adresse,
        livrClean.complement,
        livrClean.codePostal,
        livrClean.ville,
        livrClean.pays,
        livrClean.telephone,
        livrClean.instructions,
      ]
    );
    let id_livraison;
    if (livrRows.length > 0) {
      id_livraison = livrRows[0].id;
    } else {
      const [livraisonResult] = await connection.execute(
        `INSERT INTO livraison (prenom_livraison, nom_livraison, adresse_livraison, complement_adresse_livraison,
          code_postal_livraison, ville_livraison, pays_livraison, telephone_livraison, instruction_livraison)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          livrClean.prenom,
          livrClean.nom,
          livrClean.adresse,
          livrClean.complement,
          livrClean.codePostal,
          livrClean.ville,
          livrClean.pays,
          livrClean.telephone,
          livrClean.instructions,
        ]
      );
      id_livraison = livraisonResult.insertId;
    }

    // Dédoublonnage facturation
    const [factRows] = await connection.execute(
      `SELECT id FROM facturation WHERE
        prenom_facturation = ? AND nom_facturation = ? AND adresse_facturation = ? AND complement_adresse_facturation = ? AND
        code_postal_facturation = ? AND ville_facturation = ? AND pays_facturation = ? AND telephone_facturation = ?`,
      [
        factClean.prenom,
        factClean.nom,
        factClean.adresse,
        factClean.complement,
        factClean.codePostal,
        factClean.ville,
        factClean.pays,
        factClean.telephone,
      ]
    );
    let id_facturation;
    if (factRows.length > 0) {
      id_facturation = factRows[0].id;
    } else {
      const [facturationResult] = await connection.execute(
        `INSERT INTO facturation (prenom_facturation, nom_facturation, adresse_facturation, complement_adresse_facturation,
          code_postal_facturation, ville_facturation, pays_facturation, telephone_facturation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          factClean.prenom,
          factClean.nom,
          factClean.adresse,
          factClean.complement,
          factClean.codePostal,
          factClean.ville,
          factClean.pays,
          factClean.telephone,
        ]
      );
      id_facturation = facturationResult.insertId;
    }

    // Mise à jour du panier (cart) de l'utilisateur courant (ajuste la cible si besoin !)
    const [updateResult] = await connection.execute(
      `UPDATE cart SET id_facturation = ?, id_livraison = ? WHERE id_utilisateur = ?`,
      [id_facturation, id_livraison, userId]
    );

    if (updateResult.affectedRows === 0) {
      console.warn(
        "Aucune ligne cart mise à jour - vérifie la cible du panier en cours"
      );
    }

    res.status(200).json({
      success: true,
      id_facturation,
      id_livraison,
    });
  } catch (error) {
    console.error("Erreur dans /persist-adresses:", error);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

app.get(`${BASE_PATH}/colissimo-tarif`, async (req, res) => {
  const poids = Number(req.query.poids); // poids en GRAMMES

  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT prix FROM colissimo_tarifs WHERE poids_max >= ? ORDER BY poids_max ASC LIMIT 1",
      [poids]
    );
    if (rows.length === 0) return res.status(404).json({ prix: null });
    res.json({ prix: rows[0].prix });
  } finally {
    if (connection) await connection.end();
  }
});

// Endpoint pour récupérer les points relais par code postal
const MR_API_ENDPOINT = "https://api.mondialrelay.com/Web_Services.asmx";

app.get(`${BASE_PATH}/mondialrelay-points-relais`, async (req, res) => {
  const { postcode } = req.query;
  if (!postcode)
    return res.status(400).json({ error: "Le code postal est requis" });

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
      <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
        <Enseigne>${enseigne}</Enseigne>
        <Pays>FR</Pays>
        <CP>${postcode}</CP>
        <NombreResultats>7</NombreResultats>
      </WSI4_PointRelais_Recherche>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const response = await axios.post(MR_API_ENDPOINT, soapEnvelope, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction:
          "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche",
      },
    });

    const parser = new XMLParser();
    const jsonObj = parser.parse(response.data);

    // Accès à la liste des points relais (à adapter en fonction de la structure précise)
    const pointsRelais =
      jsonObj["soap:Envelope"]?.["soap:Body"]
        ?.WSI4_PointRelais_RechercheResponse?.WSI4_PointRelais_RechercheResult
        ?.PointsRelais?.PointRelais_Details || [];

    // Normaliser en tableau
    const liste = Array.isArray(pointsRelais)
      ? pointsRelais
      : pointsRelais
      ? [pointsRelais]
      : [];

    res.json(liste);
  } catch (error) {
    console.error("Erreur appel SOAP manuel:", error.message || error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'appel SOAP manuel Mondial Relay" });
  }
});

// Exemple Node.js/Express pour /api/commandes
app.get(`${BASE_PATH}/list-commandes`, async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT ca.id_commande, c.created_at FROM commande c, commande_article ca where c.id = ca.id_commande GROUP BY ca.id_commande ORDER BY c.created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Erreur récupération commandes:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des commandes." });
  }
});

app.post(`${BASE_PATH}/create-payment-intent`, async (req, res) => {
  try {
    const { amount } = req.body;
    // Validation minimum
    if (!amount || typeof amount !== "number")
      return res.status(400).json({ error: "Montant invalide" });
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
    });
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Erreur Stripe:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post(
  `${BASE_PATH}/cart/ajouter`,
  authorizeRole("client"),
  async (req, res) => {
    const userId = req.user.id;
    const { id_produit, quantite } = req.body;

    if (!id_produit || !quantite || quantite < 1) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const connection = await getConnection();

    try {
      // Vérifier si le produit est déjà dans le panier
      const [rows] = await connection.execute(
        "SELECT * FROM cart WHERE id_utilisateur = ? AND id_produit = ?",
        [userId, id_produit]
      );

      if (rows.length > 0) {
        // Met à jour la quantité en additionnant
        const nouvelleQuantite = rows[0].quantite + quantite;
        await connection.execute(
          "UPDATE cart SET quantite = ? WHERE id_utilisateur = ? AND id_produit = ?",
          [nouvelleQuantite, userId, id_produit]
        );
      } else {
        // Insère une nouvelle ligne panier
        await connection.execute(
          "INSERT INTO cart (id_utilisateur, id_produit, quantite, paye) VALUES (?, ?, ?, 0)",
          [userId, id_produit, quantite]
        );
      }

      res.json({ message: "Produit ajouté au panier" });
    } catch (err) {
      console.error("Erreur ajout panier :", err);
      res
        .status(500)
        .json({ message: "Erreur serveur lors de l'ajout au panier" });
    }
  }
);

app.delete(
  `${BASE_PATH}/cart/:id_produit`,
  authorizeRole("client"),
  async (req, res) => {
    const userId = req.user.id;
    const id_produit = parseInt(req.params.id_produit);

    if (!id_produit || isNaN(id_produit)) {
      return res.status(400).json({ message: "ID produit invalide" });
    }

    const connection = await getConnection();

    try {
      const [result] = await connection.execute(
        "DELETE FROM cart WHERE id_utilisateur = ? AND id_produit = ?",
        [userId, id_produit]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Produit non trouvé dans le panier" });
      }

      res.json({ message: "Produit supprimé du panier avec succès" });
    } catch (err) {
      console.error("Erreur suppression panier :", err);
      res
        .status(500)
        .json({ message: "Erreur serveur lors de la suppression du produit" });
    }
  }
);

// ------ Start server ------
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => {
  console.log(`API démarrée sur http://${HOST}:${PORT}`);
});

process.env.NODE_DEBUG = "soap";
