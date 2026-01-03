// PostCSS configuration
// Note: This imports @tailwindcss/postcss dynamically to avoid errors when the package isn't available (e.g., in tests)
let plugins = [];

try {
  // Try to import Tailwind CSS PostCSS plugin
  const tailwindcss = await import('@tailwindcss/postcss');
  plugins = [tailwindcss.default];
} catch (error) {
  // Silently fail if @tailwindcss/postcss isn't available (e.g., in test environment)
  // This allows Vitest to run without installing Tailwind CSS dependencies
}

const config = {
  plugins,
};

export default config;
