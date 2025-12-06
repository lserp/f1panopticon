# F1 Panopticon - Deployment Guide

This guide covers how to build and deploy the F1 Panopticon application for production use.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building for Production](#building-for-production)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18.x or higher
- npm 9.x or higher
- Git (for version control)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Building for Production

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Tests

Ensure all tests pass before building:

```bash
npm run test
```

### 3. Build the Application

Create an optimized production build:

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles all assets using Vite
- Minifies and optimizes code
- Generates source maps for debugging
- Outputs to the `dist/` directory

### 4. Preview the Build

Test the production build locally:

```bash
npm run preview
```

This starts a local server serving the production build at `http://localhost:4173`.

## Deployment Options

### Option 1: Static File Hosting

The F1 Panopticon is a static web application that can be hosted on any static file hosting service.

#### Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod --dir=dist
```

#### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

#### GitHub Pages

1. Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

2. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

3. Deploy:
```bash
npm run deploy
```

### Option 2: Self-Hosted Web Server

#### Using Nginx

1. Build the application:
```bash
npm run build
```

2. Copy `dist/` contents to your web server:
```bash
scp -r dist/* user@server:/var/www/f1panopticon/
```

3. Configure Nginx (`/etc/nginx/sites-available/f1panopticon`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/f1panopticon;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

4. Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/f1panopticon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Using Apache

1. Configure Apache (`/etc/apache2/sites-available/f1panopticon.conf`):
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/f1panopticon

    <Directory /var/www/f1panopticon>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>

    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType application/font-woff "access plus 1 year"
        ExpiresByType application/font-woff2 "access plus 1 year"
    </IfModule>
</VirtualHost>
```

2. Enable the site:
```bash
sudo a2ensite f1panopticon
sudo a2enmod rewrite expires deflate
sudo systemctl restart apache2
```

### Option 3: Docker Container

1. Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. Build and run:
```bash
docker build -t f1panopticon .
docker run -p 8080:80 f1panopticon
```

## Configuration

### Environment Variables

The application supports the following environment variables (create `.env.production`):

```env
# API Configuration
VITE_ERGAST_API_URL=https://ergast.com/api/f1
VITE_OPENF1_API_URL=https://api.openf1.org/v1

# Cache Configuration
VITE_CACHE_TTL_DAYS=30
VITE_CACHE_MAX_SIZE_MB=500

# Feature Flags
VITE_ENABLE_PREMIUM_FEATURES=true
VITE_ENABLE_ANALYTICS=false

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id
```

### Build-time Configuration

Customize the build process in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Customize output directory
    outDir: 'dist',
    
    // Generate source maps for production debugging
    sourcemap: true,
    
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['plotly.js-dist-min', 'recharts'],
        },
      },
    },
  },
});
```

## Performance Optimization

### 1. Enable Compression

Ensure your web server enables gzip or brotli compression for text assets.

### 2. Configure Caching

Set appropriate cache headers for static assets:
- HTML: `Cache-Control: no-cache` (always revalidate)
- JS/CSS: `Cache-Control: public, max-age=31536000, immutable` (1 year)
- Images: `Cache-Control: public, max-age=31536000` (1 year)

### 3. Use a CDN

For better global performance, serve static assets through a CDN:
- Cloudflare
- AWS CloudFront
- Fastly
- Akamai

### 4. Monitor Bundle Size

Check bundle size after building:

```bash
npm run build
```

Look for warnings about large chunks and consider code splitting if needed.

### 5. Optimize Images

Ensure all images are optimized:
- Use WebP format where supported
- Compress PNG/JPG images
- Use appropriate image dimensions

## SSL/TLS Configuration

For production deployments, always use HTTPS. Here's a basic Let's Encrypt setup with Certbot:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Monitoring and Logging

### Application Monitoring

Consider integrating:
- **Sentry** for error tracking
- **Google Analytics** or **Plausible** for usage analytics
- **LogRocket** for session replay

### Server Monitoring

Monitor your web server:
- CPU and memory usage
- Disk space
- Network traffic
- Response times

## Troubleshooting

### Build Fails

**Issue**: TypeScript compilation errors

**Solution**: 
```bash
npm run lint
npm run test
```
Fix any errors before building.

### Large Bundle Size

**Issue**: Bundle size exceeds limits

**Solution**: 
- Enable code splitting in `vite.config.ts`
- Lazy load routes and components
- Remove unused dependencies

### Blank Page After Deployment

**Issue**: Application shows blank page

**Solution**:
- Check browser console for errors
- Verify base URL in `vite.config.ts` matches deployment path
- Ensure SPA routing is configured correctly on server
- Check that all assets are being served correctly

### API Requests Failing

**Issue**: CORS errors or API requests fail

**Solution**:
- Verify API URLs in environment variables
- Check network tab in browser dev tools
- Ensure APIs are accessible from deployment domain
- Check for rate limiting issues

### IndexedDB Not Working

**Issue**: Cache not persisting data

**Solution**:
- Check browser storage quota
- Verify IndexedDB is enabled in browser
- Check for private/incognito mode restrictions
- Clear browser data and retry

## Security Considerations

### Content Security Policy

Add CSP headers to your web server configuration:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ergast.com https://api.openf1.org;" always;
```

### API Key Security

- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate API keys regularly
- Monitor API usage for anomalies

## Rollback Procedure

If issues occur after deployment:

1. Keep previous build artifacts:
```bash
mv dist dist-backup-$(date +%Y%m%d)
```

2. Restore previous version:
```bash
cp -r dist-backup-YYYYMMDD dist
```

3. Restart web server:
```bash
sudo systemctl restart nginx
```

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Support

For deployment issues or questions:
- Check the [GitHub Issues](https://github.com/yourusername/f1panopticon/issues)
- Review the [documentation](./docs/README.md)
- Contact the development team

## License

See [LICENSE](./LICENSE) file for details.
