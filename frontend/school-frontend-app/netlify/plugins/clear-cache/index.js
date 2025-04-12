// Netlify build plugin to clear cache
module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Clearing Netlify cache...');
    
    // Clear Netlify cache
    utils.cache.remove('node_modules');
    utils.cache.remove('.cache');
    utils.cache.remove('build');
    
    console.log('Netlify cache cleared!');
  },
};
