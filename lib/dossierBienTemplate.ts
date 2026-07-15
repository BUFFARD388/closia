// Template HTML partagé pour le dossier de synthèse d'un bien (screening apporteur).
// Utilisé à la fois côté client (aperçu/impression dans app/dashboard/admin/page.tsx)
// et côté serveur (génération du PDF joint au mail de validation vendeur).

export type DossierBienParams = {
  logoUrl: string
  adresseComplete: string
  apporteurNom: string
  type: string | null
  prix: number | string | null
  surface: number | string | null
  createdAt: string | null
  statut: string | null
  description: string | null
  dossierHtml: string
  photoUrl?: string | null
}

export function buildDossierBienHtml(p: DossierBienParams): string {
  const prixTexte = p.prix ? Number(p.prix).toLocaleString('fr-FR') + ' €' : '—'
  const surfaceTexte = p.surface ? `${p.surface} m²` : '—'
  const dateTexte = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Dossier de synthèse — ${p.adresseComplete}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;background:#fff;font-size:13.5px;line-height:1.75}
    /* HEADER */
    .cover{background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 56px 36px;color:#fff;display:flex;align-items:center;justify-content:space-between}
    .cover-left{}
    .cover-logo{height:52px;margin-bottom:20px;display:block}
    .cover-logo-text{font-size:26px;font-weight:700;color:#c29a6b;letter-spacing:6px;margin-bottom:20px}
    .cover-title{font-size:20px;font-weight:600;color:#fff;margin-bottom:6px}
    .cover-sub{font-size:11px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.5px}
    .cover-badge{background:rgba(194,154,107,.12);border:1px solid rgba(194,154,107,.35);border-radius:6px;padding:10px 18px;text-align:center}
    .cover-badge-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);margin-bottom:4px}
    .cover-badge-date{font-size:14px;font-weight:600;color:#c29a6b}
    /* MEDIA STRIP (photo + cadastre) */
    .media-strip{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px 56px;background:#fff;border-bottom:1px solid #e8e2d5}
    .media-block-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c29a6b;margin-bottom:6px;font-weight:700}
    .media-photo img{width:100%;height:220px;object-fit:cover;border-radius:8px;border:1px solid #e8e2d5;display:block}
    .media-placeholder{height:220px;display:flex;align-items:center;justify-content:center;background:#f7f5f0;border:1px dashed #d8d2c5;border-radius:8px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;padding:12px}
    /* INFO STRIP */
    .info-strip{background:#f7f5f0;border-bottom:1px solid #e8e2d5;padding:24px 56px}
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    .info-item{background:#fff;border:1px solid #e8e2d5;border-radius:8px;padding:12px 14px}
    .info-item.wide{grid-column:1/-1}
    .info-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:3px}
    .info-value{font-size:13px;font-weight:600;color:#1a1a2e}
    /* DESCRIPTION */
    .desc-strip{padding:20px 56px;background:#fffdf9;border-bottom:1px solid #e8e2d5;border-left:4px solid #c29a6b}
    .desc-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c29a6b;margin-bottom:6px;font-weight:700}
    .desc-text{font-size:13px;color:#4b5563;line-height:1.7}
    /* CONTENT */
    .content{padding:36px 56px 48px}
    /* SECTIONS */
    .section-block{margin-bottom:32px;page-break-inside:avoid}
    .section-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #f0ebe0}
    .section-num{background:#c29a6b;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1a1a2e}
    .section-body{color:#374151;font-size:13.5px;line-height:1.8}
    .section-body p{margin-bottom:9px}
    .section-body ul{padding-left:18px;margin-bottom:9px}
    .section-body li{margin-bottom:5px}
    .section-body strong{color:#1a1a2e;font-weight:600}
    .section-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px}
    .section-body th{background:#1a1a2e;color:#fff;text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    .section-body td{padding:7px 12px;border-bottom:1px solid #e8e2d5;color:#374151;vertical-align:top}
    .section-body tr:nth-child(even) td{background:#f7f5f0}
    /* BOXES / ESTIMATION / CONCLUSION */
    .box{border-radius:7px;padding:14px 18px;margin:12px 0;font-size:13px;line-height:1.7}
    .box-title{font-weight:700;margin-bottom:5px;font-size:11.5px;text-transform:uppercase;letter-spacing:0.5px}
    .box-blue{background:#eef4fb;border:1px solid #cfe0f3;color:#1f2937}
    .box-gold{background:#fdf6ea;border:1px solid #e8c87a;color:#92660b}
    .box-red{background:#fdf2f2;border:1px solid #f3c6c6;color:#b42318}
    .box-green{background:#f1f8f0;border:1px solid #c3e0bd;color:#276022}
    .estimation-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}
    .estimation-card{border-radius:8px;padding:18px 20px;text-align:center;border:1.5px solid #e8e2d5}
    .estimation-card.low{background:#f9f8f5;border-color:#e8e2d5}
    .estimation-card.high{background:#1a1a2e;border-color:#1a1a2e}
    .estimation-card-label{font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px}
    .estimation-card.high .estimation-card-label{color:#c29a6b}
    .estimation-card-value{font-family:Georgia,serif;font-size:26px;color:#1a1a2e;line-height:1}
    .estimation-card.high .estimation-card-value{color:#fff}
    .estimation-card-sub{font-size:11px;color:#9ca3af;margin-top:4px}
    .estimation-card.high .estimation-card-sub{color:rgba(255,255,255,.5)}
    .conclusion-block{background:#1a1a2e;border-radius:10px;padding:24px 28px;color:#fff;margin-top:12px;page-break-inside:avoid}
    .conclusion-block h3{font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#c29a6b;font-weight:700;margin-bottom:14px}
    .conclusion-rec{display:flex;flex-direction:column;gap:8px}
    .conclusion-rec-item{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:10px 14px;display:flex;gap:12px;align-items:flex-start}
    .conclusion-rec-num{background:#c29a6b;color:#1a1a2e;font-size:11px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
    .conclusion-rec-text{font-size:12.5px;color:#e5e7eb;line-height:1.6}
    .conclusion-rec-text strong{color:#fff}
    .conclusion-quote{border-left:3px solid #c29a6b;padding:10px 16px;margin-top:16px;background:rgba(255,255,255,.04);border-radius:0 6px 6px 0;font-style:italic;font-size:12.5px;color:#cbd5e1;line-height:1.7}
    .disclaimer{margin-top:20px;padding:12px 16px;background:#f7f5f0;border-radius:6px;font-size:11px;color:#6b7280;line-height:1.6;border:1px solid #e8e2d5;font-style:italic}
    .box,.estimation-grid,.conclusion-block{page-break-inside:avoid}
    /* FOOTER */
    .footer{padding:16px 56px;background:#f7f5f0;border-top:1px solid #e8e2d5;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#9ca3af}
    .footer-brand{font-weight:600;color:#c29a6b;letter-spacing:2px;font-size:12px}
    .confidential{background:#fff8ed;border:1px solid rgba(194,154,107,.4);border-radius:4px;padding:3px 10px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c29a6b;font-weight:700}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.section-block{page-break-inside:avoid}}
  </style>
</head>
<body>

<div class="cover">
  <div class="cover-left">
    <img src="${p.logoUrl}" class="cover-logo" onerror="this.style.display='none';document.getElementById('logo-text').style.display='block'"/>
    <div id="logo-text" class="cover-logo-text" style="display:none">CLOSIA</div>
    <div class="cover-title">Dossier de synthèse — Screening du bien</div>
    <div class="cover-sub">Document interne — Usage exclusif Closia</div>
  </div>
  <div class="cover-badge">
    <div class="cover-badge-label">Généré le</div>
    <div class="cover-badge-date">${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
</div>

<div class="media-strip">
  <div>
    <div class="media-block-label">Photo du bien</div>
    <div class="media-photo">
      ${p.photoUrl ? `<img src="${p.photoUrl}" alt="Photo du bien"/>` : `<div class="media-placeholder">Aucune photo fournie</div>`}
    </div>
  </div>
  <div>
    <div class="media-block-label">Plan cadastral</div>
    <div class="media-placeholder">Non fourni</div>
  </div>
</div>

<div class="info-strip">
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Apporteur</div><div class="info-value">${p.apporteurNom || '—'}</div></div>
    <div class="info-item"><div class="info-label">Type de bien</div><div class="info-value">${p.type || '—'}</div></div>
    <div class="info-item"><div class="info-label">Prix demandé</div><div class="info-value">${prixTexte}</div></div>
    <div class="info-item"><div class="info-label">Surface</div><div class="info-value">${surfaceTexte}</div></div>
    <div class="info-item"><div class="info-label">Date de soumission</div><div class="info-value">${dateTexte}</div></div>
    <div class="info-item"><div class="info-label">Statut actuel</div><div class="info-value">${p.statut || '—'}</div></div>
    <div class="info-item wide"><div class="info-label">Bien analysé</div><div class="info-value">${p.adresseComplete}</div></div>
  </div>
</div>

${p.description ? `
<div class="desc-strip">
  <div class="desc-label">Description transmise par l'apporteur</div>
  <div class="desc-text">${p.description}</div>
</div>` : ''}

<div class="content">
  ${p.dossierHtml}
</div>

<div class="footer">
  <div class="footer-brand">CLOSIA</div>
  <div>contact@closia.net &nbsp;·&nbsp; 06 87 76 33 40 &nbsp;·&nbsp; closia.net</div>
  <div class="confidential">Confidentiel</div>
</div>

</body>
</html>`
}
