# Escher Web

Final project for **CS898 – Tiling and Computation**, University of Waterloo. The public link to the website can be found on [`EscherWeb`](https://escher-web.vercel.app/). 

Escher Web is a **React-based interactive web tool** for transforming user-supplied shapes into *mathematically valid tileable forms*. Users can **draw**, **search**, or **upload** a shape, which is then processed by an **Escherization algorithm** to produce a similar but tilable shape. The result is displayed in a plane tiling generated via the [`tactile-js`](https://github.com/isohedral/tactile-js) library and the backend of the [`EscherTiling`](https://github.com/nagata-yuichi/EscherTiling) algorithm.

## Features
- **Draw Mode** – Create shapes directly in the browser.
- **Search Mode** – Lookup shapes.
- **Upload Mode** – Upload custom shapes.
- **OpenCV.js Integration** – For contour extraction and preprocessing.
- **Escherization Algorithm** – Computes a tilable variant of the shape outline.
- **Tiling Preview** – Uses `tactile-js` or `EscherTiling` to fill the plane with the computed tile.

## Project Structure

The project has the following structure:

```text
.
├── EscherWeb.pdf
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   ├── esch1.png
│   ├── esch2.png
│   ├── esch3.png
│   ├── homepage.png
│   ├── icon.png
│   ├── jikken_E.wasm
│   ├── jikken_E.wasm.map
│   └── search.png
├── src
│   ├── App.jsx
│   ├── components
│   │   ├── NavBar.jsx
│   │   └── jikken_E.js
│   ├── css
│   │   ├── About.css
│   │   ├── App.css
│   │   ├── Draw.css
│   │   ├── Escher.css
│   │   ├── Gallery.css
│   │   ├── Home.css
│   │   ├── Navbar.css
│   │   ├── Search.css
│   │   └── index.css
│   ├── gallery
│   │   ├── G.png_1755303440957.png
│   │   ├── bat.png_1755303853577.png
│   │   ├── beetle.png_1755303806631.png
│   │   ├── bird1.png_1755303770353.png
│   │   ├── bird2.png_1755303733962.png
│   │   ├── camel.png_1755303697992.png
│   │   ├── cat.png_1755303661540.png
│   │   ├── cat2.png_1755303562415.png
│   │   ├── contour_G.png_1755303456881.png
│   │   ├── contour_bat.png_1755303869097.png
│   │   ├── contour_beetle.png_1755303822631.png
│   │   ├── contour_bird1.png_1755303786189.png
│   │   ├── contour_bird2.png_1755303749586.png
│   │   ├── contour_camel.png_1755303713953.png
│   │   ├── contour_cat.png_1755303677991.png
│   │   ├── contour_cat2.png_1755303589350.png
│   │   ├── contour_deer.png_1755303534146.png
│   │   ├── contour_dolphin.png_1755303636552.png
│   │   ├── contour_dragon.png_1755303495218.png
│   │   ├── contour_gecko.png_1755303419514.png
│   │   ├── contour_ika.png_1755303376661.png
│   │   ├── contour_octpus.png_1755303329963.png
│   │   ├── contour_okapi.png_1755303292512.png
│   │   ├── contour_pegasus.png_1755303255676.png
│   │   ├── contour_penguin.png_1755303207588.png
│   │   ├── contour_seahorse.png_1755303129176.png
│   │   ├── contour_spider.png_1755303169066.png
│   │   ├── contour_squirrel.png_1755303079905.png
│   │   ├── deer.png_1755303516708.png
│   │   ├── dolphin.png_1755303618746.png
│   │   ├── dragon.png_1755303478436.png
│   │   ├── escherized_G.png_1755303467148.png
│   │   ├── escherized_bat.png_1755303880832.png
│   │   ├── escherized_beetle.png_1755303834449.png
│   │   ├── escherized_bird1.png_1755303797829.png
│   │   ├── escherized_bird2.png_1755303760285.png
│   │   ├── escherized_camel.png_1755303724170.png
│   │   ├── escherized_cat.png_1755303688156.png
│   │   ├── escherized_cat2.png_1755303599609.png
│   │   ├── escherized_deer.png_1755303543510.png
│   │   ├── escherized_dolphin.png_1755303650570.png
│   │   ├── escherized_dragon.png_1755303506820.png
│   │   ├── escherized_gecko.png_1755303430259.png
│   │   ├── escherized_ika.png_1755303390362.png
│   │   ├── escherized_octpus.png_1755303342845.png
│   │   ├── escherized_okapi.png_1755303302203.png
│   │   ├── escherized_pegasus.png_1755303265381.png
│   │   ├── escherized_penguin.png_1755303220647.png
│   │   ├── escherized_seahorse.png_1755303139979.png
│   │   ├── escherized_spider.png_1755303179590.png
│   │   ├── escherized_squirrel.png_1755303092648.png
│   │   ├── gecko.png_1755303403223.png
│   │   ├── ika.png_1755303360449.png
│   │   ├── octpus.png_1755303314513.png
│   │   ├── okapi.png_1755303276521.png
│   │   ├── pegasus.png_1755303238370.png
│   │   ├── penguin.png_1755303191039.png
│   │   ├── seahorse.png_1755303108716.png
│   │   ├── spider.png_1755303152516.png
│   │   ├── squirrel.png_1755303048867.png
│   │   ├── tiling_escher_G.png_1755303467148.png
│   │   ├── tiling_escher_bat.png_1755303880833.png
│   │   ├── tiling_escher_beetle.png_1755303834449.png
│   │   ├── tiling_escher_bird1.png_1755303797829.png
│   │   ├── tiling_escher_bird2.png_1755303760286.png
│   │   ├── tiling_escher_camel.png_1755303724171.png
│   │   ├── tiling_escher_cat.png_1755303688159.png
│   │   ├── tiling_escher_cat2.png_1755303599609.png
│   │   ├── tiling_escher_deer.png_1755303543513.png
│   │   ├── tiling_escher_dolphin.png_1755303650570.png
│   │   ├── tiling_escher_dragon.png_1755303506820.png
│   │   ├── tiling_escher_gecko.png_1755303430259.png
│   │   ├── tiling_escher_ika.png_1755303390362.png
│   │   ├── tiling_escher_octpus.png_1755303342845.png
│   │   ├── tiling_escher_okapi.png_1755303302203.png
│   │   ├── tiling_escher_pegasus.png_1755303265381.png
│   │   ├── tiling_escher_penguin.png_1755303220647.png
│   │   ├── tiling_escher_seahorse.png_1755303139979.png
│   │   ├── tiling_escher_spider.png_1755303179591.png
│   │   ├── tiling_escher_squirrel.png_1755303092648.png
│   │   ├── tiling_tactile_G.png_1755303467166.png
│   │   ├── tiling_tactile_bat.png_1755303880851.png
│   │   ├── tiling_tactile_beetle.png_1755303834468.png
│   │   ├── tiling_tactile_bird1.png_1755303797848.png
│   │   ├── tiling_tactile_bird2.png_1755303760303.png
│   │   ├── tiling_tactile_camel.png_1755303724189.png
│   │   ├── tiling_tactile_cat.png_1755303688176.png
│   │   ├── tiling_tactile_cat2.png_1755303599627.png
│   │   ├── tiling_tactile_deer.png_1755303543533.png
│   │   ├── tiling_tactile_dolphin.png_1755303650589.png
│   │   ├── tiling_tactile_dragon.png_1755303506839.png
│   │   ├── tiling_tactile_gecko.png_1755303430278.png
│   │   ├── tiling_tactile_ika.png_1755303390381.png
│   │   ├── tiling_tactile_octpus.png_1755303342868.png
│   │   ├── tiling_tactile_okapi.png_1755303302221.png
│   │   ├── tiling_tactile_pegasus.png_1755303265401.png
│   │   ├── tiling_tactile_penguin.png_1755303220665.png
│   │   ├── tiling_tactile_seahorse.png_1755303139996.png
│   │   ├── tiling_tactile_spider.png_1755303179610.png
│   │   └── tiling_tactile_squirrel.png_1755303092669.png
│   ├── main.jsx
│   ├── pages
│   │   ├── About.jsx
│   │   ├── Draw.jsx
│   │   ├── Escher.jsx
│   │   ├── Gallery.jsx
│   │   ├── Home.jsx
│   │   └── Search.jsx
│   ├── utils
│   │   ├── api.js
│   │   ├── opencv.js
│   │   └── selection.js
│   └── wallpapers
│       ├── img1.png
│       ├── img2.png
│       ├── img3.png
│       ├── img4.png
│       ├── img5.png
│       ├── img6.png
│       └── img7.png
└── vite.config.js

9 directories, 144 files
```

## Installation & Setup
This project uses **Node.js** and **Vite**.

1. **Clone the repository**

```bash
git clone https://github.com/mehrad31415/EscherWeb.git
cd EscherWeb/
```

2. **Install Dependencies**

```bash
npm install
```

3. **Run in Development Mode**

```bash
npm run dev
```

The app will be available at `http://localhost:5174/` by default.

## User Interface

- The _favicon_ of the website looks like the following:

![favicon](public/icon.png)

This image was taken from Kaplan, C. S., & Salesin, D. H. (2000, July). Escherization. In Proceedings of the 27th annual conference on Computer graphics and interactive techniques (pp. 499-510).

- The _homepage_ of the website looks like the following:

![homepage](public/homepage.png)

Under the `src/wallpapers/` directory there are seven different wallpapers where each time the _homepage_ is reloaded one is randomly chosen as the wallpaper. These images were taken from `https://tiled.art/en/home/`.

- The navigation bar includes _Home_, _Search_, _Draw_, _Escher_, _Gallery_, and _About_. The _About_ page provides a biref overview about the project and acknowledgements. The _Search_ provides an interface to lookup an image of the users choice. In the backend, Unsplash, Pexels, and Pixabay APIs are used to retrieve images. This functionality is rate-limited, and frequent requests may result in temporary unavailability. Once choosing the image, there is a button `Use in Escher` which leads to the _Escher_ page. Likewise, in the _Draw_ page there is a canvas where the user can draw their own shape and upon clicking on `Use in Escher` they will be redirected to the `Escher` page. Alternatively, the user can directly go to the _Escher_ page from the navigation bar and upload their image of choice in `png/jpg` format.

![search](public/search.png)

- The _Escher_ page looks like the following:

![escher_one](public/esch1.png)

You can download the original image itself by clicking the download button and a reference of the image can be seen on the page. The user must choose the number of points for the contour. For performance reasons, please select a maximum of 50 points (even though the web app technically supports up to 200, in steps of 5) to avoid potential crashes. Click on `Get Contour` and wait for the process of removing backend and getting the outline of the image to be completed. You can download this image and the data points of the image if you desire. Upon generating the contour, by clicking on `Escherize`, the escherization algorithm will start running. Upon completion we will get the tilable shape which is close to the original contour, and receive the tiling of the image like following:

![escher_two](public/esch2.png)

The following tilings are generated automatically. The left tiling is produced by the EscherTiling software (with some changes, since it originally used X11 for display), and the right tiling is generated using tactile-js.

![escher_three](public/esch3.png)

Note that in the right hand side, the repeating motif is a single shape that is repeated across the plane with only rigid motions, with some fixed background shapes.

- Finally, the Gallery showcases example runs using polygons from the EscherTiling repository. Thus, this project serves two purposes:
    + generating escherizations and tilings for random images.
    + hosting an online gallery of the polygons from the EscherTiling project.