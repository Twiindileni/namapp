Purpose Technology Admin - Windows installer (Inno Setup)
=========================================================

1. Build the Flutter app (Release)
   From "admin_flutter" folder run:
     .\build_windows_release.ps1
   Or manually:
     flutter build windows --release

2. Create the installer with Inno Setup
   - Install Inno Setup from https://jrsoftware.org/isinfo.php
   - Open PurposeTechnologyAdmin.iss in Inno Setup Compiler
   - Build > Compile
   The setup .exe will be in: admin_flutter\build\installer_output\

3. Optional: build from command line
   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" PurposeTechnologyAdmin.iss

Note: Run step 1 from the admin_flutter folder so the Release output path is correct.
