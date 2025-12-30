import crypto from "crypto";
import multer from "multer";
import { kv } from "@vercel/kv";

export const config = {
  api: {
    bodyParser: false
  }
};

const upload = multer();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  upload.fields([
    { name: "visual", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ])(req, res, async err => {
    if (err) {
      return res.status(400).json({ error: "Upload invalide" });
    }

    try {
      const text = req.body?.text?.trim() || null;

      if (!text && !req.files?.visual && !req.files?.audio) {
        return res.status(400).json({
          error: "Message vide"
        });
      }

      const token = crypto.randomBytes(6).toString("hex");

      let visual = null;
      let audio = null;

      if (req.files?.visual) {
        const file = req.files.visual[0];
        visual = {
          type: file.mimetype,
          data: file.buffer.toString("base64")
        };
      }

      if (req.files?.audio) {
        const file = req.files.audio[0];
        audio = {
          type: file.mimetype,
          data: file.buffer.toString("base64")
        };
      }

      const payload = {
        text,
        visual,
        audio
      };

      // ⏱️ Expiration : 5 minutes
      await kv.set(`msg:${token}`, payload, { ex: 300 });

      const baseUrl = `https://${req.headers.host}`;
      const link = `${baseUrl}/?token=${token}`;

      res.json({ link });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
      }
          
