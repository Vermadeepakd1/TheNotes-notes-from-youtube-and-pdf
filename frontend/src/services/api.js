import axios from "axios";

const isProduction = import.meta.env.PROD;
const localApiBase = import.meta.env.VITE_API_URL || resolveLocalApiBase();

export const API_BASE_URL = isProduction ? "/api" : localApiBase;

function resolveLocalApiBase() {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const currentHost = window.location.hostname;

  if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    return `${window.location.protocol}//${currentHost}:5000/api`;
  }

  return "http://localhost:5000/api";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.error || error?.message || fallback;
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data.user;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data.user;
}

export async function logoutUser() {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function listNotes(params = {}) {
  const { data } = await api.get("/notes", { params });
  return data.notes;
}

export async function getNote(noteId) {
  const { data } = await api.get(`/notes/${noteId}`);
  return data.note;
}

export async function generateNote({
  file,
  url,
  mode,
  folder,
  questionCount,
  questionTypes = [],
}) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  if (url) {
    formData.append("url", url);
  }

  formData.append("mode", mode);

  if (folder) {
    formData.append("folder", folder);
  }

  if (mode === "exam" && questionCount) {
    formData.append("questionCount", String(questionCount));
  }

  if (mode === "exam") {
    questionTypes.forEach((type) => {
      formData.append("questionTypes", type);
    });
  }

  const { data } = await api.post("/notes/generate", formData);
  return data.note;
}

export async function regenerateNote(noteId) {
  const { data } = await api.post(`/notes/${noteId}/regenerate`);
  return data.note;
}

export async function toggleComplete(noteId) {
  const { data } = await api.patch(`/notes/${noteId}/complete`);
  return data.note;
}

export async function toggleArchive(noteId) {
  const { data } = await api.patch(`/notes/${noteId}/archive`);
  return data.note;
}

export async function deleteNote(noteId) {
  await api.delete(`/notes/${noteId}`);
}

export async function getSharedNote(shareId) {
  const { data } = await api.get(`/public/notes/${shareId}`);
  return data.note;
}
