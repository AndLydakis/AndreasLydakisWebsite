export function assetUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const assetPath = normalizedPath.startsWith('assets/')
    ? normalizedPath
    : `assets/${normalizedPath}`;
  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${basePath}${assetPath}`;
}
