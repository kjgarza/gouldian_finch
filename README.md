# 🇩🇪 BürgerTest Trainer

A modern, mobile-friendly web application to help you prepare for the German naturalization exam (Einbürgerungstest). Features spaced repetition learning, exam simulation, and bilingual support (German/English).

## ✨ Features

- **📚 Study Mode**: Spaced repetition learning (SM-2 algorithm) with 20-card batches
- **📝 Exam Simulation**: Practice with realistic 33-question exams (30 federal + 3 Berlin state)
- **🔍 Browse & Search**: Explore all questions with topic filtering and keyword search
- **📊 Statistics**: Track your progress, study streak, and accuracy
- **🌍 Bilingual Support**: German questions with optional English translations
- **📱 Mobile-First**: Responsive design optimized for mobile devices
- **⌨️ Keyboard Shortcuts**: Arrow keys for quick navigation during review
- **💾 Local Storage**: All progress saved locally in your browser

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd buergertest-trainer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 🚀 Deployment

### GitHub Pages (Automated)

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

1. Push your code to GitHub
2. Go to your repository settings → Pages
3. Set source to "GitHub Actions"
4. The workflow will automatically build and deploy your site

## 🎨 Data Format

Questions follow this schema:

```json
{
  "id": 1,
  "question": "Question text...",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "hint": "Helpful hint...",
  "topic": "Politik in der Demokratie" | "Geschichte und Verantwortung" | "Mensch und Gesellschaft" | "Bundesland Berlin"
}
```

Replace the sample data in `src/data/questions_de.json` and `src/data/questions_en.json` with your complete question sets.

## 🏗️ Tech Stack

- **Framework**: Vanilla TypeScript with Vite
- **Styling**: Tailwind CSS
- **State Management**: Local Storage
- **Build Tool**: Vite
- **Deployment**: GitHub Pages (automated)

---

**Good luck with your German naturalization exam! 🇩🇪✨**

- **🔍 Browse & Search**: Complete question database
  - Filter by topic (Politik, Geschichte, Gesellschaft, Berlin)
  - Keyword search in questions and answers
  - Reveal correct answers on demand
  - Bilingual helper toggle

- **📊 Statistics**: Comprehensive progress tracking
  - Study streak counter
  - Overall accuracy percentage
  - Cards due today
  - Learning progress visualization
  - Exam performance history

- **🌐 Bilingual Support**: German primary, English helper
  - Questions, answers, and hints in both languages
  - Global toggle for English assistance
  - Persistent language preference

## 🛠️ Tech Stack

- **TypeScript** (Vanilla) - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **LocalStorage** - Client-side data persistence

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm (or npm/yarn)

### Installation

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd buergertest-trainer

# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

\`\`\`bash
pnpm build
\`\`\`

### Deploy to GitHub Pages

1. Ensure `vite.config.ts` `base` matches your repo path for GitHub Pages
2. Install gh-pages: `pnpm add -D gh-pages`
3. Deploy: `pnpm deploy`

## 📊 Data Structure

Questions follow this schema:

\`\`\`json
{
  "id": 1,
  "question": "Wie heißt die Verfassung Deutschlands?",
  "choices": ["Grundgesetz", "Bundesgesetz", "Gesetzbuch", "Verfassungsgesetz"],
  "correctIndex": 0,
  "hint": "Es wurde 1949 eingeführt.",
  "topic": "Politik in der Demokratie"
}
\`\`\`

**Topics:**
- `Politik in der Demokratie` - Politics in Democracy
- `Geschichte und Verantwortung` - History and Responsibility  
- `Mensch und Gesellschaft` - People and Society
- `Bundesland Berlin` - State of Berlin

Both German and English files must share identical `id` and `topic` values for proper alignment.

## 💾 Data Persistence

Uses localStorage with these keys:
- `citizenTest_progress` - Spaced repetition progress
- `citizenTest_stats` - Learning statistics and streaks
- `citizenTest_exam` - Exam attempt history
- `citizenTest_langHelper` - Language preference

## 🧠 Learning Algorithm

Implements a simplified SM-2 (SuperMemo 2) algorithm:
- **Again**: Resets interval, reinserts in current session
- **Good**: Increases interval based on ease factor
- Ease factor bounds: [1.3, 2.8]
- Due cards prioritized by date, then new cards

## 📱 Mobile-First Design

- Large touch targets (minimum 44px)
- Responsive layout with Tailwind CSS
- Sticky bottom action bar on mobile
- High contrast and reduced motion support
- PWA-ready (can be added later)

## 🎯 Exam Requirements

The German naturalization test requires:
- 33 questions total
- 30 from federal topics
- 3 from your specific state (Berlin in this case)
- 17+ correct answers to pass (51.5%)
- No time limit in real exam

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests if needed
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Questions based on official German naturalization test materials
- SM-2 algorithm by Piotr Wozniak (SuperMemo)
- Icons from various emoji sets

---

Happy studying! 🎓 Viel Erfolg bei der Vorbereitung!
