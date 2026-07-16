// Génération de PDF côté serveur à partir d'un HTML complet (utilisé pour joindre
// le dossier de synthèse d'un bien au mail de validation envoyé au vendeur).
// Utilise puppeteer-core + @sparticuz/chromium, seule combinaison compatible avec
// les fonctions serverless de Vercel (chromium packagé pour tenir sous la limite
// de taille des lambdas).

import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

// Depuis @sparticuz/chromium v149, `defaultViewport` et le type booléen de
// `headless` ont été retirés de l'API — il faut désormais fournir son propre
// viewport et utiliser puppeteer.defaultArgs() (voir la doc officielle du package).
const VIEWPORT = {
  deviceScaleFactor: 1,
  hasTouch: false,
  height: 1080,
  isLandscape: true,
  isMobile: false,
  width: 1920,
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
    defaultViewport: VIEWPORT,
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
