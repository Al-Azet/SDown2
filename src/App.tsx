

import axios from "axios"
import type React from "react"
import { useState } from "react"
import {
  Download,
  Moon,
  Sun,
  Instagram,
  Facebook,
  Music2,
  AlertCircle,
  XCircle,
  Loader2,
  ImageIcon,
} from "lucide-react"

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [url, setUrl] = useState("")
  const [platform, setPlatform] = useState("")
  const [error, setError] = useState("")
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const validateUrl = (url: string, platform: string): boolean => {
    const patterns = {
      Instagram: /(?:^|\.)instagram\.com|instagr\.am/i,
      TikTok: /(?:^|\.)tiktok\.com/i,
      Facebook: /(?:^|\.)facebook\.com|fb\.watch/i,
      Pinterest: /(?:^|\.)pinterest\.com|pin\.it/i,
    }

    if (!platform) {
      setError("Please select a platform first")
      setShowError(true)
      return false
    }

    if (!url) {
      setError("Please enter a URL")
      setShowError(true)
      return false
    }

    const pattern = patterns[platform as keyof typeof patterns]
    if (!pattern.test(url)) {
      setError(`Invalid ${platform} URL format`)
      setShowError(true)
      return false
    }

    setError("")
    setShowError(false)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateUrl(url, platform)) return

    setLoading(true)
    setResult(null)

    try {
      const query = new URLSearchParams({ url, platform }).toString()
      const backendUrl = window.location.origin || import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
      if (!backendUrl) {
        setError("Backend URL is not defined")
        setShowError(true)
        return
      } else {
        const response = await axios.get(`${backendUrl}/download?${query}`)

        if (response.data?.error) {
          console.error(response.data.error)
          throw new Error(response.data.error.status || response.data.error.message || "An error occurred")
        }

        setResult(response.data)
      }
    } catch (err: any) {
      const message = err.status?.code || err.response?.data?.error || err.message || "An error occurred"
      setError(message)
      setShowError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Error Toast */}
      {showError && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setShowError(false)} className="text-red-500 hover:text-red-700">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">
            Social<span className="text-blue-600">Downloader</span>
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? "bg-gray-800 text-yellow-400" : "bg-blue-100 text-blue-600"}`}
          >
            {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>
        </div>

        {/* Main Content */}
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl`}>
          <h2 className="text-2xl font-semibold text-center mb-8">Download Your Favorite Social Media Content</h2>

          {/* Platform Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              { name: "Instagram", icon: Instagram, color: "rose" },
              // { name: 'YouTube', icon: Youtube, color: 'red' }, // Removed YouTube
              { name: "TikTok", icon: Music2, color: "purple" },
              { name: "Facebook", icon: Facebook, color: "blue" },
              { name: "Pinterest", icon: ImageIcon, color: "red" },
            ].map((social) => (
              <button
                key={social.name}
                onClick={() => {
                  setPlatform(social.name)
                  setError("")
                  setShowError(false)
                  setResult(null)
                }}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  platform === social.name
                    ? `bg-${social.color}-100 text-${social.color}-600`
                    : darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <social.icon className="h-8 w-8" />
                <span className="text-sm font-medium">{social.name}</span>
              </button>
            ))}
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Paste your URL here
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setError("")
                    setShowError(false)
                  }}
                  placeholder="https://..."
                  className={`w-full px-4 py-3 rounded-lg border ${
                    error
                      ? "border-red-500 bg-red-50"
                      : darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  required
                />
                {error && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!platform || loading}
              className={`w-full font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                platform && !loading
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              {loading ? "Processing..." : "Download Now"}
            </button>
          </form>

          {/* Results */}
          {result && (
            <div className={`mt-8 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <h3 className="font-medium mb-4">Download Options:</h3>
              <div className="space-y-4">
                {platform === "TikTok" && result && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium">{result.title}</h4>
                      <p className="text-sm text-gray-500">Duration: {result.duration}</p>
                      <p className="text-sm text-gray-500">Region: {result.region}</p>
                      <p className="text-sm text-gray-500">Posted: {result.taken_at}</p>
                    </div>

                    {result.cover && (
                      <div className="mb-4">
                        <img
                          src={result.cover || "/placeholder.svg"}
                          alt="Cover"
                          className="w-full max-w-sm rounded-lg shadow"
                        />
                      </div>
                    )}

                    <div className="grid gap-4">
                      {result.data &&
                        result.data.map((item: any, i: number) => {
                          // Check if it's a video based on size_wm or size_nowm
                          const isVideo = item.size_wm || item.size_nowm

                          return (
                            <a
                              key={i}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-between p-3 rounded-lg hover:transition-colors ${
                                isVideo ? "bg-purple-600 text-white" : "bg-rose-600 text-white"
                              }`}
                            >
                              <span>
                                {item.type === "watermark"
                                  ? "Download Video Wm"
                                  : item.type === "nowatermark"
                                    ? "Download Video No Wm"
                                    : item.type === "nowatermark_hd"
                                      ? "Download Video No Wm HD"
                                      : item.type === "photo"
                                        ? "Download Image"
                                        : "Unknown Type"}
                                {item.quality && ` (${item.quality})`}
                              </span>

                              <span className="text-sm">{item.size}</span>
                            </a>
                          )
                        })}
                    </div>

                    {/* Optional: Show music info */}
                    {result.music_info && (
                      <div className="mt-6 p-4 rounded-lg bg-purple-100 text-purple-800">
                        <h5 className="font-medium mb-2">Music Info</h5>
                        <p className="text-sm">
                          🎵 {result.music_info.title} - {result.music_info.author}
                        </p>
                        {result.music_info.url && (
                          <a
                            href={result.music_info.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-purple-600 underline text-sm"
                          >
                            Listen Music
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}

                {platform === "Facebook" && (
                  <>
                    {result.caption && (
                      <div className="mb-4">
                        <h4 className="font-medium">Caption:</h4>
                        <p className="text-sm">{result.caption}</p>
                      </div>
                    )}
                    <div className="grid gap-4">
                      {result.results.map((v: any, i: number) => (
                        <a
                          key={i}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <span>Download {v.type} Quality</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                {platform === "Instagram" && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium">Posted Instagram</h4>
                      {result.caption && <p className="text-sm mt-2">Nothing</p>}
                    </div>
                    <div className="grid gap-4">
                      {result.map((v: any, i: number) => (
                        <a
                          key={i}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                        >
                          <span>Download {i}</span>
                          <span className="text-sm">{v.title}</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                {platform === "Pinterest" && result && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium">{result.title}</h4>
                      {result.description && <p className="text-sm text-gray-500 mt-2">{result.description}</p>}
                    </div>
                    <div className="grid gap-4">
                      {result.results.map((item: any, i: number) => (
                        <a
                          key={i}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-between p-3 rounded-lg hover:transition-colors ${
                            item.type === "video"
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
                        >
                          <span>Download {item.type === "video" ? "Video" : "Image"}</span>
                          <span className="text-sm">{item.title}</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className={`mt-8 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
            <h3 className="font-medium mb-2">How to use:</h3>
            <ol
              className={`list-decimal list-inside space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              <li>Select the social media platform</li>
              <li>Copy and paste the content URL</li>
              <li>Click "Download Now"</li>
              <li>Choose your preferred download option</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2024 SocialDownloader. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default App
