import './theme'
import './hero'
import './people'

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

const stars = [...document.querySelectorAll<HTMLElement>('[data-github-stars]')]
if (stars.length) {
  fetch('https://api.github.com/repos/probablysamir/drawa')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then((repo: { stargazers_count?: number }) => {
      if (typeof repo.stargazers_count !== 'number') return
      const n = new Intl.NumberFormat('en-US').format(repo.stargazers_count)
      stars.forEach(el => { el.textContent = `★ ${n}` })
    })
    .catch(() => {})
}
