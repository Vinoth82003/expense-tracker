import { generateGreeting, generateUnknown } from "../response-generator";

export function handleGreeting(intent: string): string {
  if (intent === "greeting") {
    return generateGreeting();
  }
  return generateUnknown();
}
