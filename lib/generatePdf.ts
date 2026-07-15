// Génération de PDF côté serveur à partir d'un HTML complet (utilisé pour joindre
// le dossier de synthèse d'un bien au mail de validation envoyé au vendeur).
// Utilise puppeteer-core + @sparticuz/chromium, seule combinaison compatible avec
// les fonctions serverless de Vercel (chromium packagé pour tenir sous la limite
// de taille des lambdas).

import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
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
