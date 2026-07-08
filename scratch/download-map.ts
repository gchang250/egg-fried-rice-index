import fs from 'fs'
import path from 'path'

async function main() {
  const url = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson'
  console.log(`Downloading Canada GeoJSON from ${url}...`)
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`)
    }
    const data = await res.json()
    console.log('Successfully downloaded! Writing to public/canada.geojson...')
    fs.writeFileSync(
      path.join(process.cwd(), 'public', 'canada.geojson'),
      JSON.stringify(data, null, 2)
    )
    console.log('Done! Size of file:', fs.statSync(path.join(process.cwd(), 'public', 'canada.geojson')).size, 'bytes')
  } catch (error) {
    console.error('Error downloading:', error)
  }
}
main()
