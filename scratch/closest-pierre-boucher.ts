import { readFileSync } from 'fs'

const ridings = JSON.parse(readFileSync('scripts/data/ridings-real-data.json', 'utf8'))
const rents = JSON.parse(readFileSync('scripts/data/cmhc-1br-2025.json', 'utf8'))
const coords = JSON.parse(readFileSync('scripts/data/surveyed-centre-coords.json', 'utf8'))

const ridingName = 'Pierre-Boucher—Les Patriotes—Verchères'
const riding = ridings.find((r: any) => r.name === ridingName)
console.log(`${ridingName} coordinates:`, riding.latitude, riding.longitude)

const list: any[] = []
for (const name of Object.keys(rents)) {
  const c = coords[name]
  if (!c) continue
  
  const lat1 = riding.latitude
  const lon1 = riding.longitude
  const lat2 = c.lat
  const lon2 = c.lon
  
  const R = 6371.0
  const p = Math.PI / 180
  const a = Math.sin((lat2 - lat1) * p / 2) ** 2 +
            Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin((lon2 - lon1) * p / 2) ** 2
  const d = 2 * R * Math.asin(Math.sqrt(a))
  
  list.push({ name, distance: d, rent: rents[name].rent_1br_2025 })
}

list.sort((a, b) => a.distance - b.distance)

console.log(`\n=== CLOSEST CENTRES TO ${ridingName.toUpperCase()} ===`)
for (const item of list.slice(0, 10)) {
  console.log(`${item.name.padEnd(45)} | Dist: ${item.distance.toFixed(1)} km | Rent: $${item.rent}`)
}
