# Troubleshooting Guide for Netlify Deployment

If you're seeing an old version of your site on Netlify, try these steps:

## 1. Clear Your Browser Cache

Your browser might be showing a cached version of the site:

- **Chrome**: Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- **Firefox**: Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- **Safari**: Press Option+Cmd+E to empty the cache, then reload
- **Edge**: Press Ctrl+Shift+R

## 2. Check Netlify Deployment Status

1. Go to your Netlify dashboard
2. Click on your site
3. Go to the "Deploys" tab
4. Check if there are any failed deployments
5. Look at the deploy logs for any errors

## 3. Force a New Deployment

1. Go to your Netlify dashboard
2. Click on your site
3. Go to the "Deploys" tab
4. Click "Trigger deploy" > "Clear cache and deploy site"

## 4. Check Your Git Branch

Make sure Netlify is deploying from the correct branch:

1. Go to your Netlify dashboard
2. Click on your site
3. Go to "Site settings" > "Build & deploy" > "Deploy contexts"
4. Check which branch is set for production deploys

## 5. Verify Your Build Settings

1. Go to your Netlify dashboard
2. Click on your site
3. Go to "Site settings" > "Build & deploy" > "Build settings"
4. Verify the base directory, build command, and publish directory

## 6. Check for Build Errors

1. Go to your Netlify dashboard
2. Click on your site
3. Go to the "Deploys" tab
4. Click on the latest deployment
5. Click "Deploy log" to see if there are any errors

## 7. Contact Netlify Support

If none of the above steps work, contact Netlify support:

1. Go to [Netlify Support](https://www.netlify.com/support/)
2. Click "Get Support"
3. Fill out the form with details about your issue
