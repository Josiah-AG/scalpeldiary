// Call only with a static SQL alias. Include the row ID for incomplete identifiers
// so legacy blank MRNs never collapse unrelated surgeries.
export function surgeryCountSql(alias = ''): string {
  const p = alias ? `${alias}.` : '';
  return `COUNT(DISTINCT (NULLIF(BTRIM(${p}mrn), ''), ${p}date, CASE WHEN NULLIF(BTRIM(${p}mrn), '') IS NULL OR ${p}date IS NULL THEN ${p}id END))`;
}
