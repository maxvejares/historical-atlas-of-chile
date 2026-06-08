# How to open the Historical Atlas of Chile

Do not open `historical_atlas_of_chile.html` by double-clicking it.

When a browser opens the file directly (a `file://` URL), it blocks the page
from loading the map geometry (the `.geojson` files), because `file://` pages
are not allowed to fetch other local files. National time-series charts still
work, but every department and province map stays blank.

Open it through a tiny local web server instead:

1. Open a terminal.
2. Change into this folder:
   ```
   cd "gis_platform"
   ```
3. Start the server:
   ```
   python3 -m http.server 8767
   ```
4. Open this address in your browser:
   ```
   http://localhost:8767/historical_atlas_of_chile.html
   ```
5. When you are done, return to the terminal and press `Control-C` to stop the server.

If you open the file the wrong way, a red banner at the top of the page will
remind you of these steps.
