import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { NvlGroup, tiktokDl, facebookDl, instagramDl, pinterestDl } from "./scraper.js"

const app = express()
const PORT = process.env.PORT || 3000

const ytdl = new NvlGroup()

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
)
app.use(bodyParser.json())

app.get("/download", async (req, res) => {
  const { url, platform } = req.query

  if (!url || !platform) {
    return res.status(400).json({ error: "Missing url or platform query" })
  }

  try {
    let result

    switch (platform) {
      case "YouTube":
      case "youtube":
      case "yt":
        result = await ytdl.download(url)
        break
      case "TikTok":
      case "tiktok":
      case "tt":
        result = await tiktokDl(url)
        break
      case "Facebook":
      case "facebook":
      case "fb":
        result = await facebookDl(url)
        break
      case "Instagram":
      case "instagram":
      case "ig":
        result = await instagramDl(url)
        break
      case "Pinterest":
      case "pinterest":
      case "pin": // Added Pinterest case
        result = await pinterestDl(url)
        break
      default:
        return res.status(400).json({ error: "Unsupported platform" })
    }

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || "Something went wrong" })
  }
})

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Running locally at http://localhost:${PORT}`)
  })
}

export default app
