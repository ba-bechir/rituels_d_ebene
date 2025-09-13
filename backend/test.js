import { getConnection } from "./db.js";
import bcrypt from "bcrypt";

async function testInsert() {
  const connection = await getConnection();
  const hashedPassword = await bcrypt.hash("Test1234!", 10);
  try {
    await connection.execute(
      `INSERT INTO utilisateur (nom, prenom, pays, email, mdp, role) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Dupont",
        "Jean",
        "France",
        "jean.dupont@mail.com",
        hashedPassword,
        "client",
      ]
    );
    console.log("Insertion OK");
  } catch (error) {
    console.error("Erreur insertion :", error);
  } finally {
    await connection.end();
  }
}

testInsert();
