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
  let transcript;

  try {
    transcript = await fetchTranscript(url, { lang: "en" });
  } catch (error) {
    try {
      transcript = await fetchTranscript(url);
    } catch (fallbackError) {
      const metadata = await extractYoutubeMetadata(url);

      return {
        text: cleanExtractedText(
          [
            metadata.title,
            metadata.description,
            `Transcript unavailable for ${url}.`,
          ]
            .filter(Boolean)
            .join(" "),
        ),
        title: metadata.title,
      };
    }
  }

  return {
    text: cleanExtractedText(transcript.map((entry) => entry.text).join(" ")),
    title: "",
  };
}

async function extractYoutubeMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return getFallbackYoutubeMetadata(url);
    }

    const html = await response.text();
    const title =
      extractMetaContent(html, "og:title") ||
      extractTitle(html) ||
      "YouTube Lecture";
    const description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "description") ||
      "";

    return {
      title,
      description,
    };
  } catch {
    return getFallbackYoutubeMetadata(url);
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
    description: "",
  };
}

function getYoutubeSourceTitle(url) {
  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.searchParams.get("v");

    if (videoId) {
      return `YouTube Lecture (${videoId})`;
    }
  } catch {
    return "YouTube Lecture";
  }

  return "YouTube Lecture";
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
