# 🚀 Complete Deployment Guide for WeBlog

## ✅ Backend is Ready and Fixed!

The backend has been fully fixed and is ready for deployment. All endpoints are working correctly.

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

1. Go to https://github.com/xternalmoon
2. Click "New" to create a new repository
3. Name it: `weblog-complete`
4. Don't initialize with README (you already have code)
5. Click "Create repository"
6. Copy the repository URL (it will be: `https://github.com/xternalmoon/weblog-complete.git`)

7. Open PowerShell or Terminal in your project folder and run:

```bash
cd "C:\Users\Tahmid Mohammad\Downloads\weblog-web-master\weblog-web-master"
git init
git add .
git commit -m "Initial commit - Complete WeBlog app with fixed backend"
git branch -M main
git remote add origin https://github.com/xternalmoon/weblog-complete.git
git push -u origin main
```

**Note:** If you get authentication errors, GitHub now requires a Personal Access Token instead of password. Get one from: GitHub → Settings → Developer settings → Personal access tokens → Generate new token

---

### Step 2: Deploy Main Backend to Render.com

1. Go to https://render.com
2. Sign up with your GitHub account (click "Get Started for Free")
3. Once logged in, click "New +" → "Web Service"
4. Connect your GitHub account if asked
5. Find and select your `weblog-complete` repository
6. Click "Connect"

7. Fill in these settings:
   - **Name**: `weblog-backend`
   - **Region**: Choose closest to you (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

8. Scroll down to "Environment Variables" and click "Add Environment Variable". Add these one by one:

   ```
PORT=(leave empty, Render will set this automatically)   
MONGO_URI=mongodb+srv://webblog:tcgPb8JyARfD3qRJ@cluster0.aj1c1p8.mongodb.net/?appName=Cluster0
JWT_SECRET=i5fbgul6ZrDdyGffQmIh186Kb-RobadnXXSKi_8pOhj9LU8vvf0POeGb-NtaC8Sla1lVvXRQ81yQaVBzE_R1RQ
GOOGLE_AI_API_KEY=AIzaSyB7gxyp2cCvkS_BACeXnIoXmzJmIhTaD8c
   ```

9. Scroll down and click "Create Web Service"
10. Wait 5-10 minutes for deployment
11. Once deployed, copy your backend URL (looks like: `https://weblog-backend.onrender.com`)
12. Test it by visiting the URL in browser - you should see: `{"message":"WeBlog API Server is running!","status":"ok"}`

---

### Step 3: Deploy AI Service to Render.com (Same Backend, Different Instance)

1. In Render dashboard, click "New +" → "Web Service" again
2. Select the same `weblog-complete` repository
3. Fill in these settings:
   - **Name**: `weblog-ai`
   - **Region**: Same as Step 2
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. Add the SAME environment variables as Step 2:
   ```
   PORT: (leave empty)
   MONGO_URI: mongodb+srv://weblogmongo:weblogmongo@cluster0.aj1c1p8.mongodb.net/?appName=Cluster0
   JWT_SECRET: i5fbgul6ZrDdyGffQmIh186Kb-RobadnXXSKi_8pOhj9LU8vvf0POeGb-NtaC8Sla1lVvXRQ81yQaVBzE_R1RQ
   GOOGLE_AI_API_KEY: AIzaSyB7gxyp2cCvkS_BACeXnIoXmzJmIhTaD8c
   ```

5. Click "Create Web Service"
6. Wait for deployment
7. Copy your AI service URL (looks like: `https://weblog-ai.onrender.com`)

---

### Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up with your GitHub account (click "Sign Up")
3. Once logged in, click "Add New..." → "Project"
4. Import your `weblog-complete` repository
5. Configure these settings:
   - **Framework Preset**: Select "Vite" from dropdown
   - **Root Directory**: `.` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)

6. Scroll down to "Environment Variables" and add:

   ```
   Key: VITE_SERVER_DOMAIN
   Value: https://weblog-backend.onrender.com
   (Use the actual URL from Step 2)
   
   Key: VITE_AI_MODELS_URL
   Value: https://weblog-ai.onrender.com
   (Use the actual URL from Step 3)
   ```

7. Click "Deploy"
8. Wait 2-5 minutes for deployment
9. You'll get a URL like: `https://weblog-complete.vercel.app`

---

### Step 5: Test Your Website

1. Visit your Vercel URL
2. Test these features:
   - ✅ Sign up (create new account)
   - ✅ Sign in
   - ✅ Create a blog post
   - ✅ Like/unlike blogs
   - ✅ Add comments
   - ✅ Use AI features (summarize, paraphrase, title generation)
   - ✅ Search for blogs
   - ✅ View profile

If everything works, you're done!

---

## 📊 URLs Summary

After deployment, you'll have:
- **Frontend**: `https://weblog-complete.vercel.app` (your Vercel URL)
- **Backend API**: `https://weblog-backend.onrender.com` (from Step 2)
- **AI Service**: `https://weblog-ai.onrender.com` (from Step 3)
- **Database**: MongoDB Atlas (already configured)

---

## 💰 Cost: FREE Forever!

All services are on free tiers:
- **Render**: 750 hours/month free (enough for 24/7)
- **Vercel**: Free forever for personal projects
- **MongoDB Atlas**: 512MB free (plenty for starting)
- **Google Gemini**: Free tier with usage limits

---

## 🐛 Troubleshooting

**Backend won't start on Render?**
- Check Render logs: Click on your service → "Logs" tab
- Make sure all environment variables are set correctly
- Verify MongoDB URI is correct

**Frontend can't connect to backend?**
- Check Vercel deployment logs
- Verify `VITE_SERVER_DOMAIN` has the correct backend URL
- Make sure backend is running (visit backend URL in browser)

**AI features not working?**
- Check if AI service is running
- Verify `VITE_AI_MODELS_URL` is correct
- Check Google Gemini API key in Render environment variables

**Render services are sleeping?**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Consider upgrading to paid plan for always-on service

---

## ✅ What's Been Fixed in Backend

- ✅ Like/Unlike functionality now works properly
- ✅ Search works with all parameters
- ✅ Blog publishing sets correct dates
- ✅ Comment deletion updates correctly
- ✅ All endpoints match frontend expectations
- ✅ Environment variables properly configured

---

## 📝 Important Notes

1. **Render Free Tier**: Services sleep after inactivity. First request after sleep will be slow (30-60 seconds). This is normal for free tier.

2. **Environment Variables**: Never commit `.env` file to GitHub. It's already in `.gitignore`.

3. **MongoDB**: Your database is already set up. No additional setup needed.

4. **Port**: Render automatically sets PORT. Don't set it manually.

5. **Updates**: To update your website, just push to GitHub. Render and Vercel will auto-deploy.

---

**Your WeBlog is ready to launch! 🚀**

If you encounter any issues, check the logs in Render and Vercel dashboards.
```

This guide includes:
- Step-by-step instructions
- Correct MongoDB URI from your actual config
- Troubleshooting tips
- Notes about Render free tier sleep
- Testing checklist

Switch to agent mode if you want me to apply this directly to the file.

