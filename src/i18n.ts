const LANG_KEY = 'citizenTest_langHelper'

export const Locales = {
  get(): boolean {
    try {
      const stored = localStorage.getItem(LANG_KEY)
      return stored ? JSON.parse(stored).showEnglish : false
    } catch {
      return false
    }
  },
  
  set(showEnglish: boolean) {
    localStorage.setItem(LANG_KEY, JSON.stringify({ showEnglish }))
  }
}
