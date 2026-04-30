/**
 * Contourne la limite 1000 lignes de PostgREST en paginant automatiquement.
 * queryFn reçoit (from, to) et doit retourner { data: T[] | null }.
 */
export async function fetchAllRows<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;

  while (true) {
    const { data } = await queryFn(offset, offset + pageSize - 1);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}
