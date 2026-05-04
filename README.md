# FiOS Website

A Docusaurus-powered website for FiOS - the business development platform for consultancies.

## Project Structure

```
fios-website/
├── docs/                    # Knowledge base documentation
│   ├── intro.md
│   ├── opportunity-tracker.md
│   ├── talent-wall.md
│   └── bid-builder.md
├── src/
│   ├── css/
│   │   └── custom.css      # All custom styles
│   └── pages/
│       ├── index.tsx       # Homepage
│       └── story.tsx       # Our Story page
├── static/
│   └── img/
│       ├── assets/         # Your custom assets go here
│       │   ├── fioshero.mp4    # Hero background video
│       │   ├── eolas.jpg       # Eolas team photo
│       │   ├── opptracker.png  # Opportunity Tracker screenshot
│       │   ├── talentwall.png  # Talent Wall screenshot
│       │   └── bidbuilder.png  # Bid Builder screenshot
│       └── logo.svg        # FiOS logo
├── docusaurus.config.ts    # Site configuration
└── package.json
```

## Adding Your Assets

Place your image/video files in `static/img/assets/`:

1. `fioshero.mp4` - Hero section background video
2. `eolas.jpg` - Team photo for About section
3. `opptracker.png` - Opportunity Tracker screenshot
4. `talentwall.png` - Talent Wall screenshot  
5. `bidbuilder.png` - Bid Builder screenshot

After adding assets, uncomment the video element in `src/pages/index.tsx` (lines 82-85).

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Serve production build locally
npm run serve
```

## Deploy to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Vercel will auto-detect Docusaurus. Use these settings:
   - **Framework Preset**: Docusaurus 2
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Click **Deploy**

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Optional)

If you need environment variables, add them in Vercel Dashboard:
- Project Settings → Environment Variables

## Custom Domain Setup

1. In Vercel Dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `fios.eolassolutions.com.au`)
4. Update your DNS settings as instructed
5. Update `docusaurus.config.ts` with your actual URL:
   ```ts
   url: 'https://fios.eolassolutions.com.au',
   ```

## Updating Content

### Homepage
Edit `src/pages/index.tsx`

### Story Page  
Edit `src/pages/story.tsx`

### Styles
Edit `src/css/custom.css`

### Knowledge Base
Add/edit files in `docs/` folder

### Navigation
Edit `docusaurus.config.ts` → `themeConfig.navbar.items`

## Build Output

The production build creates static files in the `build/` directory, ready for deployment to any static hosting service.

---

Built with ❤️ in Canberra by Eolas Solutions
