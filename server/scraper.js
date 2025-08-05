import axios from "axios"
import * as cheerio from "cheerio"

function parseDuration(s) {
  return [s / 3600, (s / 60) % 60, s % 60].map((v) => Math.floor(v).toString().padStart(2, "0")).join(":")
}

export async function instagramDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(
        "https://yt1s.io/api/ajaxSearch",
        new URLSearchParams({ q: url, w: "", p: "home", lang: "en" }),
        {
          headers: {
            Accept: "application/json, text/plain, /",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Origin: "https://yt1s.io",
            Referer: "https://yt1s.io/",
            "User-Agent": "Postify/1.0.0",
          },
        },
      )
      const $ = cheerio.load(data.data)
      const result = $("a.abutton.is-success.is-fullwidth.btn-premium")
        .map((_, b) => ({
          title: $(b).attr("title"),
          url: $(b).attr("href"),
        }))
        .get()
      resolve(result)
    } catch (e) {
      reject(e)
    }
  })
}

export async function tiktokDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = []

      function formatNumber(integer) {
        return Number(Number.parseInt(integer)).toLocaleString().replace(/,/g, ".")
      }

      function formatDate(n, locale = "en") {
        return new Date(n).toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        })
      }

      const res = (
        await axios.post(
          "https://www.tikwm.com/api/",
          {},
          {
            headers: {
              Accept: "application/json, text/javascript, /; q=0.01",
              "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Origin: "https://www.tikwm.com",
              Referer: "https://www.tikwm.com/",
              "User-Agent": "Mozilla/5.0",
            },
            params: { url: url, hd: 1 },
          },
        )
      ).data.data

      if (!res.size && !res.wm_size && !res.hd_size) {
        res.images.map((v) => data.push({ type: "photo", url: v }))
      } else {
        if (res.wmplay) data.push({ type: "watermark", url: res.wmplay })
        if (res.play) data.push({ type: "nowatermark", url: res.play })
        if (res.hdplay) data.push({ type: "nowatermark_hd", url: res.hdplay })
      }

      resolve({
        ...res,
        status: true,
        title: res.title,
        taken_at: formatDate(res.create_time).replace("1970", ""),
        region: res.region,
        id: res.id,
        durations: res.duration,
        duration: res.duration + " Seconds",
        cover: res.cover,
        size_wm: res.wm_size,
        size_nowm: res.size,
        size_nowm_hd: res.hd_size,
        data: data,
        music_info: {
          id: res.music_info.id,
          title: res.music_info.title,
          author: res.music_info.author,
          album: res.music_info.album || null,
          url: res.music || res.music_info.play,
        },
        stats: {
          views: formatNumber(res.play_count),
          likes: formatNumber(res.digg_count),
          comment: formatNumber(res.comment_count),
          share: formatNumber(res.share_count),
          download: formatNumber(res.download_count),
        },
        author: {
          id: res.author.id,
          fullname: res.author.unique_id,
          nickname: res.author.nickname,
          avatar: res.author.avatar,
        },
      })
    } catch (e) {
      reject(e)
    }
  })
}

export async function facebookDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post(
        "https://getmyfb.com/process",
        new URLSearchParams({
          id: decodeURIComponent(url),
          locale: "en",
        }),
        {
          headers: {
            "hx-current-url": "https://getmyfb.com/",
            "hx-request": "true",
            "hx-target": url.includes("share") ? "#private-video-downloader" : "#target",
            "hx-trigger": "form",
            "hx-post": "/process",
            "hx-swap": "innerHTML",
          },
        },
      )
      const $ = cheerio.load(data)
      resolve({
        caption: $(".results-item-text").text().trim() || "",
        preview: $(".results-item-image").attr("src") || "",
        results: $(".results-list-item")
          .get()
          .map((el) => ({
            quality: Number.parseInt($(el).text().trim()) || "",
            type: $(el).text().includes("HD") ? "HD" : "SD",
            url: $(el).find("a").attr("href") || "",
          })),
      })
    } catch (e) {
      reject(e)
    }
  })
}

export class NvlGroup {
  constructor() {
    this.signature = null
    this.timestamp = null
  }

  async updateSignature() {
    const res = await axios.get("https://ytdownloader.nvlgroup.my.id/generate-signature")
    this.signature = res.data.signature
    this.timestamp = res.data.timestamp
  }

  async ensureSignature() {
    if (!this.signature || !this.timestamp || Date.now() - this.timestamp > 4 * 60 * 1000) {
      await this.updateSignature()
    }
  }

