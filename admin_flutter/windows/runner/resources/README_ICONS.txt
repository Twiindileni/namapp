CUSTOM ICONS SETUP
==================

1. APP ICON (Desktop/App Icon):
   - Place your icon file here: app_icon.ico
   - Format: .ico file (Windows icon format)
   - Recommended sizes: 16x16, 32x32, 48x48, 256x256 (multi-resolution .ico)
   - This will be used for:
     * The app executable icon
     * Desktop shortcut icon
     * Taskbar icon

2. INSTALLER ICONS (Optional):
   - Place installer_icon.ico in: admin_flutter\installer\
   - This will be used for the installer .exe icon
   - If not provided, the app icon will be used

HOW TO CREATE .ICO FILES:
- Use an online converter (e.g., convertio.co, ico-convert.com)
- Or use tools like GIMP, Photoshop, or IcoFX
- Your logo image (PNG/JPG) → convert to .ico format

AFTER ADDING ICONS:
1. Rebuild the Flutter app: flutter build windows --release
2. Recompile the Inno Setup installer
