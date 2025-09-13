import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import config from "../config";

export default function ConfirmAccount() {
  const { token } = useParams();
  const [message, setMessage] = useState("Confirmation en cours...");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${config.apiUrl}/confirm/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la confirmation");
        return res.text();
      })
      .then((msg) => setMessage(msg))
      .catch(() => {
        setError(true);
        setMessage("Erreur lors de la confirmation");
      });
  }, [token]);

  return <div style={{ color: error ? "red" : "green" }}>{message}</div>;
}
