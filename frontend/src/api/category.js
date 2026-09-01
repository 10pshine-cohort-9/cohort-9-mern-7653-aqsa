import api from "./axios";
export const getCategories = async () => {
  const { data } = await api.get("/categories");
  return data;
};
export const createCategory = async (name) => {
  const { data } = await api.post("/categories", { name });
  return data;
};
export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};