import type {
  AnifyRecentEpisode,
  AnimeInfoResponse as TAnimeInfoResponse,
  ConsumetResponse,
  Popular,
  RecentEpisode,
  Search,
  SeasonalResponse,
  SourcesResponse,
} from "types/types"
import { cache } from "react"
import { redis } from "./redis"
import "server-only"

export const publicUrl = process.env.NEXT_PUBLIC_APP_URL
export const animeApi = process.env.ANIME_API_URI
export const anifyUrl = "https://ahttps://api.anify.tv"

export async function recent() {
  const redisVal = "recents"
  const url = `${animeApi}/meta/anilist/recent-episodes`
  let cachedVal

  cachedVal = await redis.get(redisVal)

  if (cachedVal) {
    return cachedVal
  }

  const response = await fetch(url, { cache: "no-cache" })

  if (!response.ok) throw new Error("Fetch Failed")

  const data = await response.json()

  if (data) {
    const stringifyResult = JSON.stringify(data)

    await redis.setex(redisVal, 60 * 60 * 3, stringifyResult)
  }

  return data as ConsumetResponse<RecentEpisode>
}

export const popular = cache(async function popular() {
  const response = await fetch(`${publicUrl}/api/anime/trending`)

  if (!response.ok) throw new Error("Failed to fetch top airing")

  return (await response.json()) as ConsumetResponse<Popular>
})

export const animeInfo = async function (animeId: string) {
  let cachedVal

  if (!animeId) throw new Error("Missing animeId for /anime/info")

  cachedVal = await redis.get(`anime:${animeId}`)

  if (cachedVal) {
    console.log("anime info hits")
    return cachedVal
  }

  const response = await fetch(`${animeApi}/anime/gogoanime/info/${animeId}`)

  const consumetInfo = await response.json()

  if (!response.ok) throw new Error("Failed to fetch anime information")

  const stringifyResult = JSON.stringify(consumetInfo)
  await redis.setex(`anime:${animeId}`, 60 * 60 * 3, stringifyResult)

  return consumetInfo as TAnimeInfoResponse
}

export async function watch(episodeId: string) {
  const response = await fetch(`${animeApi}/anime/gogoanime/watch/${episodeId}`)

  if (!response.ok) throw new Error("Failed to fetch anime informations")

  return (await response.json()) as SourcesResponse
}

export const search = cache(async function search({
  query,
  page = 1,
}: {
  query: string
  page?: number
}) {
  const response = await fetch(`${animeApi}/anime/anify/${query}`)

  if (!response.ok) throw new Error("Failed to fetch search.")

  return (await response.json()) as ConsumetResponse<Search>
})

export async function seasonal() {
  const url = `https://api.anify.tv/seasonal/anime?fields=[id,%20mappings,%20title,%20coverImage,%20bannerImage,%20description,%20currentEpisode, %20totalEpisodes, %20format]`
  const redisVal = "seasonal"

  let cachedVal

  cachedVal = await redis.get(redisVal)

  if (cachedVal) {
    return cachedVal
  }

  const response = await fetch(url, { cache: "no-cache" })

  if (!response.ok) throw new Error("Fetch Failed")

  const data = await response.json()

  if (data) {
    const stringifyResult = JSON.stringify(data)

    await redis.setex(redisVal, 60 * 60 * 3, stringifyResult)
  }

  return data as SeasonalResponse
}
