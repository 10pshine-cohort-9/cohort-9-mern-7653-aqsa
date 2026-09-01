import api from "./axios"; 
export const getTasks = async (params) => {
  const { data } = await api.get("/tasks", { params });
  return data;
};
export const createTask = async (taskData) => {
  const { data } = await api.post("/tasks", taskData);
  return data;
};
export const updateTask = async (id, taskData) => {
  const { data } = await api.put(`/tasks/${id}`, taskData);
  return data;
};
export const toggleTask = async (id) => {
  const { data } = await api.patch(`/tasks/${id}/toggle`);
  return data;
};
export const deleteTask = async (id) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
};