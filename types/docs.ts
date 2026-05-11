export interface Doc {
  id: string;
  title: string;
  content: string;
  category: string;
  slug: string;
  order: number;
  status: "DRAFT" | "PUBLISHED";
  contentType: "MARKDOWN" | "HTML";
  helpfulCount?: number;
  notHelpfulCount?: number;
  updatedAt?: string | Date;
  createdAt?: string;
}
