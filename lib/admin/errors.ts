/**
 * Reads a Prisma error `code` from an unknown caught value without resorting to
 * `any`. Returns undefined for non-Prisma errors.
 */
export function prismaErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
