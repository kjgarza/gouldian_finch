import { ALL_BERLIN_DE, ALL_DE } from '../state'
import { loadExamAttempts, saveExamAttempts, loadProgress, saveProgress, upsertCard } from '../storage'
import type { Question, ExamAttempt } from '../types'
import { navigate } from '../router'
import { BERLIN_TOPIC, studyIdForQuestion } from '../lib/study-ids'
import { recordExamCompletion } from '../lib/study-stats'
import { bindDiagramToggles, diagramHintHtml } from '../diagrams'
import { topicMeta } from '../lib/topics'

function sampleExam(): Question[] {
  const berlin = ALL_BERLIN_DE
  const federal = ALL_DE.filter(q => q.topic !== BERLIN_TOPIC)

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
  // The action bar outlives the results screen, so "Finish Exam" stays
  // clickable; without this the same attempt is stored again on every click.
  let finished = false

  root.innerHTML = `
    <header class="exam-header">
      <div>
        <h1 class="font-serif text-[28px]">Practice exam</h1>
        <p class="font-mono text-xs text-muted">33 questions · no timer · pass with 17</p>
      </div>
      <button id="exitBtn" class="btn btn-ghost btn-sm">Exit exam</button>
    </header>
    <div class="exam-body">
      <div id="area"></div>
    </div>
    <div class="cta-bar" id="ctaBar">
      <button class="btn btn-outline min-h-14 flex-1" id="backBtn">Back</button>
      <button class="btn btn-primary min-h-14 flex-1" id="nextBtn">Next</button>
    </div>
  `

  const area = root.querySelector('#area') as HTMLDivElement
  const backBtn = root.querySelector('#backBtn') as HTMLButtonElement
  const nextBtn = root.querySelector('#nextBtn') as HTMLButtonElement
  const exitBtn = root.querySelector('#exitBtn') as HTMLButtonElement
  const ctaBar = root.querySelector('#ctaBar') as HTMLDivElement

  function render() {
    const q = questions[idx]
    const chosen = answers.get(q.id)
    const meta = topicMeta(q.topic)

    area.innerHTML = `
      <div class="flex items-center justify-between font-mono text-xs text-muted">
        <span class="inline-flex items-center gap-2 ${meta.className}"><span class="topic-mark" aria-hidden="true"></span>${meta.short} · Nr. ${q.id}</span>
        <span>${idx + 1}/${questions.length} · ${answers.size} answered</span>
      </div>
      <h2 lang="de" class="mt-3 font-serif text-[28px] leading-[1.18]">${q.question}</h2>
      <div class="mt-4 flex flex-col border-t border-base-300" id="choices"></div>
    `

    const choicesBox = area.querySelector('#choices') as HTMLDivElement
    q.choices.forEach((c, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'answer px-3 text-[17px]'
      b.lang = 'de'
      b.setAttribute('aria-pressed', String(chosen === i))
      if (chosen === i) {
        b.classList.add('font-semibold', 'bg-base-200')
      }
      b.textContent = c
      b.addEventListener('click', () => {
        answers.set(q.id, i)
        render()
      })
      choicesBox.appendChild(b)
    })

    backBtn.disabled = idx === 0
    nextBtn.textContent = idx === questions.length - 1 ? 'Finish exam' : 'Next'
  }

  function finish() {
    if (finished) return
    finished = true

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
    recordExamCompletion(correct, questions.length)

    // The bar sits outside the results area, so it has to go explicitly.
    ctaBar.remove()

    // Per-topic split, in the order topics first appear in the exam.
    const byTopic = new Map<string, { correct: number; total: number }>()
    for (const q of questions) {
      const row = byTopic.get(q.topic) ?? { correct: 0, total: 0 }
      row.total++
      if (answers.get(q.id) === q.correctIndex) row.correct++
      byTopic.set(q.topic, row)
    }
    const passMark = (17 / questions.length) * 100

    area.innerHTML = `
      <section class="result-head ${pass ? 'result-head-pass' : 'result-head-fail'}">
        <p class="font-mono text-xs opacity-75">${pass ? 'Passed' : 'Not passed'} · 17 needed</p>
        <p class="mt-1 flex items-baseline gap-2.5 font-serif">
          <span class="text-[120px] leading-[0.9]">${correct}</span>
          <span class="text-[34px] opacity-75">/ ${questions.length}</span>
        </p>
        <div class="relative mt-5 h-1.5 rounded-full bg-white/20" aria-hidden="true">
          <div class="h-full rounded-full bg-surface" style="width: ${(correct / questions.length) * 100}%"></div>
          <div class="absolute -top-[5px] h-4 w-0.5 bg-live" style="left: ${passMark}%"></div>
        </div>
        <p class="mt-3 text-sm opacity-85">
          ${pass ? 'You would pass the exam.' : 'You need 17 or more correct answers to pass.'}
        </p>
      </section>

      <section class="mt-5" aria-label="By topic">
        <h3 class="font-mono text-xs text-muted">By topic</h3>
        <div class="mt-1 flex flex-col">
          ${[...byTopic].map(([topic, row]) => `
            <div class="flex min-h-12 items-center gap-3 border-b border-base-300 ${topicMeta(topic).className}">
              <span class="topic-mark size-2.5" aria-hidden="true"></span>
              <span class="flex-1">${topic}</span>
              <span class="font-mono text-[13px]">${row.correct}/${row.total}</span>
            </div>
          `).join('')}
        </div>
      </section>

      ${incorrect.length > 0 ? `
        <section class="mt-6">
          <h3 class="font-mono text-xs text-muted">${incorrect.length} ${incorrect.length === 1 ? 'mistake' : 'mistakes'}</h3>
          <div class="mt-2 space-y-3" id="wrongList"></div>
          <button id="addWrong" class="btn btn-primary mt-4 w-full">
            Add wrong answers to review deck
          </button>
        </section>
      ` : '<p class="mt-6 font-serif text-xl">Perfect score. No wrong answers.</p>'}

      <section class="mt-8">
        <h3 class="font-mono text-xs text-muted">Previous attempts (${attempts.length})</h3>
        <div class="mt-1 flex flex-col">
          ${attempts.slice(0, 10).map(a => `
            <div class="flex min-h-11 items-center justify-between border-b border-base-300 text-sm">
              <span>${new Date(a.timestamp).toLocaleDateString()}</span>
              <span class="font-mono ${a.score >= 17 ? 'text-correct' : 'text-wrong'}">
                ${a.score}/${a.total} ${a.score >= 17 ? 'passed' : 'not passed'}
              </span>
            </div>
          `).join('')}
        </div>
      </section>

      <button type="button" id="doneBtn" class="btn btn-outline mt-6 w-full">Back to home</button>
    `
    area.querySelector('#doneBtn')!.addEventListener('click', () => navigate('#/'))

    if (incorrect.length > 0) {
      const wrongList = area.querySelector('#wrongList') as HTMLDivElement
      wrongList.innerHTML = incorrect.map(w => {
        const q = questions.find(qq => qq.id === w.id)!
        return `
          <div class="border-b border-base-300 pb-3 ${topicMeta(q.topic).className}">
            <div class="flex items-center gap-2 font-mono text-xs text-muted"><span class="topic-mark" aria-hidden="true"></span>Nr. ${q.id}</div>
            <div lang="de" class="mt-1 font-serif text-[17px] leading-snug">${q.question}</div>
            <div class="mt-2 text-sm text-wrong">
              Your answer: <span lang="de">${w.chosenIndex >= 0 ? q.choices[w.chosenIndex] : '—'}</span>
            </div>
            <div class="mt-0.5 text-sm font-semibold text-correct">
              Correct: <span lang="de">${q.choices[q.correctIndex]}</span>
            </div>
            ${diagramHintHtml(q.id, false)}
          </div>
        `
      }).join('')
      bindDiagramToggles(wrongList)

      const addWrong = area.querySelector('#addWrong') as HTMLButtonElement
      addWrong.addEventListener('click', () => {
        const map = loadProgress()
        let m = map
        for (const w of incorrect) {
          const q = questions.find(qq => qq.id === w.id)!
          m = upsertCard(m, studyIdForQuestion(q), (p) => ({
            ...p,
            interval: 0,
            dueDate: new Date().toISOString()
          }))
        }
        saveProgress(m)
        addWrong.disabled = true
        addWrong.textContent = 'Added to review deck'
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

  exitBtn.addEventListener('click', () => navigate('#/'))

  render()
  return root
}
