// The hero's slice of Drawa: a session card wired to the files it touched. It plays the session once
// (each [data-step] is marked data-on when it happens), draws the edges like the app's graph does, and lets
// you drag windows by their tab and pan the canvas with the mouse. Without script the finished state shows.
const stage = document.querySelector<HTMLElement>('#stage')!
const world = document.querySelector<HTMLElement>('#world')!
const svg = document.querySelector<SVGSVGElement>('#edges')!
const card = document.querySelector<HTMLElement>('#w-card')!
const acts = [...world.querySelectorAll<HTMLElement>('.win[data-act]')]
const PAD = 24
// two arrangements: side by side as in the app, and stacked under the card for phones (so text stays readable)
type Box = [number, number, number, number]
const WIDE = { W: 1130, H: 590, at: null as null | Record<string, Box> }
const NARROW = { W: 400, H: 1060, at: {
  'w-card': [0, 0, 400, 420], 'w-read': [52, 480, 348, 112], 'w-edit': [52, 628, 348, 126], 'w-write': [52, 790, 348, 112], 'w-run': [52, 938, 348, 112],
} as Record<string, Box> }
const wideAt: Record<string, Box> = {}
for (const w of world.querySelectorAll<HTMLElement>('.win')) wideAt[w.id] = [w.offsetLeft, w.offsetTop, w.offsetWidth, w.offsetHeight]
WIDE.at = wideAt
let layout = WIDE
const reduced = matchMedia('(prefers-reduced-motion: reduce)')

let scale = 1, x = 0, y = 0, front = 0

// ---- geometry: fit the world to the stage (never above 100%), centered in the page column
function fit() {
  const next = stage.clientWidth < 720 ? NARROW : WIDE
  if (next !== layout) {
    layout = next
    for (const [id, [l, t, w, h]] of Object.entries(layout.at!)) Object.assign(document.getElementById(id)!.style, { left: `${l}px`, top: `${t}px`, width: `${w}px`, height: `${h}px` })
    route()
  }
  const { W, H } = layout
  world.style.width = `${W}px`
  world.style.height = `${H}px`
  const avail = Math.min(stage.clientWidth - 32, 1180)
  scale = Math.min(1, avail / W)
  x = (stage.clientWidth - W * scale) / 2
  y = PAD
  stage.style.height = `${H * scale + PAD + 88}px`
  place()
}
const place = () => { world.style.transform = `translate(${x}px,${y}px) scale(${scale})` }

// ---- edges: card's right side to each window's body, one cubic curve and a label tag each
const pos = (el: HTMLElement) => ({ l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })
const tags = new Map<HTMLElement, HTMLElement>()
const paths = new Map<HTMLElement, SVGPathElement>()
for (const w of acts) {
  const act = w.dataset.act!
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  p.setAttribute('class', `edge ${act}`)
  svg.append(p)
  const tag = Object.assign(document.createElement('span'), { className: `tag ${act}`, textContent: act })
  world.append(tag)
  paths.set(w, p)
  tags.set(w, tag)
}

function route() {
  const c = pos(card)
  acts.forEach((w, i) => {
    const f = pos(w)
    const x2 = f.l - 3, y2 = f.t + 34 + (f.h - 34) / 2
    // a window beside the card leaves from its right side; one below it, from its bottom edge
    const below = f.t > c.t + c.h
    const x1 = below ? c.l + 12 + i * 8 : c.l + c.w, y1 = below ? c.t + c.h : c.t + Math.min(c.h - 60, 180 + i * 56)
    const dx = Math.max(40, Math.abs(x2 - x1) / 2)
    const c1 = below ? `${x1} ${y1 + (y2 - y1) * .6}` : `${x1 + dx} ${y1}`
    paths.get(w)!.setAttribute('d', `M${x1} ${y1}C${c1} ${x2 - dx} ${y2} ${x2} ${y2}`)
    const tag = tags.get(w)!
    tag.style.left = `${below ? x1 + 22 : (x1 + x2) / 2}px`
    tag.style.top = `${below ? y2 - 14 : (y1 + y2) / 2}px`
  })
}

// ---- the session, step by step (ms after start)
const AT = [200, 900, 1900, 3200, 4500, 5800, 7400]
let timers: number[] = []
const on = (el: Element) => el.setAttribute('data-on', '')

function show(step: number) {
  world.querySelectorAll(`[data-step="${step}"]`).forEach(on)
  for (const w of acts) {
    if (w.dataset.step !== String(step)) continue
    const p = paths.get(w)!
    on(p); on(tags.get(w)!)
    p.classList.add('live') // the app's working edge: flowing dashes until the tool call settles
    timers.push(window.setTimeout(() => p.classList.remove('live'), 1100))
  }
}

function play() {
  timers.forEach(clearTimeout)
  timers = []
  if (reduced.matches) { card.dataset.state = 'done'; return }
  stage.classList.add('play')
  world.querySelectorAll('[data-on]').forEach(el => el.removeAttribute('data-on'))
  svg.querySelectorAll('.live').forEach(el => el.classList.remove('live'))
  card.dataset.state = 'busy'
  AT.forEach((ms, step) => timers.push(window.setTimeout(() => show(step), ms)))
  timers.push(window.setTimeout(() => { card.dataset.state = 'done' }, AT[AT.length - 1] + 200))
}

// ---- dragging: a window by its tab (any pointer), the canvas by its background (mouse only; touch scrolls the page)
function drag(e: PointerEvent, move: (dx: number, dy: number) => void, el: HTMLElement, cls: string) {
  const sx = e.clientX, sy = e.clientY
  el.setPointerCapture(e.pointerId)
  el.classList.add(cls)
  const mv = (m: PointerEvent) => move(m.clientX - sx, m.clientY - sy)
  const up = () => { el.classList.remove(cls); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up) }
  el.addEventListener('pointermove', mv)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

for (const w of world.querySelectorAll<HTMLElement>('.win')) {
  const tab = w.querySelector<HTMLElement>('.win-h')!
  tab.addEventListener('pointerdown', e => {
    if (e.button !== 0) return
    e.stopPropagation()
    w.style.zIndex = String(++front) // to the front, as front() does in the app
    const l = w.offsetLeft, t = w.offsetTop
    drag(e, (dx, dy) => { w.style.left = `${l + dx / scale}px`; w.style.top = `${t + dy / scale}px`; route() }, tab, 'dragging')
  })
}
stage.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as Element).closest('button,.win-h')) return
  const ox = x, oy = y
  drag(e, (dx, dy) => { x = ox + dx; y = oy + dy; place() }, stage, 'panning')
})

document.querySelector<HTMLButtonElement>('#replay')!.onclick = play

if (!reduced.matches) stage.classList.add('play') // hold the steps back until the session plays
fit()
route()
new ResizeObserver(fit).observe(stage)
document.fonts.ready.then(route)
// start when the canvas is on screen, once
new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); play() } }, { threshold: .1 }).observe(stage)
