# Transferline Images Directory

This folder contains all images used in the Transferline premium travel website.

## 📁 Folder Structure

```
images/
├── vehicles/        # Vehicle fleet images
├── backgrounds/     # Hero and section background images
└── team/           # Driver and team photos
```

## 🚗 Vehicle Images (`/vehicles`)

| Filename | Description | Status |
|----------|-------------|--------|
| `tesla-model-s.jpg` | Tesla Model S (Saloon Experience) | ✅ Downloaded |
| `mitsubishi-outlander.png` | Mitsubishi Outlander (SUV Excellence) | ✅ Downloaded |
| `mercedes-s-class.png` | Mercedes-Benz S-Class (Elite Class) | ✅ Downloaded |
| `rolls-royce-phantom.jpg` | Rolls-Royce Phantom (First Class Royale) | ✅ Downloaded |
| `mercedes-v-class.jpg` | Mercedes-Benz V-Class (Executive MPV) | ✅ Downloaded |
| `mercedes-vito.jpg` | Mercedes-Benz Vito Tourer (Elite Group) | ⚠️ Needs replacement |
| `volkswagen-sharan.jpg` | Volkswagen Sharan (MPV Voyager) | ✅ Downloaded |
| `range-rover.jpg` | Range Rover (Executive) | ⚠️ Needs replacement |
| `bentley-flying-spur.jpg` | Bentley Flying Spur (Grand Tour) | ⚠️ Needs replacement |

## 🎨 Background Images (`/backgrounds`)

| Filename | Description | Usage | Status |
|----------|-------------|-------|--------|
| `hero-luxury-car.jpg` | Luxury car at night | Hero section, Customer/Admin pages | ✅ Downloaded |
| `luxury-interior.jpg` | Premium vehicle interior | Safety section | ✅ Downloaded |
| `uk-map.jpg` | UK map background | Routes section | ✅ Downloaded |
| `airport-terminal.jpg` | Airport terminal | CTA section | ⚠️ Needs replacement |
| `city-street.jpg` | City street view | About section | ⚠️ Needs replacement |
| `press-office.jpg` | Press/office setting | Press section | ⚠️ Needs replacement |

## 👥 Team Images (`/team`)

| Filename | Description | Status |
|----------|-------------|--------|
| `driver-marcus.jpg` | Driver photo (Marcus Sterling) | ✅ Downloaded |
| `team-meeting.jpg` | Team meeting photo | ✅ Downloaded |

## 🔄 How to Replace Images

**Supported image formats:** `.jpg`, `.jpeg`, `.png`

### 1. **Replace an Existing Image:**
   - Simply replace the file with your new image
   - **Keep the same filename** to avoid code changes
   - Recommended format: JPG or PNG (for photos)
   - Recommended size: 
     - Vehicles: 1600x1200px
     - Backgrounds: 2400x1600px
     - Team: 800x800px

### 2. **Add a New Image:**
   - Add your image to the appropriate folder
   - Update the code to reference: `/images/folder/your-image.jpg` or `/images/folder/your-image.png`

### 3. **Replace Missing Images (marked with ⚠️):**
   - Find a suitable replacement image
   - Save it with the exact filename shown above
   - The code will automatically use it

## 💡 Image Optimization Tips

1. **Size:** Keep images under 500KB for faster loading
2. **Format:** Use JPG for photos, PNG for logos (and photos are also fine as PNG)
3. **Resolution:** Use 2x resolution for retina displays
4. **Compression:** Use tools like TinyPNG or ImageOptim
5. **Naming:** Use descriptive, lowercase names with hyphens

## 🌐 Current Image Sources

All downloaded images are from Unsplash (unsplash.com) - a free stock photo service.

### License Information:
- All Unsplash images are free to use
- No attribution required (but appreciated)
- You can modify and use commercially
- Full license: https://unsplash.com/license

## 🔗 How Images are Referenced in Code

Images are referenced in two main ways:

1. **Direct `<img>` tags:**
   ```tsx
   <img src="/images/vehicles/tesla-model-s.jpg" alt="Tesla Model S" />
   ```

   PNG works the same way:
   ```tsx
   <img src="/images/vehicles/mitsubishi-outlander.png" alt="Mitsubishi Outlander" />
   ```

2. **CSS background images:**
   ```tsx
   style={{ backgroundImage: `url('/images/backgrounds/hero-luxury-car.jpg')` }}
   ```

## 📝 Notes

- The `/public` folder in Next.js serves files from the root
- Images in `/public/images/` are accessed as `/images/...` in your code
- Always use forward slashes `/` in paths, even on Windows
- Consider using Next.js `<Image>` component for automatic optimization

## ⚡ Need More Images?

**Free Stock Photo Sites:**
- Unsplash: https://unsplash.com
- Pexels: https://www.pexels.com
- Pixabay: https://pixabay.com

**Search Keywords for Premium Travel:**
- "luxury car interior"
- "chauffeur service"
- "premium sedan"
- "executive transport"
- "airport transfer"
- "mercedes benz"
- "rolls royce"

---

**Last Updated:** December 31, 2025
**Total Images:** 17 (11 downloaded, 6 need replacement)
