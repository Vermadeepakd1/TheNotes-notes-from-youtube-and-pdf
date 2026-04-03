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
  } catch {
    transcript = await fetchTranscript(url);
  }

  return cleanExtractedText(transcript.map((entry) => entry.text).join(" "));
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
    const text = await extractYoutubeText(url);

    if (!text) {
      throw new Error("Could not extract a transcript from this YouTube video");
    }

    return {
      sourceType: "youtube",
      sourceTitle: getYoutubeSourceTitle(url),
      sourceUrl: url,
      sourceText: text,
    };
  }

  throw new Error("Upload a PDF or provide a YouTube URL");
}
