// The features page: the shared chrome, the review and groups demos, a count on each category's index window,
// and the category strip under the bar, which marks the category in view.
import './chrome'
import './review'
import './groups'

const cats = [...document.querySelectorAll<HTMLElement>('section.cat')]

// the number of features on each index window's tab: its cards, or the review list's items
for (const c of cats) {
  const n = c.querySelectorAll('.ft, .rv-facts > li, .grp-rules > li').length
  const m = document.querySelector<HTMLElement>(`[data-count="${c.id}"]`)
  if (m && n) { m.textContent = String(n); m.title = `${n} features` }
}

// the strip: the link to the category that holds the middle of the screen gets aria-current
const strip = document.querySelector<HTMLElement>('.fx-strip')!
const links = new Map([...strip.querySelectorAll<HTMLAnchorElement>('a')].map(a => [a.hash.slice(1), a]))
function mark(id: string) {
  for (const [k, a] of links) {
    if (k === id) a.setAttribute('aria-current', 'location')
    else a.removeAttribute('aria-current')
  }
  // keep the marked link in view when the strip scrolls sideways on a phone
  const a = links.get(id)
  const row = a?.parentElement
  if (a && row && (a.offsetLeft < row.scrollLeft || a.offsetLeft + a.offsetWidth > row.scrollLeft + row.clientWidth))
    row.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' })
}
const spy = new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) mark(e.target.id)
}, { rootMargin: '-50% 0px -50% 0px' })
for (const c of cats) spy.observe(c)
