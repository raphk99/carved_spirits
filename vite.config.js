export default {
  root: '.',
  base: process.env.GITHUB_PAGES === 'true' ? '/carved_spirits/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  }
}
