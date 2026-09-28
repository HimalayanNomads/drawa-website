import './theme'
import './hero'

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
  .observe(document.querySelector('.hero h1')!)
