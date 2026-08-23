import { API_BASE_URL } from "./config";

export async function submitRegistration(formData) {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export async function getRegistrations() {
  const res = await fetch(`${API_BASE_URL}/api/register`);

  if (!res.ok) {
    throw new Error("Failed to fetch registrations");
  }

  return res.json();
}