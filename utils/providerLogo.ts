/**
 * Utility function to get the correct Image source for a provider logo.
 * Handles both local assets (require() returns number) and remote URLs.
 */
export function getProviderLogoSource(
  logoPath: string | number | null | undefined,
): { uri: string } | number {
  if (!logoPath) {
    return { uri: '' };
  }

  // If it's a number (from require()), return it directly
  if (typeof logoPath === 'number') {
    return logoPath;
  }

  // If it's already an absolute URL, use it as-is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return { uri: logoPath };
  }

  // Otherwise, it's a TMDB relative path
  return { uri: `https://image.tmdb.org/t/p/w200${logoPath}` };
}
