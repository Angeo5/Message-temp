import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: true,
      message: "Méthode non autorisée"
    });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token manquant"
    });
  }

  try {
    const key = `msg:${token}`;
    const data = await kv.get(key);

    if (!data) {
      return res.status(410).json({
        error: true,
        message: "❌ Ce lien a expiré ou a déjà été consulté"
      });
    }

    // Reconstruction des médias AVANT suppression
    let visualUrl = null;
    let audioUrl = null;

    if (data.visual) {
      visualUrl = `data:${data.visual.type};base64,${data.visual.data}`;
    }

    if (data.audio) {
      audioUrl = `data:${data.audio.type};base64,${data.audio.data}`;
    }

    const responsePayload = {
      text: data.text,
      visualUrl,
      audioUrl
    };

    // 🔥 Lecture unique → suppression après reconstruction
    await kv.del(key);

    res.json({
      success: true,
      data: responsePayload
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: true,
      message: "Erreur serveur"
    });
  }
  }

