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
      <p class="text-base-content opacity-70 text-sm">Track your learning progress and exam performance</p>
    </header>
    
    <!-- Key Stats -->
    <div class="grid gap-4 sm:grid-cols-3 mb-6">
      <div class="card bg-base-100 shadow p-4 text-center">
        <div class="text-base-content opacity-70 text-sm font-medium">Study Streak</div>
        <div class="text-3xl font-bold text-primary mt-1">${stats.streak || 0}</div>
        <div class="text-xs text-base-content opacity-70 mt-1">day${stats.streak !== 1 ? 's' : ''}</div>
      </div>
      
      <div class="card bg-base-100 shadow p-4 text-center">
        <div class="text-base-content opacity-70 text-sm font-medium">Overall Accuracy</div>
        <div class="text-3xl font-bold text-success mt-1">${Math.round((stats.accuracy || 0) * 100)}%</div>
        <div class="text-xs text-base-content opacity-70 mt-1">${stats.totalAnswered || 0} questions answered</div>
      </div>
      
      <div class="card bg-base-100 shadow p-4 text-center">
        <div class="text-base-content opacity-70 text-sm font-medium">Due Today</div>
        <div class="text-3xl font-bold text-warning mt-1">${due}</div>
        <div class="text-xs text-base-content opacity-70 mt-1">cards ready for review</div>
      </div>
    </div>
    
    <!-- Learning Progress -->
    <div class="grid gap-4 sm:grid-cols-2 mb-6">
      <div class="card bg-base-100 shadow p-4">
        <h2 class="text-lg font-semibold mb-3">📚 Learning Progress</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-base-content opacity-70">Questions learned</span>
            <span class="font-semibold">${learned} / ${ALL_DE.length}</span>
          </div>
          <div class="w-full bg-base-200 rounded-full h-2">
            <div class="bg-primary h-2 rounded-full transition-all duration-300" 
                 style="width: ${(learned / ALL_DE.length * 100)}%"></div>
          </div>
          <div class="text-xs text-base-content opacity-70">
            ${Math.round((learned / ALL_DE.length) * 100)}% complete
          </div>
          
          ${stats.lastStudyDate ? `
            <div class="pt-2 border-t border-base-300 text-sm text-base-content opacity-70">
              Last study session: ${new Date(stats.lastStudyDate).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="card bg-base-100 shadow p-4">
        <h2 class="text-lg font-semibold mb-3">🎯 Exam Performance</h2>
        <div class="space-y-3">
          ${attempts.length > 0 ? `
            <div class="flex justify-between items-center">
              <span class="text-base-content opacity-70">Exams taken</span>
              <span class="font-semibold">${attempts.length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content opacity-70">Exams passed</span>
              <span class="font-semibold text-success">${passedAttempts}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content opacity-70">Average score</span>
              <span class="font-semibold">${averageScore}/33</span>
            </div>
            
            ${lastAttempt ? `
              <div class="pt-2 border-t border-base-300">
                <div class="text-sm text-base-content opacity-70">Last exam:</div>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-sm">${new Date(lastAttempt.timestamp).toLocaleDateString()}</span>
                  <span class="font-semibold ${lastAttempt.score >= 17 ? 'text-success' : 'text-error'}">
                    ${lastAttempt.score}/33 ${lastAttempt.score >= 17 ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ` : ''}
          ` : `
            <div class="text-center text-base-content opacity-70 py-4">
              <div class="text-2xl mb-2">📝</div>
              <div class="text-sm">No exam attempts yet</div>
              <button onclick="location.hash='#/exam'" class="btn btn-primary text-sm mt-2">
                Take your first exam
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
    
    <!-- Recent Exam History -->
    ${attempts.length > 0 ? `
      <div class="card bg-base-100 shadow p-4 mb-6">
        <h2 class="text-lg font-semibold mb-3">📈 Recent Exam History</h2>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th class="text-base-content opacity-70">Date</th>
                <th class="text-base-content opacity-70">Score</th>
                <th class="text-base-content opacity-70">Result</th>
                <th class="text-base-content opacity-70">Wrong Answers</th>
              </tr>
            </thead>
            <tbody>
              ${attempts.slice(0, 5).map(attempt => `
                <tr>
                  <td>${new Date(attempt.timestamp).toLocaleDateString()}</td>
                  <td class="font-medium">${attempt.score}/${attempt.total}</td>
                  <td>
                    <div class="badge ${attempt.score >= 17 ? 'badge-success' : 'badge-error'}">
                      ${attempt.score >= 17 ? 'PASSED' : 'FAILED'}
                    </div>
                  </td>
                  <td class="text-base-content opacity-70">${attempt.incorrect.length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Reset Section -->
    <div class="card bg-base-100 shadow p-4 border border-error">
      <h2 class="text-lg font-semibold text-error mb-3">🗑️ Reset Progress</h2>
      <p class="text-sm text-base-content opacity-70 mb-4">
        This will permanently delete all your progress, statistics, and exam history. 
        This action cannot be undone.
      </p>
      <button class="btn btn-outline btn-error" id="resetBtn">
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
