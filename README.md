# Seahorse Exhibit Kiosk

Static touchscreen kiosk prototype for the seahorse exhibit home screen and challenge selection screen.

## Run

Open `index.html` in a full-screen browser, or serve this folder with any static web server.

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Structure

- `index.html`: screens and interactive exhibit markup
- `styles.css`: full-screen visual system and animation loops
- `app.js`: screen transitions, touch interactions, idle reset, reusable config
- `assets/seahorse-underwater-bg-1280.jpg`: optimized underwater environment artwork
- `assets/cartoon-seahorse-generated.png`: cartoon seahorse character artwork

The `KIOSK_CONFIG` object in `app.js` is the intended swap point for future exhibits such as octopus, shark, jellyfish, turtle, and rays.
