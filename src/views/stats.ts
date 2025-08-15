import { loadProgress, resetAll, loadStats, loadExamAttempts } from '../storage'
import { ALL_DE } from '../state'

function dueToday(): number {
  const prog = loadProgress()
  const today = new Date().toISOString().slice(0,10)
  return Object.values(prog).filter(p => p.dueDate.slice(0,10) <= today).length
}

function totalLearned(): number {
  const prog = loadProgress()
  return Object.keys(prog).length
}

export function StatsView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'
  
  const stats = loadStats()
  const due = dueToday()
  const learned = totalLearned()
  const attempts = loadExamAttempts()
  const lastAttempt = attempts[0]
  const passedAttempts = attempts.filter(a => a.score >= 17).length
  const averageScore = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0

  root.innerHTML = `
    <header class="py-4">
      <h1 class="text-xl font-bold">📊 Statistics</h1>
      <p class="text-muted-foreground text-sm">Track your learning progress and exam performance</p>
    </header>
    
    <!-- Key Stats -->
    <div class="grid gap-4 sm:grid-cols-3 mb-6">
      <div class="card text-center">
        <div class="text-muted-foreground text-sm font-medium">Study Streak</div>
        <div class="text-3xl font-bold text-primary mt-1">${stats.streak || 0}</div>
        <div class="text-xs text-muted-foreground mt-1">day${stats.streak !== 1 ? 's' : ''}</div>
      </div>
      
      <div class="card text-center">
        <div class="text-muted-foreground text-sm font-medium">Overall Accuracy</div>
        <div class="text-3xl font-bold text-success mt-1">${Math.round((stats.accuracy || 0) * 100)}%</div>
        <div class="text-xs text-muted-foreground mt-1">${stats.totalAnswered || 0} questions answered</div>
      </div>
      
      <div class="card text-center">
        <div class="text-muted-foreground text-sm font-medium">Due Today</div>
        <div class="text-3xl font-bold text-warning mt-1">${due}</div>
        <div class="text-xs text-muted-foreground mt-1">cards ready for review</div>
      </div>
    </div>
    
    <!-- Learning Progress -->
    <div class="grid gap-4 sm:grid-cols-2 mb-6">
      <div class="card">
        <h2 class="text-lg font-semibold mb-3">📚 Learning Progress</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground">Questions learned</span>
            <span class="font-semibold">${learned} / ${ALL_DE.length}</span>
          </div>
          <div class="w-full bg-secondary rounded-full h-2">
            <div class="bg-primary h-2 rounded-full transition-all duration-300" 
                 style="width: ${(learned / ALL_DE.length * 100)}%"></div>
          </div>
          <div class="text-xs text-muted-foreground">
            ${Math.round((learned / ALL_DE.length) * 100)}% complete
          </div>
          
          ${stats.lastStudyDate ? `
            <div class="pt-2 border-t border-border text-sm text-muted-foreground">
              Last study session: ${new Date(stats.lastStudyDate).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="card">
        <h2 class="text-lg font-semibold mb-3">🎯 Exam Performance</h2>
        <div class="space-y-3">
          ${attempts.length > 0 ? `
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Exams taken</span>
              <span class="font-semibold">${attempts.length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Exams passed</span>
              <span class="font-semibold text-success">${passedAttempts}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Average score</span>
              <span class="font-semibold">${averageScore}/33</span>
            </div>
            
            ${lastAttempt ? `
              <div class="pt-2 border-t border-border">
                <div class="text-sm text-muted-foreground">Last exam:</div>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-sm">${new Date(lastAttempt.timestamp).toLocaleDateString()}</span>
                  <span class="font-semibold ${lastAttempt.score >= 17 ? 'text-success' : 'text-destructive'}">
                    ${lastAttempt.score}/33 ${lastAttempt.score >= 17 ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ` : ''}
          ` : `
            <div class="text-center text-muted-foreground py-4">
              <div class="text-2xl mb-2">📝</div>
              <div class="text-sm">No exam attempts yet</div>
              <button onclick="location.hash='#/exam'" class="btn-primary text-sm mt-2">
                Take your first exam
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
    
    <!-- Recent Exam History -->
    ${attempts.length > 0 ? `
      <div class="card mb-6">
        <h2 class="text-lg font-semibold mb-3">📈 Recent Exam History</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-border">
              <tr class="text-left">
                <th class="pb-2 font-medium text-muted-foreground">Date</th>
                <th class="pb-2 font-medium text-muted-foreground">Score</th>
                <th class="pb-2 font-medium text-muted-foreground">Result</th>
                <th class="pb-2 font-medium text-muted-foreground">Wrong Answers</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${attempts.slice(0, 5).map(attempt => `
                <tr class="py-2">
                  <td class="py-2">${new Date(attempt.timestamp).toLocaleDateString()}</td>
                  <td class="py-2 font-medium">${attempt.score}/${attempt.total}</td>
                  <td class="py-2">
                    <span class="inline-block px-2 py-1 rounded text-xs font-medium
                      ${attempt.score >= 17 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                      }">
                      ${attempt.score >= 17 ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td class="py-2 text-muted-foreground">${attempt.incorrect.length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Reset Section -->
    <div class="card border border-destructive/20">
      <h2 class="text-lg font-semibold text-destructive mb-3">🗑️ Reset Progress</h2>
      <p class="text-sm text-muted-foreground mb-4">
        This will permanently delete all your progress, statistics, and exam history. 
        This action cannot be undone.
      </p>
      <button class="btn-secondary border-destructive/30 text-destructive hover:bg-destructive/10" id="resetBtn">
        Reset All Data
      </button>
    </div>
  `

  root.querySelector('#resetBtn')!.addEventListener('click', () => {
    const confirmed = confirm(
      'Are you sure you want to reset all your data?\\n\\n' +
      'This will delete:\\n' +
      '• All learning progress\\n' +
      '• Statistics and streak\\n' +
      '• Exam history\\n\\n' +
      'This action cannot be undone!'
    )
    
    if (confirmed) {
      const doubleConfirm = confirm('Last chance! Are you absolutely sure?')
      if (doubleConfirm) {
        resetAll()
        localStorage.removeItem('citizenTest_langHelper')
        location.reload()
      }
    }
  })

  return root
}
