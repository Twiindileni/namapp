; Inno Setup script for Purpose Technology Admin (Flutter Windows)
; Build the app first: run build_windows_release.ps1 from admin_flutter folder

#define AppName "Purpose Technology Admin"
#define AppExeName "admin_flutter.exe"
#define AppVersion "1.0.0"
#define AppPublisher "Purpose Technology"
#define AppURL "https://example.com"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
DefaultDirName={autopf}\Purpose Technology Admin
DefaultGroupName=Purpose Technology Admin
AllowNoIcons=yes
OutputDir=..\build\installer_output
OutputBaseFilename=PurposeTechnologyAdmin_Setup_{#AppVersion}
; Custom installer icon (optional - if not found, will use default)
; Place your installer_icon.ico in the installer folder
SetupIconFile=installer_icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copy entire Release folder contents (exe + DLLs + data)
Source: "..\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
