"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SetupMFA() {
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function enrollMFA() {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setQr(data.totp.qr_code);
    setFactorId(data.id);
  }

  async function challengeMFA() {
    if (!factorId) return;

    const { data, error } = await supabase.auth.mfa.challenge({
      factorId: factorId,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setChallengeId(data.id);
  }

  async function verifyMFA() {
    if (!factorId || !challengeId) return;

    const { error } = await supabase.auth.mfa.verify({
      factorId: factorId,
      challengeId: challengeId,
      code: code,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("MFA successfully enabled 👑");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white space-y-4">
      <button
        onClick={enrollMFA}
        className="bg-purple-600 px-4 py-2 rounded"
      >
        Enroll MFA
      </button>

      {qr && (
        <div>
          <p>Scan this QR with Authenticator App:</p>
          <img src={qr} alt="QR Code" />
          <button
            onClick={challengeMFA}
            className="bg-blue-600 px-4 py-2 rounded mt-4"
          >
            Generate Challenge
          </button>
        </div>
      )}

      {challengeId && (
        <>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="p-2 text-black"
          />
          <button
            onClick={verifyMFA}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Verify
          </button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}