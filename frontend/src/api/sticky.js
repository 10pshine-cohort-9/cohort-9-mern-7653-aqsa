import api from "./axios";
export const getStickies = async () => {
  const { data } = await api.get("/sticky");
  return data;
};
export const createSticky = async (stickyData) => {
  const { data } = await api.post("/sticky", stickyData);
  return data;
};
export const updateSticky = async (id, stickyData) => {
  const { data } = await api.put(`/sticky/${id}`, stickyData);
  return data;
};
export const deleteSticky = async (id) => {
  const { data } = await api.delete(`/sticky/${id}`);
  return data;
};