  async search(query) {
    await this.ensureSignature()
    const { data } = await axios.get(`https://ytdownloader.nvlgroup.my.id/web/search?q=${encodeURIComponent(query)}`, {
      headers: {
        "x-server-signature": this.signature,
        "x-signature-timestamp": this.timestamp,
      },
    })
    return data
  }

  async info(url) {
    await this.ensureSignature()
    const { data } = await axios.get(`https://ytdownloader.nvlgroup.my.id/web/info?url=${encodeURIComponent(url)}`, {
      headers: {
        "x-server-signature": this.signature,
        "x-signature-timestamp": this.timestamp,
      },
    })
    return data
  }

  async download(url) {
    await this.ensureSignature()
    const info = await this.info(url)
    const video = info.resolutions.map((res) => ({
      ...res,
      url: `https://ytdownloader.nvlgroup.my.id/web/download?url=${url}&resolution=${res.height}&signature=${this.signature}&timestamp=${this.timestamp}`,
    }))
    const audio = info.audioBitrates.map((res) => ({
      ...res,
      url: `https://ytdownloader.nvlgroup.my.id/web/audio?url=${url}&bitrate=${res.bitrate}&signature=${this.signature}&timestamp=${this.timestamp}`,
    }))
    return { info, video, audio }
  }
}

// Updated Pinterest Downloader Function
export async function pinterestDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const $ = cheerio.load(data)

      const results = []
      let pageTitle = $('meta[property="og:title"]').attr("content") || "Pinterest Content"
      let pageDescription = $('meta[property="og:description"]').attr("content") || ""

      // Try to find __PINS_DATA__ or __INITIAL_STATE__ JSON
      const scriptContent = $('script[data-test-id="initial-state"]').html() || $('script[id="__PINS_DATA__"]').html()

      if (scriptContent) {
        try {
          const jsonData = JSON.parse(scriptContent)
          const pinData =
            jsonData?.initialReduxState?.pins?.[Object.keys(jsonData.initialReduxState.pins)[0]] ||
            jsonData?.resourceResponses?.[0]?.response?.data ||
            jsonData?.props?.initialReduxState?.pins?.[Object.keys(jsonData.props.initialReduxState.pins)[0]]

          if (pinData) {
            pageTitle = pinData.title || pageTitle
            pageDescription = pinData.description || pageDescription

            // Extract video URLs
            if (pinData.videos && pinData.videos.video_list) {
              const videoList = pinData.videos.video_list
              // Prioritize higher quality videos
              const qualities = ["480p", "720p", "1080p", "original"]
              let bestVideoUrl = null

              for (const quality of qualities) {
                if (videoList[quality] && videoList[quality].url) {
                  bestVideoUrl = videoList[quality].url
                }
              }

              if (bestVideoUrl) {
                results.push({
                  type: "video",
                  url: bestVideoUrl,
                  title: "Video",
                })
              }
            }

            // Extract image URLs
            if (pinData.images && pinData.images.orig && pinData.images.orig.url) {
              const imageUrl = pinData.images.orig.url
              // Only add image if it's not already added as a video (e.g., video thumbnail)
              if (!results.some((item) => item.url === imageUrl)) {
                results.push({
                  type: "image",
                  url: imageUrl,
                  title: "Image",
                })
              }
            } else if (pinData.image_full_url) {
              // Fallback for some pins
              const imageUrl = pinData.image_full_url
              if (!results.some((item) => item.url === imageUrl)) {
                results.push({
                  type: "image",
                  url: imageUrl,
                  title: "Image",
                })
              }
            }
          }
        } catch (jsonError) {
          console.warn("Could not parse Pinterest JSON data:", jsonError)
          // Fallback to meta tags if JSON parsing fails
        }
      }

      // Fallback to meta tags if no results from JSON or JSON parsing failed
      if (results.length === 0) {
        const videoUrlMeta =
          $('meta[property="og:video:url"]').attr("content") || $('meta[property="og:video"]').attr("content")
        if (videoUrlMeta) {
          results.push({
            type: "video",
            url: videoUrlMeta,
            title: "Video (from meta)",
          })
        }

        const imageUrlMeta = $('meta[property="og:image"]').attr("content")
        if (imageUrlMeta && !results.some((item) => item.url === imageUrlMeta)) {
          results.push({
            type: "image",
            url: imageUrlMeta,
            title: "Image (from meta)",
          })
        }
      }

      if (results.length > 0) {
        resolve({
          title: pageTitle,
          description: pageDescription,
          results: results,
        })
      } else {
        reject(new Error("No downloadable content found on Pinterest URL."))
      }
    } catch (e) {
      reject(e)
    }
  })
}
