# Deployment Guide

## Quick Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Gatherly MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/gatherly-mvp.git
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Add environment variable: `VITE_OPENAI_API_KEY` = your OpenAI API key
   - Click "Deploy"

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_OPENAI_API_KEY
```

## Environment Variables

Set these in your Vercel dashboard or via CLI:

- `VITE_OPENAI_API_KEY` - Your OpenAI API key (required)
- `VITE_API_BASE_URL` - Backend API URL (optional, for future use)

## Build Configuration

The project is configured with:
- ✅ `vercel.json` - Deployment configuration
- ✅ `vite.config.ts` - Build settings
- ✅ TypeScript support
- ✅ Environment variable handling

## Post-Deployment

1. **Test the deployed app:**
   - Complete onboarding flow
   - Test chat interface with OpenAI integration
   - Verify review cards work correctly

2. **Monitor:**
   - Check Vercel dashboard for deployment logs
   - Monitor OpenAI API usage
   - Watch for any runtime errors

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Follow DNS configuration instructions

## Production Checklist

- ✅ Environment variables set
- ✅ OpenAI API key configured
- ✅ Build succeeds locally
- ✅ All TypeScript errors resolved
- ✅ Responsive design tested
- ✅ Error handling in place

Your MVP is production-ready! 🚀
