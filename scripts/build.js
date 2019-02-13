const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const GIFEncoder = require('gifencoder')
const PNG = require('png-js')

const excluded = ['.git', 'node_modules', 'scripts', 'images']
const folderNames = fs
  .readdirSync(path.join(__dirname, '../src'))
  .filter(file => !excluded.includes(file))

const githubUrl = 'https://simonsiefke.github.io/backgrounds/src'

;(async () => {
  let i = 1
  for (const folderName of folderNames) {
    await makeGif(folderName)
    console.log(`${i++} of ${folderNames.length} ✔️`)
  }
  updateReadme()
  updateHTML()
})()

function updateReadme() {
  const description = `# backgrounds`
  const imagesMarkup = folderNames
    .map(folderName => `![](./images/${folderName}.gif)`)
    .join('\n')
  fs.writeFileSync(
    path.join(__dirname, '../README.md'),
    `${description}\n${imagesMarkup}`
  )
}

function updateHTML() {
  const iframesHTML = folderNames
    .map(
      folderName => `<iframe
      src="https://simonsiefke.github.io/backgrounds/${folderName}"
      frameBorder="0"
    ></iframe>`
    )
    .join('\n    ')
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
    <style>
      body {
        margin: 0;
        display: grid;
        grid-auto-rows: 100vh;
        min-height: 100vh;
        scroll-snap-type: y mandatory;
      }
      iframe {
        width: 100%;
        height: 100%;
        scroll-snap-align: start;
      }
    </style>
  </head>
  <body>
    ${iframesHTML}
  </body>
</html>
`
  fs.writeFileSync(path.join(__dirname, '../index.html'), html)
}

function decode(png) {
  return new Promise(r => {
    png.decode(pixels => r(pixels))
  })
}

async function gifAddFrame(page, encoder) {
  const pngBuffer = await page.screenshot({
    clip: { width: 1024, height: 768, x: 0, y: 0 },
  })
  const png = new PNG(pngBuffer)
  await decode(png).then(pixels => encoder.addFrame(pixels))
}

async function makeGif(folderName) {
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 0,
  })
  const page = await browser.newPage()
  page.setViewport({ width: 1024, height: 768 })
  await page.goto(`${githubUrl}/${folderName}`, {
    waitUntil: ['networkidle0'],
  })

  // record gif
  const encoder = new GIFEncoder(1024, 768)
  encoder
    .createWriteStream()
    .pipe(fs.createWriteStream(`images/${folderName}.gif`))

  // setting gif encoder
  encoder.start()
  encoder.setRepeat(0)
  encoder.setDelay(150)
  encoder.setQuality(10) // default

  for (let i = 0; i < 100; i++) {
    await gifAddFrame(page, encoder)
  }

  // finish encoder, test.gif saved
  encoder.finish()

  await browser.close()
}
