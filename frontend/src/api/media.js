import api from "./axios.js";
export async function uploadFile(file, { onProgress } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  const uploaded = data.file || data; 
  return {
    url: uploaded.url,
    publicId: uploaded.publicId,
    resourceType: uploaded.resourceType || file.type?.split("/")[0] || "",
    filename: uploaded.originalName || uploaded.filename || file.name,
    size: uploaded.size || file.size,
    duration: uploaded.duration || 0,
  };
}
 