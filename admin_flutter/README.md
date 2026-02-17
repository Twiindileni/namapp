# Purpose Technology Admin (Flutter)

Desktop and web admin app for managing your Supabase data. Built with Flutter for a modern UI.

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.0+)
- Windows: enable desktop support with `flutter config --enable-windows-desktop`

## Setup

1. **Generate platform runners (if missing)**  
   If the `windows/` or `web/` folders are not present, run from the `admin_flutter` folder:
   ```bash
   flutter create . --platforms=windows,web
   ```
   This adds the Windows and web project files without overwriting your `lib/` code.

2. **Copy your Supabase credentials into the app**
   - Open `assets/.env` and set:
     - `SUPABASE_URL` = your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your project's service role key (from Supabase Dashboard → Settings → API)
   - Optional: `ADMIN_USERNAME` and `ADMIN_PASSWORD` for local login (defaults to `admin` / `admin` if not set).
   - Or copy from your existing `cpp-admin/config.env` or repo root `.env.local` into `admin_flutter/assets/.env`.

3. **Install dependencies**
   ```bash
   cd admin_flutter
   flutter pub get
   ```

4. **Run the app**
   - **Windows desktop:** `flutter run -d windows`
   - **Web:** `flutter run -d chrome`

5. **Build Windows release (for installer or standalone exe)**
   From the `admin_flutter` folder:
   ```powershell
   flutter build windows --release
   ```
   If Flutter is not in your PATH, use the full path:
   ```powershell
   C:\src\flutter\bin\flutter.bat build windows --release
   ```
   Or run the helper script (tries to find Flutter automatically):
   ```powershell
   .\build_windows_release.ps1
   ```
   Output: `build\windows\x64\runner\Release\admin_flutter.exe` (and DLLs/data).

6. **Create Windows installer (Inno Setup)**
   - Build the app first (step 4).
   - Install [Inno Setup](https://jrsoftware.org/isinfo.php), then open `installer\PurposeTechnologyAdmin.iss` and choose **Build → Compile**.
   - The setup exe is created in `build\installer_output\PurposeTechnologyAdmin_Setup_1.0.0.exe`.
   - See `installer\README.txt` for more details.

## Features

- **Dashboard** — Stats cards and Quick Actions (same as your web admin)
- **Orders** — List and filter orders
- **Driving Bookings** — List driving school bookings
- **Contact Messages** — List contact form submissions
- **Quick Actions** — Jump to Users, Apps, Products, Orders, Loans, Ratings, Signals, Contacts, Photography, Devices, Driving School (all open in-app; no new window)
- **Management** — Approve/reject, update status, admin notes, and delete where applicable (Orders, Products, Loans, Users, Devices, Driving School, etc.)
- **Local admin login** — Sign in with username/password (configurable via .env)
- **Custom login background** — Place `login_bg.jpg` in `assets/images/` to customize

## Project structure

- `lib/main.dart` — Entry point, loads .env
- `lib/app.dart` — Main shell with sidebar and navigation
- `lib/config/env_config.dart` — Loads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env
- `lib/services/supabase_service.dart` — REST calls to Supabase with service role key
- `lib/screens/` — Dashboard, Orders, Bookings, Contacts, Products, Devices, GenericListScreen
- `assets/.env` — Your Supabase credentials (do not commit real keys)

## Notes

- Uses the same Supabase backend as your Next.js admin and C++ app.
- Service role key has full access; keep it secret and only use in trusted environments.
