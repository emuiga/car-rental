export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function fetcher<T = unknown>(
  url: string,
  options?: RequestInit & { params?: Record<string, string | undefined> }
): Promise<T> {
  const { params, ...rest } = options ?? {};

  let fullUrl = url;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    if (qs) fullUrl = `${url}?${qs}`;
  }

  const res = await fetch(fullUrl, {
    headers: { "Content-Type": "application/json" },
    ...rest,
  });

  if (!res.ok) {
    let message = "Something went wrong";
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {}
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string, params?: Record<string, string | undefined>) =>
    fetcher<T>(url, { method: "GET", params }),
  post: <T>(url: string, body: unknown) =>
    fetcher<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    fetcher<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    fetcher<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(url: string) =>
    fetcher<T>(url, { method: "DELETE" }),
};
