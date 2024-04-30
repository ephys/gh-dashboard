export function getDevOpsAuthorization(pat: string) {
  return `Basic ${btoa(`:${pat}`)}`;
}
