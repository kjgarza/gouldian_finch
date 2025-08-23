import { ALL_DE, byId, State } from '../state'
import type { Topic } from '../types'
import { Locales } from '../i18n'

const TOPICS: Array<{ label: string; value: Topic | 'ALL' }> = [
  { label: 'All Topics', value: 'ALL' },
  { label: 'Politik in der Demokratie', value: 'Politik in der Demokratie' },
  { label: 'Geschichte und Verantwortung', value: 'Geschichte und Verantwortung' },
  { label: 'Mensch und Gesellschaft', value: 'Mensch und Gesellschaft' },
  { label: 'Bundesland Berlin', value: 'Bundesland Berlin' },
]

export function BrowseView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  const showEN = Locales.get()

  root.innerHTML = `
    <header class="py-4">
      <h1 class="text-xl font-bold">🔍 Browse & Search</h1>
      <div class="mt-3 flex flex-col sm:flex-row gap-3">
        <input 
          id="search" 
          placeholder="Search keywords in questions or answers..." 
          class="input input-bordered w-full sm:flex-1" 
        />
        <select 
          id="topic" 
          class="select select-bordered w-full sm:w-64"
        ></select>
        <label class="label cursor-pointer flex items-center gap-2 px-4 py-3">
          <input type="checkbox" id="langToggle" class="checkbox" ${showEN ? 'checked' : ''}/>
          <span class="label-text text-sm">English helper</span>
        </label>
      </div>
    </header>
    
    <div class="card p-0 overflow-hidden bg-base-100 shadow">
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead class="bg-base-200">
            <tr>
              <th class="w-20">ID</th>
              <th>Question</th>
              <th class="w-80">Choices & Answer</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
      
      <div id="noResults" class="hidden p-8 text-center text-base-content opacity-60">
        <div class="text-4xl mb-2">🔍</div>
        <p>No questions found matching your criteria</p>
        <p class="text-sm mt-1">Try adjusting your search or topic filter</p>
      </div>
    </div>
  `

  const select = root.querySelector('#topic') as HTMLSelectElement
  for (const t of TOPICS) {
    const o = document.createElement('option')
    o.value = t.value
    o.textContent = t.label
    select.appendChild(o)
  }

  const search = root.querySelector('#search') as HTMLInputElement
  const langToggle = root.querySelector('#langToggle') as HTMLInputElement
  const noResults = root.querySelector('#noResults') as HTMLDivElement
  
  langToggle.addEventListener('change', () => { 
    Locales.set(langToggle.checked)
    render() 
  })

  function render() {
    State.filter.search = search.value.trim()
    State.filter.topic = (select.value as any)

    let list = ALL_DE
    
    // Filter by topic
    if (State.filter.topic !== 'ALL') {
      list = list.filter(q => q.topic === State.filter.topic)
    }
    
    // Filter by search term
    if (State.filter.search) {
      const s = State.filter.search.toLowerCase()
      list = list.filter(q => 
        q.question.toLowerCase().includes(s) || 
        q.choices.some(c => c.toLowerCase().includes(s)) ||
        q.hint.toLowerCase().includes(s)
      )
    }

    const tbody = root.querySelector('#tbody') as HTMLTableSectionElement
    tbody.innerHTML = ''

    if (list.length === 0) {
      noResults.classList.remove('hidden')
      return
    } else {
      noResults.classList.add('hidden')
    }

    for (const q of list) {
      const tr = document.createElement('tr')
      tr.className = 'border-b border-border hover:bg-accent/50'
      
      const showEnglish = langToggle.checked
      const en = byId(q.id).en
      
      tr.innerHTML = `
        <td class="align-top p-4 text-sm font-medium text-foreground">${q.id}</td>
        <td class="align-top p-4">
          <div class="font-medium text-foreground leading-relaxed">${q.question}</div>
          ${showEnglish ? `<div class='text-muted-foreground text-sm mt-2 italic leading-relaxed'>${en.question}</div>` : ''}
          <div class="mt-3">
            <span class="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              ${q.topic}
            </span>
          </div>
        </td>
        <td class="align-top p-4">
          <div class="space-y-2 mb-3">${q.choices.map((c, i) => `
            <div class="text-sm p-2 rounded border border-border choice-item" data-i="${i}" data-correct="${i === q.correctIndex}">
              <div class="font-medium">${String.fromCharCode(65 + i)}. ${c}</div>
              ${showEnglish ? `<div class='text-muted-foreground text-xs mt-1'>${en.choices[i]}</div>` : ''}
            </div>
          `).join('')}</div>
          
          <button class="text-sm text-primary hover:text-primary/80 underline mb-2" data-reveal>
            👁️ Reveal correct answer
          </button>
          
          <div class="hidden text-sm" data-ans>
            <div class="p-2 bg-success/10 border border-success/30 rounded">
              <div class="text-success font-medium">
                ✅ Correct: ${String.fromCharCode(65 + q.correctIndex)}. ${q.choices[q.correctIndex]}
              </div>
              ${showEnglish ? `<div class="text-success/80 text-xs mt-1">${en.choices[q.correctIndex]}</div>` : ''}
            </div>
            <div class="mt-2 p-2 bg-info/10 border border-info/30 rounded">
              <div class="text-info text-xs">
                💡 <strong>Hint:</strong> ${q.hint}
              </div>
              ${showEnglish ? `<div class="text-info/80 text-xs mt-1">${en.hint}</div>` : ''}
            </div>
          </div>
        </td>
      `
      
      const reveal = tr.querySelector('[data-reveal]') as HTMLButtonElement
      const ans = tr.querySelector('[data-ans]') as HTMLDivElement
      const choices = tr.querySelectorAll('.choice-item') as NodeListOf<HTMLDivElement>
      
      reveal.addEventListener('click', () => {
        ans.classList.toggle('hidden')
        if (!ans.classList.contains('hidden')) {
          reveal.textContent = '🙈 Hide answer'
          choices.forEach(choice => {
            const isCorrect = choice.dataset.correct === 'true'
            if (isCorrect) {
              choice.classList.add('bg-success/10', 'border-success/30')
            }
          })
        } else {
          reveal.textContent = '👁️ Reveal correct answer'
          choices.forEach(choice => {
            choice.classList.remove('bg-success/10', 'border-success/30')
          })
        }
      })
      
      tbody.appendChild(tr)
    }
    
    // Update header with count
    const header = root.querySelector('header h1')!
    header.textContent = `🔍 Browse & Search (${list.length} question${list.length !== 1 ? 's' : ''})`
  }

  search.addEventListener('input', render)
  select.addEventListener('change', render)
  
  // Set initial values
  select.value = State.filter.topic
  search.value = State.filter.search
  
  render()
  return root
}
