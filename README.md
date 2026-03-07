# TeX-it

> **LaTeX should not feel harder than the ideas you're trying to write.**

LTeXch is a **native AI-powered LaTeX IDE** that makes technical writing faster and more intuitive. Speak your ideas, upload handwritten notes, or describe edits in plain English — LTeXch handles the LaTeX for you.

---

## ✨ Features

- **Voice-to-LaTeX** — Dictate ideas or commands using Deepgram speech-to-text, instantly converted into structured LaTeX.
- **Image-to-LaTeX** — Upload images of handwritten or printed notes; Gemini transcribes them into valid LaTeX code.
- **AI Editing** — Describe edits in natural language and let Gemini generate the correct LaTeX automatically.
- **Native Desktop IDE** — A fast, modern editor built with Electron, React, and TypeScript, designed for a smooth writing experience.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Desktop App | Electron, React, TypeScript |
| Backend | Go |
| Speech-to-Text | Deepgram API |
| AI / Image Transcription | Gemini API |
| Build Tools | Vite |

---

## 📁 Project Structure

```
LTeXch/
├── backend/          # Go backend server
│   ├── cmd/
│   ├── go.mod
│   └── go.sum
└── desktop/          # Electron + React frontend
    ├── src/
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Go](https://go.dev/) (v1.21+)
- Deepgram API key
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/LTeXch.git
   cd LTeXch
   ```

2. **Install frontend dependencies**
   ```bash
   cd desktop
   npm install
   ```

3. **Set up the backend**
   ```bash
   cd backend
   go mod tidy
   ```

4. **Configure environment variables**

   Create a `.env` file in the root or relevant config location with:
   ```env
   DEEPGRAM_API_KEY=your_deepgram_key
   GEMINI_API_KEY=your_gemini_key
   ```

5. **Run the app**
   ```bash
   # Start the backend
   cd backend && go run cmd/server.go

   # In a separate terminal, start the desktop app
   cd desktop && npm run dev
   ```

---

## 🔮 What's Next

- **Cloud Sync & Collaboration** — Access LaTeX documents from anywhere and collaborate in real time.
- **Plugin Ecosystem** — An extension system for developers to add custom tools, integrations, and workflows.

---

## 🏆 Built At

LTeXch was built at **Hack Days in the 6ix**.

---
