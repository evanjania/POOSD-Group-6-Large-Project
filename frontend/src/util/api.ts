export async function fetchWithAuth(url: string, options = {}) {
  let accessToken = localStorage.getItem("accessToken");

  let res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Expired access token
  if (res.status === 403) {
    const refreshToken = localStorage.getItem("refreshToken");

    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    // Force logout if refresh fails
    if (!refreshRes.ok) {
      localStorage.clear();
      window.location.href = "/login";
      return res;
    }

    const data = await refreshRes.json();

    // Store new access token
    localStorage.setItem("accessToken", data.accessToken);

    // Retry original request
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.accessToken}`,
      },
    });
  }

  return res;
}