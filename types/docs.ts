export interface Doc {
  id: string;
  title: string;
  content: string;
  category: string;
  slug: string;
  order: number;
  // The Prisma model stores these as plain `String` columns, not enums, so the
  // row type Prisma hands back is `string`. Narrowing them here to a literal
  // union made every Prisma row unassignable to Doc and forced `as any` at
  // every read site. The valid values are enforced on write (admin form and
  // /api/docs); the known ones are named below for reference.
  /** DRAFT | PUBLISHED */
  status: string;
  /** MARKDOWN | HTML */
  contentType: string;
  helpfulCount?: number;
  notHelpfulCount?: number;
  // Date before serialization, ISO string after. Both are read with truthiness
  // guards only, so accepting either keeps the Prisma row assignable.
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
}
