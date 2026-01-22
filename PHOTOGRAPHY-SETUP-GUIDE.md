# Photography Portfolio Setup Guide

## 🎉 What's Been Created

Your website now has a complete photography portfolio management system! Here's what's included:

### Frontend Features
- **Beautiful Photography Portfolio Page** at `/categories`
  - Hero image slider with smooth transitions
  - Photography categories gallery
  - Pricing packages display
  - Fully responsive design

### Admin Dashboard
- **Photography Management Dashboard** at `/admin/photography`
  - Categories management
  - Photo upload and management
  - Pricing packages management
  - Hero slides management

## 📋 Setup Instructions

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard: https://lpopeqjjufmpqfcjsgre.supabase.co
2. Go to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the contents of `photography-migration.sql`
5. Click **"Run"** to execute the migration

This will create:
- `photography_categories` table
- `photography_photos` table
- `photography_packages` table
- `photography_hero_slides` table
- All necessary RLS policies
- Initial sample data

### Step 2: Create Supabase Storage Bucket

1. In your Supabase Dashboard, go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create a bucket with these settings:
   - **Name**: `photos`
   - **Public bucket**: ✅ Check this (so photos are publicly accessible)
4. Click **"Create bucket"**

#### Set Storage Policies

After creating the bucket, set up the storage policies:

1. Click on the `photos` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Create the following policies:

**Policy 1: Public Read Access**
- **Policy name**: `Public read access`
- **Allowed operation**: SELECT
- **Target roles**: public
- **Policy definition**: `true`

**Policy 2: Admin Upload Access**
```sql
CREATE POLICY "Admin upload access" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Policy 3: Admin Delete Access**
```sql
CREATE POLICY "Admin delete access" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Step 3: Access the Admin Dashboard

1. Make sure you're logged in as an admin user
2. Go to: http://localhost:3001/admin
3. Click on **"Photography Portfolio"**
4. You'll see the photography management dashboard

## 🎨 How to Use

### Managing Categories

1. Go to `/admin/photography/categories`
2. Click **"+ Add Category"**
3. Fill in:
   - Category name (e.g., "Weddings")
   - Slug (auto-generated, e.g., "weddings")
   - Description
   - Cover image URL (optional for now)
   - Display order
   - Active status
4. Click **"Create Category"**

### Uploading Photos

1. Go to `/admin/photography/photos`
2. Click **"+ Upload Photo"**
3. Either:
   - **Drag and drop** an image file, or
   - Click **"Upload a file"** to browse
   - Or paste an image URL
4. Select the category
5. Add title and description (optional)
6. Check **"Mark as featured"** to show in category preview
7. Click **"Add Photo"**

### Managing Pricing Packages

1. Go to `/admin/photography/packages`
2. Click **"+ Add Package"**
3. Fill in:
   - Package name (e.g., "Basic Package")
   - Price in Namibian Dollars
   - Duration (e.g., "2 hours")
   - Features (click "Add Feature" for each)
   - Mark as "Most Popular" if desired
4. Click **"Create Package"**

### Managing Hero Slides

1. Go to `/admin/photography/hero-slides`
2. Click **"+ Add Slide"**
3. Upload an image (recommended size: 1200x600)
4. Add title and subtitle (optional)
5. Set display order
6. Click **"Create Slide"**

## 📂 File Structure

```
src/
├── app/
│   ├── categories/
│   │   └── page.tsx              # Main photography portfolio page
│   └── admin/
│       └── photography/
│           ├── page.tsx           # Photography dashboard
│           ├── categories/
│           │   └── page.tsx       # Manage categories
│           ├── photos/
│           │   └── page.tsx       # Upload & manage photos
│           ├── packages/
│           │   └── page.tsx       # Manage pricing
│           └── hero-slides/
│               └── page.tsx       # Manage hero slider
```

## 🗃️ Database Schema

### photography_categories
- `id` (uuid, primary key)
- `name` (text, unique)
- `slug` (text, unique)
- `description` (text)
- `cover_image_url` (text, nullable)
- `display_order` (integer)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamps)

### photography_photos
- `id` (uuid, primary key)
- `category_id` (uuid, foreign key)
- `title` (text, nullable)
- `description` (text, nullable)
- `image_url` (text)
- `thumbnail_url` (text, nullable)
- `is_featured` (boolean)
- `display_order` (integer)
- `uploaded_by` (uuid, foreign key to users)
- `created_at`, `updated_at` (timestamps)

### photography_packages
- `id` (uuid, primary key)
- `name` (text)
- `price` (numeric)
- `duration` (text)
- `features` (jsonb array)
- `is_popular` (boolean)
- `display_order` (integer)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamps)

### photography_hero_slides
- `id` (uuid, primary key)
- `title` (text, nullable)
- `subtitle` (text, nullable)
- `image_url` (text)
- `display_order` (integer)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamps)

## 🔒 Security (Row Level Security)

All tables have RLS enabled with the following policies:
- **Public**: Can read active/published content
- **Admin**: Can create, read, update, and delete all content

## 🚀 Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Create the storage bucket** in Supabase Storage
3. **Login as admin** and start adding your photography content
4. **Upload your actual photos** to replace placeholder images

## 💡 Tips

- Use high-quality images (at least 1920x1080 for hero slides)
- Keep category descriptions concise and engaging
- Mark your best 3 photos as "featured" in each category
- Use the display_order field to control the arrangement
- Deactivate items instead of deleting to preserve data

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify your admin role in the database
3. Ensure the storage bucket is created and public
4. Make sure all migrations ran successfully

Enjoy your new photography portfolio! 📸✨
