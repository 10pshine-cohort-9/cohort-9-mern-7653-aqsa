import api from "./axios.js";
export async function createNote(note) {
  try {
    const { data } = await api.post("/notes", note);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to create note.";
    throw new Error(message);
  }
}
export async function getNote(id) {
  try {
    const { data } = await api.get(`/notes/${id}`);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch note.";
    throw new Error(message);
  }
}
export async function getNotes(params = {}) {
  try {
    const { data } = await api.get("/notes", { params });
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch notes.";
    throw new Error(message);
  }
}
export async function updateNote(id, note) {
  try {
    const { data } = await api.put(`/notes/${id}`, note);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to update note.";
    throw new Error(message);
  }
}
export async function deleteNote(id) {
  try {
    const { data } = await api.delete(`/notes/${id}`);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to delete note.";
    throw new Error(message);
  }
}
export async function toggleFavorite(id) {
  try {
    const { data } = await api.patch(`/notes/${id}/favorite`);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to toggle favorite.";
    throw new Error(message);
  }
}
export async function addPage(noteId, page = {}) {
  try {
    const { data } = await api.post(`/notes/${noteId}/pages`, page);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to add page.";
    throw new Error(message);
  }
}
export async function updatePage(noteId, pageId, page) {
  try {
    const { data } = await api.put(`/notes/${noteId}/pages/${pageId}`, page);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to update page.";
    throw new Error(message);
  }
}
export async function deletePage(noteId, pageId) {
  try {
    const { data } = await api.delete(`/notes/${noteId}/pages/${pageId}`);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to delete page.";
    throw new Error(message);
  }
}
