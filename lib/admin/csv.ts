/**
 * CSV helpers shared by admin exports. Guards against CSV formula injection
 * (CWE-1236): any cell starting with =, +, -, @, tab or CR is prefixed with a
 * single quote so spreadsheet apps treat it as text.
 */
export function toCsvCell(value: unknown): string {
  let cell = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  if (/[",\r\n]/.test(cell)) cell = `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n");
}
