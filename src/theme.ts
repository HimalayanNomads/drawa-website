// Light/dark on <html data-theme>, the scheme on data-scheme, as the app's lib/theme.ts does.
// The inline script in index.html applies the same saved choice before first paint.
type Mode = 'light' | 'dark'
const SCHEMES: Record<Mode, [string, string][]> = {
  light: [['claude-light', 'Drawa'], ['rose-pine-dawn', 'Rosé Pine Dawn'], ['catppuccin-latte', 'Catppuccin Latte'], ['tokyo-night-day', 'Tokyo Night Day'],
    ['gruvbox-light', 'Gruvbox Light'], ['solarized-light', 'Solarized Light'], ['github-light', 'GitHub Light']],
  dark: [['claude-dark', 'Drawa'], ['rose-pine', 'Rosé Pine'], ['catppuccin-mocha', 'Catppuccin Mocha'], ['tokyo-night', 'Tokyo Night'],
    ['gruvbox-dark', 'Gruvbox Dark'], ['nord', 'Nord'], ['kanagawa', 'Kanagawa'], ['everforest', 'Everforest']],
}
const KEY = 'drawa-site:theme'
interface Choice { mode: Mode; light: string; dark: string }

const system = (): Mode => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
const saved = (): Partial<Choice> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {} } catch { return {} } }
const choice: Choice = { mode: system(), light: 'claude-light', dark: 'claude-dark', ...saved() }

const ICON = {
  sun: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>',
  moon: '<svg viewBox="0 0 16 16"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"/></svg>',
}

const btn = document.querySelector<HTMLButtonElement>('#theme')!
const box = document.querySelector<HTMLElement>('#schemes') // the scheme picker, on pages that have one

function apply(remember = true) {
  const root = document.documentElement
  root.dataset.theme = choice.mode
  root.dataset.scheme = choice[choice.mode]
  const next = choice.mode === 'dark' ? 'light' : 'dark'
  btn.innerHTML = choice.mode === 'dark' ? ICON.moon : ICON.sun
  btn.title = `Switch to ${next} mode`
  btn.setAttribute('aria-label', btn.title)
  if (remember) try { localStorage.setItem(KEY, JSON.stringify(choice)) } catch {}
  renderSchemes()
}

// each swatch sets data-scheme on itself, so its --c-* colors are that scheme's own
function renderSchemes() {
  if (!box) return
  box.replaceChildren(...SCHEMES[choice.mode].map(([id, label]) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.scheme = id
    b.setAttribute('role', 'radio')
    b.setAttribute('aria-checked', String(choice[choice.mode] === id))
    b.innerHTML = ['--c-cyan', '--c-purple', '--c-orange', '--c-blue'].map(c => `<i style="background:var(${c})"></i>`).join('') + `<span>${label}</span>`
    b.onclick = () => { choice[choice.mode] = id; apply(); box.querySelector<HTMLElement>(`[data-scheme="${id}"]`)?.focus() }
    return b
  }))
}

btn.onclick = () => { choice.mode = choice.mode === 'dark' ? 'light' : 'dark'; apply() }
// follow the system until the visitor picks a mode here
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!saved().mode) { choice.mode = system(); apply(false) } })
apply(false)
