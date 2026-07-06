import { generateOutOfScope } from "../response-generator";

export function handleOutOfScope(message: string): string {
  const normalized = message.toLowerCase();
  
  let action = "that query";
  if (normalized.includes("transfer") || normalized.includes("send")) {
    action = "transferring money";
  } else if (normalized.includes("pay") || normalized.includes("bill pay")) {
    action = "making payments";
  } else if (normalized.includes("invest") || normalized.includes("stock") || normalized.includes("crypto")) {
    action = "investments";
  } else if (normalized.includes("balance") || normalized.includes("bank account")) {
    action = "checking bank accounts";
  } else if (normalized.includes("upi")) {
    action = "UPI transactions";
  }

  return generateOutOfScope(action);
}
