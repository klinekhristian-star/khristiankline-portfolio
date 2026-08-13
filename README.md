# Khristian Kline Portfolio

Personal portfolio for khristiankline.com.

## Sections
- Web Development
- Experience Design
- Executive Production
- Lab
- Screen (PDF / PPTX slideshow + hosted MP4)
- Contact

## Screen theater

Viewers open hosted files as a slideshow or film.

| Kind | Path | How it plays |
| --- | --- | --- |
| PDF | `media/decks/*.pdf` | Each page is a slide (arrows, dots, swipe, fullscreen) |
| PPTX | `media/decks/*.pptx` | Slides reconstructed in the theater (title, body, images, background). Legacy `.ppt` should be saved as `.pptx` or exported as PDF |
| MP4 | `media/videos/*.mp4` | Hosted player in the same theater |

Add a card in `main.js` (`DECKS` or `VIDEOS`). Drop-zone files stay in the browser and are never uploaded.

## Deploy
Static site on Vercel. Push to `main` for production.
