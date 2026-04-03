import { PDFParse } from "pdf-parse";
import { fetchTranscript } from "youtube-transcript/dist/youtube-transcript.esm.js";
import { cleanExtractedText } from "../utils/text.js";

async function extractPdfText(file) {
  const parser = new PDFParse({ data: new Uint8Array(file.buffer) });

  try {
    const result = await parser.getText();
    return cleanExtractedText(result.text || "");
  } finally {
    await parser.destroy();
  }
}

async function extractYoutubeText(url) {
  const videoId = parseYoutubeVideoId(url);
  const canonicalUrl = videoId ? buildCanonicalYoutubeUrl(videoId) : url;
  const metadata = await extractYoutubeMetadata({ url: canonicalUrl, videoId });

  try {
    const transcript = await fetchTranscript(canonicalUrl, { lang: "en" });

    return {
      text: buildYoutubeSourceText({
        metadata,
        transcriptText: transcript.map((entry) => entry.text).join(" "),
        url: canonicalUrl,
      }),
      title: metadata.title,
    };
  } catch (error) {
    try {
      const transcript = await fetchTranscript(canonicalUrl);

      return {
        text: buildYoutubeSourceText({
          metadata,
          transcriptText: transcript.map((entry) => entry.text).join(" "),
          url: canonicalUrl,
        }),
        title: metadata.title,
      };
    } catch {
      return {
        text: buildYoutubeFallbackText({ metadata, url: canonicalUrl }),
        title: metadata.title,
      };
    }
  }
}

async function extractYoutubeMetadata({ url, videoId }) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },
      },
    );

    const oembed = response.ok ? await response.json() : null;

    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    });

    const html = pageResponse.ok ? await pageResponse.text() : "";
    const title =
      extractMetaContent(html, "og:title") ||
      extractTitle(html) ||
      oembed?.title ||
      getFallbackYoutubeMetadata(videoId || url).title;
    const description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "description") ||
      "";
    const channel =
      oembed?.author_name || extractMetaContent(html, "author") || "";
    const thumbnail =
      oembed?.thumbnail_url || extractMetaContent(html, "og:image") || "";

    return {
      title,
      channel,
      description,
      thumbnail,
    };
  } catch {
    return getFallbackYoutubeMetadata(videoId || url);
  }
}

function extractMetaContent(html, property) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const metaPattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedProperty}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const match = html.match(metaPattern);

  return match?.[1] ? decodeHtmlEntities(match[1]) : "";
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  return match?.[1]
    ? decodeHtmlEntities(match[1].replace(/\s*-\s*YouTube\s*$/i, ""))
    : "";
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function getFallbackYoutubeMetadata(url) {
  return {
    title: getYoutubeSourceTitle(url),
    channel: "",
    description: "",
    thumbnail: "",
  };
}

function getYoutubeSourceTitle(url) {
  const videoId = parseYoutubeVideoId(url);

  if (videoId) {
    return `YouTube Lecture (${videoId})`;
  }

  return "YouTube Lecture";
}

function parseYoutubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "");

    if (hostname === "youtu.be") {
      const pathId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return cleanVideoId(pathId);
    }

    if (hostname.includes("youtube.com")) {
      const queryId = parsedUrl.searchParams.get("v");

      if (queryId) {
        return cleanVideoId(queryId);
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const [firstPart, secondPart] = pathParts;

      if (
        firstPart === "shorts" ||
        firstPart === "embed" ||
        firstPart === "live"
      ) {
        return cleanVideoId(secondPart);
      }
    }
  } catch {
    return "";
  }

  return "";
}

function cleanVideoId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildCanonicalYoutubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function buildYoutubeSourceText({ metadata, transcriptText, url }) {
  return cleanExtractedText(
    [
      metadata.title,
      metadata.channel ? `Channel: ${metadata.channel}` : "",
      metadata.description,
      transcriptText,
      `Source URL: ${url}`,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildYoutubeFallbackText({ metadata, url }) {
  return cleanExtractedText(
    [
      metadata.title,
      metadata.channel ? `Channel: ${metadata.channel}` : "",
      metadata.description,
      `Transcript unavailable for ${url}.`,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export async function extractSourceContent({ file, url }) {
  if (file) {
    const text = await extractPdfText(file);

    if (!text) {
      throw new Error("Could not extract text from the uploaded PDF");
    }

    return {
      sourceType: "pdf",
      sourceTitle: file.originalname,
      sourceUrl: "",
      sourceText: text,
    };
  }

  if (url) {
    const youtubeContent = await extractYoutubeText(url);
    const text = youtubeContent.text;

    if (!text) {
      throw new Error("Could not extract a transcript from this YouTube video");
    }

    return {
      sourceType: "youtube",
      sourceTitle: youtubeContent.title || getYoutubeSourceTitle(url),
      sourceUrl: url,
      sourceText: text,
    };
  }

  throw new Error("Upload a PDF or provide a YouTube URL");
}
