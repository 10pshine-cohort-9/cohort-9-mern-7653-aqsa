import api from "./axios";
export const getFolders = async () => {
  try {
    const { data } = await api.get("/folders");
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch folders.";
    throw new Error(message);
  }
};
export const createFolder = async (folderData) => {
  try {
    const { data } = await api.post("/folders", folderData);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to create folder.";
    throw new Error(message);
  }
};
export const deleteFolder = async (id) => {
  try {
    const { data } = await api.delete(`/folders/${id}`);
    return data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to delete folder.";
    throw new Error(message);
  }
};