const apiKey = {
  id: process.env.NEXT_PUBLIC_DISCORD_LOGS_ID,
  token: process.env.NEXT_PUBLIC_DISCORD_LOGS_TOKEN,
}
const webhookApi = `https://discord.com/api/webhooks/${apiKey.id}/${apiKey.token}`

export async function postDiscordLogs(
  value: string,
  type: "SITEMAP" | "METADATA"
) {
  const data = {
    content: `${type === "SITEMAP" ? "⌘" : "🏞️"} ${type} - ${value}`,
    embeds: [
      {
        title: `**${value}** - ${type}`,
        description: ` **Time**: ${new Date().toLocaleTimeString()}
        **URL**: ${value}
          **Date**: ${new Date().toLocaleDateString()} 
          **Browser**: ${getBrowserName()}
          **OS**: ${getOperatingSystem()}
          **Device**: ${isMobile() ? "Mobile" : "PC"}
          **CHECK_HERE**:${
            type === "SITEMAP"
              ? `https://maybeusefull.vercel.app/sitemap?q=${value}`
              : `https://maybeusefull.vercel.app/metadata?q=${value}`
          }`,
        color: type === "SITEMAP" ? 10181046 : 16776960,
      },
    ],
  }

  process.env.NODE_ENV === "development"
    ? ""
    : await fetch(webhookApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          return response.json()
        })
        .then((responseData) => {
          console.log("Message sent successfully:", responseData)
        })
        .catch((error) => {
          console.error("Error sending message to Discord:", error)
        })
}

function getBrowserName() {
  const userAgent =
    (typeof window !== "undefined" && navigator.userAgent) || ([] as any)
  if (userAgent.indexOf("Firefox") !== -1) return "Firefox"
  if (userAgent.indexOf("Chrome") !== -1) return "Chrome"
  if (userAgent.indexOf("Safari") !== -1) return "Safari"
  if (userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident/") !== -1)
    return "Internet Explorer"
  if (userAgent.indexOf("Edge") !== -1) return "Edge"
  if (userAgent.indexOf("Opera") !== -1 || userAgent.indexOf("OPR") !== -1)
    return "Opera"
  return "Unknown"
}

function getOperatingSystem() {
  const platform =
    (typeof window !== "undefined" && navigator.platform.toLowerCase()) ||
    ([] as any)

  if (platform.includes("win")) {
    return "Windows"
  } else if (platform.includes("mac")) {
    return "Mac"
  } else if (platform.includes("linux")) {
    return "Linux"
  } else {
    return "Unknown"
  }
}

function isMobile() {
  return (
    typeof window !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || (true as any)
    )
  )
}
