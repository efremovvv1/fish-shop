import axios from "axios";

export const api = axios.create({
  baseURL: "https://fish-shop-hdep.onrender.com",
});