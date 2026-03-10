export interface FhirBundleEntry<T> {
  resource: T;
}

export interface FhirBundle<T> {
  resourceType: "Bundle";
  type: "searchset";
  total: number;
  limit: number;
  offset: number;
  entry: FhirBundleEntry<T>[];
}

export function createFhirBundle<T>(
  resources: T[],
  total: number,
  limit: number,
  offset: number
): FhirBundle<T> {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total,
    limit,
    offset,
    entry: resources.map((resource) => ({ resource }))
  };
}
