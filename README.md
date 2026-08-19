# mccuba.github.io

Portfolio personal de **Manolo Canales Cuba**, orientado a postulaciones de **AI / ML Engineering**. Sitio estático (HTML + CSS + JS puro, sin frameworks ni build step), listo para GitHub Pages.

## Estructura

```
index.html
assets/
  css/style.css
  js/main.js
```

## Cómo publicarlo en tu repo `mccuba.github.io`

1. Cloná tu repo (si no lo tenés local):
   ```bash
   git clone https://github.com/mccuba/mccuba.github.io.git
   cd mccuba.github.io
   ```
2. Copiá adentro estos tres elementos (`index.html`, `assets/`, este `README.md`), reemplazando lo que haya en `main`.
3. Commit y push:
   ```bash
   git add .
   git commit -m "Rediseño del portfolio, orientado a AI Engineering"
   git push origin main
   ```
4. En **Settings → Pages** del repo, confirmá que la fuente sea la rama `main`, carpeta `/ (root)`. Como el repo se llama `mccuba.github.io`, GitHub Pages lo sirve automáticamente en:
   `https://mcanalescuba.github.io/`

## Contenido a revisar / personalizar

- **Sección Research**: datos tomados del paper real (arXiv:2504.01338, Computers & Graphics 2025). Verificá los links si el paper cambia de estado (ej. si sale una v3 en arXiv).
- **Proyectos**: se muestran los repos pineados en tu perfil (FlowMotion, fm-page, haarpcache, haarp-viewer, cp-vton, courseraCopyYoutubeTranslate). Si actualizás tus pins en GitHub, actualizá también las tarjetas en `index.html` (sección `#projects`).
- **Contacto**: por ahora solo GitHub + LinkedIn, como pediste. Si más adelante querés sumar email o CV en PDF, avisame y agrego los botones.
- **Foto**: no incluí tu foto de perfil de GitHub en el sitio (para evitar reproducir un archivo protegido sin tu ok explícito). Si querés incorporarla, subila a `assets/img/` y decime dónde ponerla (hero o sección "Sobre mí").

## Notas técnicas

- Tipografías: Space Grotesk (display) + IBM Plex Sans (texto) + IBM Plex Mono (datos/labels), vía Google Fonts.
- El elemento "firma" del hero es un canvas animado que compara una trayectoria con *jitter* vs. la trayectoria estable que predice FlowMotion — referencia directa a tu paper.
- Respeta `prefers-reduced-motion` (pausa animaciones si el usuario lo tiene activado en su sistema).
- 100% responsive, sin dependencias externas más que las fuentes.
