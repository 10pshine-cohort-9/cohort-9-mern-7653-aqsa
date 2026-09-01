import api from "./axios.js";
export async function createNote(note) {
  const { data } = await api.post("/notes", note);
  return data;
}
export async function getNote(id) {
  const { data } = await api.get(`/notes/${id}`);
  return data;
}
export async function getNotes(params = {}) {
  const { data } = await api.get("/notes", {
    params,
  });
  return data;
}
export async function updateNote(id, note) {
  const { data } = await api.put(`/notes/${id}`, note);
  return data;
}
export async function deleteNote(id) {
  const { data } = await api.delete(`/notes/${id}`);
  return data;
}
export async function toggleFavorite(id) {
  const { data } = await api.patch(`/notes/${id}/favorite`);
  return data;
}
export async function addPage(noteId, page = {}) {
  const { data } = await api.post(
    `/notes/${noteId}/pages`,
    page
  );
  return data;
}
export async function updatePage(noteId, pageId, page) {
  const { data } = await api.put(
    `/notes/${noteId}/pages/${pageId}`,
    page
  );
  return data;
}
export async function deletePage(noteId, pageId) {
  const { data } = await api.delete(
    `/notes/${noteId}/pages/${pageId}`
  );
  return data;
}
