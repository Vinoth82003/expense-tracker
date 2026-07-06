import { NextRequest } from "next/server";

export interface GatewayParams {
  headers?: HeadersInit;
  req?: NextRequest | Request;
}

// Utility to build internal request options including session headers / cookies
function buildRequestInit(params?: GatewayParams, method: string = "GET", body?: any): RequestInit {
  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // If we have access to the incoming server request, forward the cookies/auth header
  if (params?.req) {
    const cookie = params.req.headers.get("cookie");
    if (cookie) {
      headersObj["Cookie"] = cookie;
    }
    const authorization = params.req.headers.get("authorization");
    if (authorization) {
      headersObj["Authorization"] = authorization;
    }
  }

  // Support explicit custom headers overrides
  if (params?.headers) {
    Object.entries(params.headers).forEach(([k, v]) => {
      headersObj[k] = v;
    });
  }

  return {
    method,
    headers: headersObj,
    body: body ? JSON.stringify(body) : undefined,
  };
}

// Get the base API URL dynamically depending on env
function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  return "http://localhost:3000";
}

export async function fetchExpenses(
  options?: string | { month?: string; category?: string; fromDate?: string; toDate?: string },
  params?: GatewayParams
) {
  const queryParts: string[] = [];
  if (typeof options === "string") {
    queryParts.push(`month=${options}`);
  } else if (options) {
    if (options.month) queryParts.push(`month=${options.month}`);
    if (options.category) queryParts.push(`category=${options.category}`);
    if (options.fromDate) queryParts.push(`fromDate=${options.fromDate}`);
    if (options.toDate) queryParts.push(`toDate=${options.toDate}`);
  }

  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const url = `${getBaseUrl()}/api/expenses${query}`;
  const response = await fetch(url, buildRequestInit(params));
  if (!response.ok) throw new Error("Failed to fetch expenses");
  return response.json();
}

export async function fetchIncome(
  options?: string | { month?: string; fromDate?: string; toDate?: string },
  params?: GatewayParams
) {
  const queryParts: string[] = [];
  if (typeof options === "string") {
    queryParts.push(`month=${options}`);
  } else if (options) {
    if (options.month) queryParts.push(`month=${options.month}`);
    if (options.fromDate) queryParts.push(`fromDate=${options.fromDate}`);
    if (options.toDate) queryParts.push(`toDate=${options.toDate}`);
  }

  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const url = `${getBaseUrl()}/api/income${query}`;
  const response = await fetch(url, buildRequestInit(params));
  if (!response.ok) throw new Error("Failed to fetch income");
  return response.json();
}

export async function fetchBudget(month: string, params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/budget?month=${month}`;
  const response = await fetch(url, buildRequestInit(params));
  if (!response.ok) throw new Error("Failed to fetch budget");
  return response.json();
}

export async function fetchCategories(params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/categories`;
  const response = await fetch(url, buildRequestInit(params));
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

export async function createExpense(data: any, params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/expenses`;
  const response = await fetch(url, buildRequestInit(params, "POST", data));
  if (!response.ok) {
    const errorMsg = await response.json().then(r => r.error).catch(() => "Failed to create expense");
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function createIncome(data: any, params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/income`;
  const response = await fetch(url, buildRequestInit(params, "POST", data));
  if (!response.ok) {
    const errorMsg = await response.json().then(r => r.error).catch(() => "Failed to create income");
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function updateBudget(data: any, params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/budget`;
  const response = await fetch(url, buildRequestInit(params, "POST", data));
  if (!response.ok) throw new Error("Failed to update budget");
  return response.json();
}

export async function updateExpense(id: string, data: any, params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/expenses/${id}`;
  const response = await fetch(url, buildRequestInit(params, "PATCH", data));
  if (!response.ok) throw new Error("Failed to update expense");
  return response.json();
}

export async function deleteExpense(id: string, params?: GatewayParams) {
  const url = `${getBaseUrl()}/api/expenses/${id}`;
  const response = await fetch(url, buildRequestInit(params, "DELETE"));
  if (!response.ok) throw new Error("Failed to delete expense");
  return response.json();
}
