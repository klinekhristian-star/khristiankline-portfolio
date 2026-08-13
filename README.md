# Khristian Kline Portfolio

Personal portfolio for khristiankline.com.

## Sections
- Web Development (Live / In development websites + owner admin)
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

## Websites admin

Open `?owner=1` once to unlock owner mode on a device.

In the Web Development section you can:
- Click a site card to open its showcase (description, stack, screenshots, optional live link)
- Use **Websites admin** to add / edit / delete sites (saved in localStorage on that device)
- Drop screenshot images into `media/websites/` and reference paths like `/media/websites/gtm-home.jpg` in the admin form

Defaults: **GTM Insights Group** (Live) and **Music Venue Live** (In development).
