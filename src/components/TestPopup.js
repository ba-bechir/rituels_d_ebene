import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function TestPopup({ onClose }) {
  const [phone, setPhone] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          width: 320,
        }}
      >
        <h3>Test Phone Input</h3>
        <PhoneInput
          international
          defaultCountry="FR"
          value={phone}
          onChange={setPhone}
          placeholder="Numéro de téléphone*"
          required
        />
        <button
          onClick={onClose}
          style={{ marginTop: 20, padding: "8px 12px" }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
