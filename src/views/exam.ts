import { ALL_DE } from '../state'
import { loadExamAttempts, saveExamAttempts, loadProgress, saveProgress, upsertCard } from '../storage'
import type { Question, ExamAttempt } from '../types'

function sampleExam(): Question[] {
  const berlin = ALL_DE.filter(q => q.topic === 'Bundesland Berlin')
  const federal = ALL_DE.filter(q => q.topic !== 'Bundesland Berlin')
  
  const pick = (arr: Question[], n: number) => {
    const a = [...arr]
    const out: Question[] = []
    while (out.length < n && a.length) {
      const i = Math.floor(Math.random() * a.length)
      out.push(a.splice(i,1)[0])
    }
    return out
  }
  
  return [...pick(federal, 30), ...pick(berlin, 3)]
}

export function ExamView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  const questions = sampleExam()
  const answers = new Map<number, number>()
  let idx = 0

  root.innerHTML = `
    <header class="py-4">
      <h1 class="text-xl font-bold">📝 Exam Simulation</h1>
      <p class="text-sm text-gray-600">33 questions · No timer · Pass with 17 correct</p>
    </header>
    <div id="area"></div>
    <div class="cta-bar">
      <button class="btn-secondary flex-1" id="backBtn">← Back</button>
      <button class="btn-primary flex-1" id="nextBtn">Next →</button>
    </div>
  `

  const area = root.querySelector('#area') as HTMLDivElement
  const backBtn = root.querySelector('#backBtn') as HTMLButtonElement
  const nextBtn = root.querySelector('#nextBtn') as HTMLButtonElement

  function render() {
    const q = questions[idx]
    const chosen = answers.get(q.id)
    
    area.innerHTML = `
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <span class="badge">${idx+1} / ${questions.length}</span>
          <span class="badge">${q.topic}</span>
        </div>
        
        <h2 class="mt-3 text-xl font-semibold mb-4">${q.question}</h2>
        <div class="mt-4 grid gap-2" id="choices"></div>
        
        <div class="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>Question ${idx + 1} of ${questions.length}</span>
          <span>${answers.size} answered</span>
        </div>
      </div>
    `

    const choicesBox = area.querySelector('#choices') as HTMLDivElement
    q.choices.forEach((c, i) => {
      const b = document.createElement('button')
      b.className = 'w-full text-left border-2 border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors'
      if (chosen === i) {
        b.classList.add('border-brand-400', 'bg-brand-50')
      }
      b.textContent = c
      b.addEventListener('click', () => { 
        answers.set(q.id, i)
        render() 
      })
      choicesBox.appendChild(b)
    })

    backBtn.disabled = idx === 0
    nextBtn.textContent = idx === questions.length - 1 ? 'Finish Exam' : 'Next →'
  }

  function finish() {
    const incorrect: { id: number; chosenIndex: number }[] = []
    let correct = 0
    
    for (const q of questions) {
      const c = answers.get(q.id)
      if (c === q.correctIndex) {
        correct++
      } else {
        incorrect.push({ id: q.id, chosenIndex: c ?? -1 })
      }
    }

    const pass = correct >= 17
    const attempts = loadExamAttempts()
    const newAttempt: ExamAttempt = {
      timestamp: new Date().toISOString(),
      score: correct,
      total: questions.length,
      questionIds: questions.map(q => q.id),
      incorrect
    }
    attempts.unshift(newAttempt)
    saveExamAttempts(attempts.slice(0, 20)) // Keep only last 20 attempts

    area.innerHTML = `
      <div class="card">
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">${pass ? '✅' : '❌'}</div>
          <h2 class="text-2xl font-bold">${correct}/${questions.length}</h2>
          <p class="text-lg ${pass ? 'text-green-600' : 'text-red-600'} font-semibold">
            ${pass ? 'PASSED' : 'FAILED'}
          </p>
          <p class="text-sm text-gray-600 mt-2">
            ${pass ? 'Congratulations! You would pass the exam.' : 'You need 17 or more correct answers to pass.'}
          </p>
        </div>
        
        ${incorrect.length > 0 ? `
          <div class="mb-6">
            <h3 class="font-semibold mb-3">❌ Wrong Answers (${incorrect.length})</h3>
            <div class="space-y-3 max-h-60 overflow-y-auto" id="wrongList"></div>
            <button id="addWrong" class="btn-primary mt-4 w-full">
              Add wrong answers to review deck
            </button>
          </div>
        ` : '<div class="mb-6 p-4 bg-green-50 rounded-lg text-center"><p class="text-green-700">🎉 Perfect score! No wrong answers!</p></div>'}
        
        <div>
          <h3 class="font-semibold mb-3">📊 Previous attempts (${attempts.length})</h3>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            ${attempts.slice(0, 10).map(a => `
              <div class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                <span>${new Date(a.timestamp).toLocaleDateString()}</span>
                <span class="font-medium ${a.score >= 17 ? 'text-green-600' : 'text-red-600'}">
                  ${a.score}/${a.total} ${a.score >= 17 ? '✅' : '❌'}
                </span>
              </div>
            `).join('')}
            ${attempts.length === 0 ? '<p class="text-sm text-gray-500">No previous attempts</p>' : ''}
          </div>
        </div>
        
        <button onclick="location.hash='#/'" class="btn-secondary mt-4 w-full">
          Back to Home
        </button>
      </div>
    `

    if (incorrect.length > 0) {
      const wrongList = area.querySelector('#wrongList') as HTMLDivElement
      wrongList.innerHTML = incorrect.map(w => {
        const q = questions.find(qq => qq.id === w.id)!
        return `
          <div class="border border-red-200 rounded-lg p-3 bg-red-50">
            <div class="font-medium text-sm">Question ${q.id}</div>
            <div class="text-sm mt-1">${q.question}</div>
            <div class="text-xs text-red-700 mt-2">
              Your answer: ${w.chosenIndex >= 0 ? q.choices[w.chosenIndex] : '—'}
            </div>
            <div class="text-xs text-green-700 mt-1">
              Correct: ${q.choices[q.correctIndex]}
            </div>
          </div>
        `
      }).join('')

      const addWrong = area.querySelector('#addWrong') as HTMLButtonElement
      addWrong.addEventListener('click', () => {
        const map = loadProgress()
        let m = map
        for (const w of incorrect) {
          m = upsertCard(m, w.id, (p) => ({ 
            ...p, 
            interval: 0, 
            dueDate: new Date().toISOString() 
          }))
        }
        saveProgress(m)
        addWrong.disabled = true
        addWrong.textContent = 'Added to review deck ✓'
        addWrong.classList.add('bg-green-600')
      })
    }
  }

  backBtn.addEventListener('click', () => { 
    if (idx > 0) { 
      idx--
      render() 
    } 
  })
  
  nextBtn.addEventListener('click', () => { 
    if (idx < questions.length - 1) { 
      idx++
      render() 
    } else { 
      finish() 
    } 
  })

  render()
  return root
}
