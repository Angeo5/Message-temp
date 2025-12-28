import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { token } = req.query;

  try {
    const key = `msg:${token}`;
    const data = await kv.get(key);

    if (!data) {
      return res.status(410).json({
        error: true,
        message: "❌ Ce lien a expiré ou a déjà été consulté"
      });
    }

    // 🔥 Suppression immédiate → lecture unique
    await kv.del(key);

    // Reconstruction des médias
    let visualUrl = null;
    let audioUrl = null;

    if (data.visual) {
      visualUrl = `data:${data.visual.type};base64,${data.visual.data}`;
    }

    if (data.audio) {
      audioUrl = `data:${data.audio.type};base64,${data.audio.data}`;
    }

    res.json({
      success: true,
      data: {
        text: data.text,
        visualUrl,
        audioUrl
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: true, message: "Erreur serveur" });
  }
        }
