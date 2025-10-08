import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import { getConnection } from "./db.js";
import config from "./config.js";

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

app.use(cors());
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
    console.log(user.id);
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

app.post("/cart/sync", authorizeRole("client"), async (req, res) => {
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
        /*await connection.execute(
          "DELETE FROM cart WHERE id_utilisateur = ? AND id_produit = ?",
          [user.id, produitId]
        );*/
        //A la place, supprimer le panier de la session et lorsqu'on est connecté et qu'on clique sur Panier, ça doit afficher le panier persisté
        continue;
      }

      // Recherche présence actuelle en base
      const found = existingCartRows.find((ci) => ci.id_produit === produitId);

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
    console.log("Cart synchronisé final :", updatedCart);

    const formatedCart = updatedCart.map((item) => ({
      ...item,
      image: item.image ? Buffer.from(item.image).toString("base64") : null,
    }));

    res.json({ panier: formatedCart });
  } catch (error) {
    console.error("Erreur synchronisation panier :", error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la synchronisation du panier" });
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    req.user = decoded; // Contient userId ou d’autres infos
    console.log("req.user:", req.user); // <- Ici
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

app.post("/persist-adresses", authMiddleware, async (req, res) => {
  const { livraison, facturation, facturationIdentique } = req.body;
  const userId = req.user.id;
  const connection = await getConnection();

  try {
    // Nettoyer les objets reçus
    const livrClean = cleanParams(livraison);

    const { instructions, ...facturationSansInstructions } = facturation;
    const factClean = cleanParams(facturationSansInstructions);

    // Préparer params livr et fact
    const paramsLivraison = [
      livrClean.prenom,
      livrClean.nom,
      livrClean.adresse,
      livrClean.complement,
      livrClean.codePostal,
      livrClean.ville,
      livrClean.pays,
      livrClean.telephone,
      livrClean.instructions,
    ];

    const paramsFacturation = [
      factClean.prenom,
      factClean.nom,
      factClean.adresse,
      factClean.complement,
      factClean.codePostal,
      factClean.ville,
      factClean.pays,
      factClean.telephone,
    ];

    // Log complet des paramètres avec index et type
    console.log("Params livraison:");
    paramsLivraison.forEach((p, i) => console.log(`Index ${i}:`, p, typeof p));
    console.log("Params facturation:");
    paramsFacturation.forEach((p, i) =>
      console.log(`Index ${i}:`, p, typeof p)
    );

    // Insertion Livraison
    const [livraisonResult] = await connection.execute(
      `INSERT INTO livraison (
        prenom_livraison, nom_livraison, adresse_livraison, complement_adresse_livraison,
        code_postal_livraison, ville_livraison, pays_livraison, telephone_livraison, instruction_livraison
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      paramsLivraison
    );

    // Insertion Facturation
    const [facturationResult] = await connection.execute(
      `INSERT INTO facturation (
        prenom_facturation, nom_facturation, adresse_facturation, complement_adresse_facturation,
        code_postal_facturation, ville_facturation, pays_facturation, telephone_facturation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      paramsFacturation
    );

    // Mise à jour utilisateur
    console.log(
      "Update utilisateur avec ids :",
      facturationResult.insertId,
      livraisonResult.insertId,
      userId
    );
    const [updateResult] = await connection.execute(
      `UPDATE utilisateur SET id_facturation = ?, id_livraison = ? WHERE id = ?`,
      [facturationResult.insertId, livraisonResult.insertId, userId]
    );
    console.log("Update result:", updateResult);

    // Vérifie updateResult.affectedRows; s’il est 0, aucune ligne n'a été mise à jour
    if (updateResult.affectedRows === 0) {
      console.warn("Aucune ligne utilisateur mise à jour - vérifie userId");
    }

    res.status(200).json({
      success: true,
      id_facturation: facturationResult.insertId,
      id_livraison: livraisonResult.insertId,
    });
  } catch (error) {
    console.error("Erreur dans /persist-adresses:", error);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    if (connection) await connection.end();
  }
});

// ------ Start server ------
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => {
  console.log(`API démarrée sur http://${HOST}:${PORT}`);
});
