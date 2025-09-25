# setup_project.ps1

# Nama folder utama proyek
$projectName = "perplexity-gemini-clone"
New-Item -ItemType Directory -Name $projectName
Set-Location $projectName

# --- Membuat Struktur Folder Backend ---
New-Item -ItemType Directory -Name "backend"
New-Item -ItemType Directory -Name "backend/services"
New-Item -Path "backend/app.py" -ItemType File
New-Item -Path "backend/services/gemini_service.py" -ItemType File
New-Item -Path "backend/.env" -ItemType File
New-Item -Path "backend/requirements.txt" -ItemType File

# --- Membuat Struktur Folder Frontend ---
# Folder public
New-Item -ItemType Directory -Name "public"
New-Item -Path "public/index.html" -ItemType File

# Folder src
New-Item -ItemType Directory -Name "src"
New-Item -ItemType Directory -Name "src/components"
New-Item -ItemType Directory -Name "src/styles"
New-Item -ItemType Directory -Name "src/js"

# File-file di dalam src
New-Item -Path "src/components/sidebar.js" -ItemType File
New-Item -Path "src/components/main-content.js" -ItemType File
New-Item -Path "src/components/chat-input.js" -ItemType File
New-Item -Path "src/styles/main.css" -ItemType File
New-Item -Path "src/js/main.js" -ItemType File
New-Item -Path "src/js/api.js" -ItemType File
New-Item -Path "src/js/ui-helpers.js" -ItemType File

# --- Membuat File Konfigurasi & Dokumentasi ---
New-Item -Path "README.md" -ItemType File
New-Item -Path "package.json" -ItemType File # Opsional

# --- Menambahkan konten awal ke beberapa file penting ---
Set-Content -Path "README.md" -Value "# Proyek Klon Perplexity dengan Gemini AI"
Set-Content -Path "package.json" -Value '{
  "name": "perplexity-gemini-clone",
  "version": "1.0.0",
  "description": "Frontend for AI chat application.",
  "main": "src/js/main.js",
  "scripts": {
    "start": "live-server public"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}'
Set-Content -Path "backend/.env" -Value 'GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"'

Write-Host "Struktur proyek '$projectName' berhasil dibuat."
Set-Location ..