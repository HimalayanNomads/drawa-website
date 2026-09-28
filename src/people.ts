// Contributors as a slice of the canvas: the repo's git window, one window per person, and an edit edge
// between them. Live from GitHub; the fallback link stays if the API fails or rate-limits (60/h per visitor).
// On screen, the edges light up one at a time as in the hero and each commit count ticks up.
const board = document.querySelector<HTMLElement>('#people-board')!
const list = board.querySelector<HTMLElement>('#contributors')!
const repo = board.querySelector<HTMLElement>('.repo')!
const svg = board.querySelector<SVGSVGElement>('.edges')!
const sum = board.querySelector<HTMLElement>('#people-sum')!
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

type Person = { login: string; avatar_url: string; html_url: string; contributions: number; type: string }
const wires: { win: HTMLElement; edge: SVGPathElement; tag: HTMLElement; count: HTMLElement; n: number }[] = []

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]) {
  const e = Object.assign(document.createElement(tag), props)
  e.append(...kids)
  return e
}

const SHOWN = 6 // full windows; everyone after shares one "+N more" window, so the board stays one column at any size

// one window wired to the repo: the edge, its tag, and the count that ticks up
function wire(win: HTMLElement, i: number, n: number, count: HTMLElement) {
  win.dataset.act = 'edit'
  win.dataset.step = String(i)
  const edge = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  edge.setAttribute('class', 'edge edit')
  svg.append(edge)
  const tag = el('span', { className: 'tag edit', textContent: `+${n}` })
  board.append(tag)
  wires.push({ win, edge, tag, count, n })
  // hovering a window lights its edge, like selecting one in the app
  win.onpointerenter = () => edge.classList.add('hot')
  win.onpointerleave = () => edge.classList.remove('hot')
  return el('li', {}, win)
}

const commits = (n: number) => n === 1 ? ' commit' : ' commits'

function render(people: Person[]) {
  const total = people.reduce((s, p) => s + p.contributions, 0)
  sum.textContent = `${total} commits · ${people.length} ${people.length === 1 ? 'person' : 'people'}`
  const top = people.slice(0, SHOWN), rest = people.slice(SHOWN)
  const items = top.map((p, i) => {
    const count = el('b', { textContent: String(p.contributions) })
    const img = el('img', { src: `${p.avatar_url}&s=96`, alt: '', width: 44, height: 44, loading: 'lazy' })
    return wire(el('a', { className: 'win', href: p.html_url },
      el('div', { className: 'win-h' }, el('span', { className: 't', textContent: p.login })),
      el('div', { className: 'win-b' }, img, el('em', {}, count, commits(p.contributions)))), i, p.contributions, count)
  })
  if (rest.length) {
    const n = rest.reduce((s, p) => s + p.contributions, 0)
    const count = el('b', { textContent: String(n) })
    // ponytail: 99 people at most here (per_page=100, one page); follow the Link header if Drawa ever outgrows it
    const faces = el('span', { className: 'faces' }, ...rest.map(p => el('a', { href: p.html_url, title: `${p.login}, ${p.contributions}${commits(p.contributions)}` },
      el('img', { src: `${p.avatar_url}&s=56`, alt: p.login, width: 28, height: 28, loading: 'lazy' }))))
    items.push(wire(el('div', { className: 'win more' },
      el('div', { className: 'win-h' }, el('span', { className: 't', textContent: `+${rest.length} more` })),
      el('div', { className: 'win-b' }, faces, el('em', {}, count, commits(n)))), top.length, n, count))
  }
  list.replaceChildren(...items)
}

// same curve as the hero: out of the repo's right side, or its bottom when the people are stacked under it
function route() {
  const b = board.getBoundingClientRect(), r = repo.getBoundingClientRect()
  wires.forEach(({ win, edge, tag }, i) => {
    const f = win.getBoundingClientRect()
    const x2 = f.left - b.left - 3, y2 = f.top - b.top + 34 + (f.height - 34) / 2
    const below = f.left < r.right // stacked under the repo (phones), not beside it
    const x1 = below ? r.left - b.left + 16 + Math.min(i, 6) * 5 : r.right - b.left
    const y1 = below ? r.bottom - b.top : r.top - b.top + r.height / 2
    const dx = Math.max(40, Math.abs(x2 - x1) / 2)
    const c1 = below ? `${x1} ${y1 + (y2 - y1) * .6}` : `${x1 + dx} ${y1}`
    edge.setAttribute('d', `M${x1} ${y1}C${c1} ${x2 - dx} ${y2} ${x2} ${y2}`)
    tag.style.left = `${below ? x1 + 22 : (x1 + x2) / 2}px`
    tag.style.top = `${below ? y2 - 14 : (y1 + y2) / 2}px`
  })
}

function tick(out: HTMLElement, n: number, ms: number) {
  const t0 = performance.now()
  const step = (t: number) => {
    const k = Math.min(1, Math.max(0, (t - t0) / ms)) // rAF stamps the frame start, which can precede t0
    out.textContent = String(Math.round(n * (1 - (1 - k) ** 3)))
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function play() {
  wires.forEach(({ win, edge, tag, count, n }, i) => {
    count.textContent = '0'
    setTimeout(() => {
      for (const e of [win, edge, tag]) e.setAttribute('data-on', '')
      edge.classList.add('live') // flowing dashes while the "commit" lands, then it settles solid
      setTimeout(() => edge.classList.remove('live'), 1100)
      tick(count, n, 900)
    }, 250 + i * 320)
  })
}

// dev only (stripped from builds): ?demo=40 seeds 40 fake people to see how the board holds up
const demo = import.meta.env.DEV && Number(new URLSearchParams(location.search).get('demo'))
const people: Promise<Person[]> = demo
  ? Promise.resolve(Array.from({ length: demo }, (_, i) => ({ login: `demo-user-${i + 1}`, avatar_url: `https://avatars.githubusercontent.com/u/${i + 1}?v=4`,
      html_url: '#', contributions: Math.max(1, Math.round(240 / (i + 1))), type: 'User' })))
  : fetch('https://api.github.com/repos/probablysamir/drawa/contributors?per_page=100').then(r => r.ok ? r.json() : Promise.reject())
people
  .then((all: Person[]) => {
    render(all.filter(p => p.type === 'User'))
    route()
    new ResizeObserver(route).observe(board)
    document.fonts.ready.then(route)
    if (reduced) return
    board.classList.add('play') // hold everyone back until the board scrolls into view
    new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); play() } }, { threshold: .3 }).observe(board)
  })
  .catch(() => { sum.textContent = 'see GitHub' })
export {}
