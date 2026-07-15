const apiKey = {
  id: process.env.DISCORD_LOGS_ID ?? process.env.NEXT_PUBLIC_DISCORD_LOGS_ID,
  token:
    process.env.DISCORD_LOGS_TOKEN ?? process.env.NEXT_PUBLIC_DISCORD_LOGS_TOKEN,
}
const webhookApi = `https://discord.com/api/webhooks/${apiKey.id}/${apiKey.token}`

export type LogType =
  | "SITEMAP"
  | "METADATA"
  | "ROBOTS"
  | "AUDIT"
  | "DOMAIN_RATING"

const logMeta: Record<
  LogType,
  { emoji: string; color: number; path: string }
> = {
  SITEMAP: {
    emoji: "⌘",
    color: 10181046,
    path: "/sitemap",
  },
  METADATA: {
    emoji: "🏞️",
    color: 16776960,
    path: "/metadata",
  },
  ROBOTS: {
    emoji: "🤖",
    color: 5763719,
    path: "/robots",
  },
  AUDIT: {
    emoji: "🩺",
    color: 3447003,
    path: "/audit",
  },
  DOMAIN_RATING: {
    emoji: "📈",
    color: 15844367,
    path: "/domain-rating",
  },
}

/** Server-only Discord logger. Prefer DISCORD_LOGS_* env vars (not NEXT_PUBLIC_). */
export async function postDiscordLogs(value: string, type: LogType) {
  if (!apiKey.id || !apiKey.token) {
    console.warn("Discord logs skipped: missing DISCORD_LOGS_ID/TOKEN")
    return
  }

  const meta = logMeta[type]
  const data = {
    content: `${meta.emoji} ${type} - ${value}`,
    embeds: [
      {
        title: `**${value}** - ${type}`,
        description: ` **Time**: ${new Date().toLocaleTimeString()}
        **URL**: ${value}
          **Date**: ${new Date().toLocaleDateString()} 
          **CHECK_HERE**:https://seocheckup.vercel.app${meta.path}?q=${encodeURIComponent(value)}`,
        color: meta.color,
      },
    ],
  }

  if (process.env.NODE_ENV === "development") return

  try {
    const response = await fetch(webhookApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
  } catch (error) {
    console.error("Error sending message to Discord:", error)
  }
}
