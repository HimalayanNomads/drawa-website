// Builds public/contributors.json for the "Built in the open" board: everyone who committed to Drawa, opened an
// issue or pull request, or commented on one, with a count for each. Runs before dev and build (the deploy runs it
// hourly too), so visitors read one static file instead of spending their 60/h GitHub API budget.
// Uses GITHUB_TOKEN when set (CI); unauthenticated works locally. On failure it warns and writes nothing, and the
// page keeps its link to GitHub's contributors graph.
import { writeFile, mkdir } from 'node:fs/promises'

const REPO = 'HimalayanNomads/drawa'
const OUT = new URL('../public/contributors.json', import.meta.url)
const headers = { accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN && { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) }

// every page of a list endpoint, following the Link header
async function all(path) {
  const items = []
  for (let url = `https://api.github.com/repos/${REPO}/${path}${path.includes('?') ? '&' : '?'}per_page=100`; url;) {
    const r = await fetch(url, { headers })
    if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`)
    items.push(...await r.json())
    url = r.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
  }
  return items
}

try {
  const [commits, issues, comments, reviews] = await Promise.all([
    all('contributors'), all('issues?state=all'), all('issues/comments'), all('pulls/comments'),
  ])
  const people = new Map()
  const bump = (user, key, n = 1) => {
    if (!user || user.type !== 'User') return // bots and deleted accounts
    const p = people.get(user.login) ?? { login: user.login, avatar: user.avatar_url, url: user.html_url, commits: 0, prs: 0, issues: 0, comments: 0 }
    p[key] += n
    people.set(user.login, p)
  }
  for (const u of commits) bump(u, 'commits', u.contributions)
  for (const i of issues) bump(i.user, i.pull_request ? 'prs' : 'issues')
  for (const c of [...comments, ...reviews]) bump(c.user, 'comments')

  // ponytail: every contribution weighs the same; weight them here if commits should count for more
  const total = p => p.commits + p.prs + p.issues + p.comments
  const list = [...people.values()].map(p => ({ ...p, total: total(p) })).sort((a, b) => b.total - a.total || b.commits - a.commits)
  await mkdir(new URL('.', OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(list, null, 2) + '\n')
  console.log(`contributors.json: ${list.length} people`)
} catch (e) {
  console.warn(`contributors.json not written: ${e.message}${e.cause ? ` (${e.cause.code ?? e.cause.message})` : ""}`)
}

// star count for the header button, same static-file trick; the button just says "Star" without it
try {
  const r = await fetch(`https://api.github.com/repos/${REPO}`, { headers })
  if (!r.ok) throw new Error(`${r.status}`)
  const { stargazers_count: stars } = await r.json()
  await mkdir(new URL('.', OUT), { recursive: true })
  await writeFile(new URL('repo.json', OUT), JSON.stringify({ stars }) + '\n')
  console.log(`repo.json: ${stars} stars`)
} catch (e) {
  console.warn(`repo.json not written: ${e.message}`)
}
