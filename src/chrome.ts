// What every page shares: the theme, the bar, copy buttons and the star count.
import './theme'

// copy buttons next to the install command
for (const box of document.querySelectorAll<HTMLElement>('[data-copy]')) {
  const b = box.querySelector<HTMLButtonElement>('.copy')!
  b.onclick = async () => {
    try { await navigator.clipboard.writeText(box.dataset.copy!) } catch { return }
    b.textContent = 'Copied'
    b.classList.add('done')
    setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done') }, 1600)
  }
}

// the bar gets its bottom line once the page scrolls under it
const bar = document.querySelector('.bar')!
new IntersectionObserver(([e]) => bar.classList.toggle('stuck', !e.isIntersecting))
  .observe(document.querySelector('main h1')!)

// star count on the GitHub buttons, from repo.json (written at build time)
fetch('/repo.json').then(r => r.json()).then(({ stars }) => {
  for (const s of document.querySelectorAll<HTMLElement>('.stars')) {
    s.textContent = stars.toLocaleString('en')
    s.hidden = false
  }
}).catch(() => {})
