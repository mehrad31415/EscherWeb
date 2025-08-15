import "../css/About.css";

const LINKS = {
  tiledArt: "https://tiled.art/en/about/",
  escherTiling: "https://github.com/nagata-yuichi/EscherTiling",
  tactileJS: "https://github.com/isohedral/tactile-js",
  pexels: "https://www.pexels.com/api/",
  unsplash: "https://unsplash.com/developers",
  pixabay: "https://pixabay.com/api/docs/",
};

function About() {
  const version = import.meta.env.VITE_APP_VERSION ?? "0.1.0";

  return (
    <main className="about">
      <header className="about_header">
        <p className="about_meta">
          Version <code>{version}</code>
        </p>
        <nav className="about_nav" aria-label="On this page">
          <a href="#overview">Overview</a>
          <a href="#similar">Similar Work</a>
          <a href="#tactile">tactile‑js</a>
          <a href="#solver">EscherTiling</a>
          <a href="#workflow">Workflow</a>
          <a href="#Acknowledgements">Acknowledgements</a>
        </nav>
      </header>
      <section id="overview" className="about_section">
        <h2>Overview</h2>
        <p>
          <strong>EscherWeb</strong> is an interactive, browser‑based <em>Escherization</em> tool. 
          Starting from a user‑drawn shape or searched silhouette, the tool attempts to produce a similar-shaped <em>prototile</em> that
          tiles the plane <em>isohedrally</em>—and then renders the tiling in
          real time. The chore of EscherWeb integrates:
        </p>
        <ul className="about_list--bulleted">
          <li>
            <strong>EscherTiling</strong> as the optimization algorithm used to convert the original shape
            to a <em>similar-shaped</em> tile that can tile the plane.
          </li>
          <li>
            <strong>tactile‑js</strong> for producing valid tilings of the generated target prototile.
          </li>
        </ul>
        <div className="about_callout">
          <p>
            <strong>Goal:</strong> The shape provided by the user, either drawn or searched, is minimally modified to make it suitable for tiling.
            Escherization balances similarity to the input with the strict geometric constraints needed to tile the plane. 
            Tactile‑JS lets you visualize how the optimized shape can be used to isohedrally tile the plane without gaps or overlaps.
          </p>
        </div>
      </section>
      <section id="similar" className="about_section">
        <h2>Similar Work</h2>
        <p>
          <a href="https://tiled.art/en/about/" target="_blank" rel="noopener">Tiled.art</a> is an interactive, browser-based platform for creating and exploring tessellations. 
          It provides symmetry templates for the 17 wallpaper groups, allowing users to draw directly 
          within a fundamental domain so the result is tilable by design. While Tiled.art focuses on manual creativity within fixed symmetry templates, 
          our work goes further by performing <em>automatic Escherization</em> — transforming an <em>arbitrary</em> input shape into a similar-shaped form that can tile the plane <strong>isohedrally</strong>. 
        </p>
      </section>
      <section id="solver" className="about_section">
        <h2>EscherTiling</h2>
        <p>
          <em>Escherization</em> (originating in work by Kaplan &amp; Salesin)
          is the process of transforming an arbitrary shape into a similar-shaped form that can tile the plane periodically. 
          In general, most shapes can’t tile the plane in their original form; they must be adjusted to create an isohedral tiling, where a single shape repeats in a symmetrical pattern covering the plane without gaps or overlaps.      
          <a href={LINKS.escherTiling} target="_blank" rel="noreferrer"> EscherTiling </a> (Nagata &amp; Imahori, C++) frames Escherization as a constrained optimization problem:
        </p>
        <ul className="about_list--bulleted">
          <li>
            <strong>Objective:</strong> minimize shape difference between the
            optimized tile and the original shape.
          </li>
          <li>
            <strong>Constraints:</strong> the tile must satisfy the geometric
            relations of a chosen isohedral type.
          </li>
        </ul>
        <p>
          Since EscherTiling is used to generate the Escherized shape, it only searches within a limited subset of the isohedral classes — namely: <code>IH4()</code>, <code>IH5()</code>, <code>IH6()</code>, <code>IH1()</code>, <code>IH2()</code>, <code>IH3()</code>, <code>IH7()</code>, <code>IH21()</code>, and <code>IH28()</code>. 
          For a visual overview of the classes, you can explore the <a href="https://www.jaapsch.net/tilings/mclean/index.html" target="_blank" rel="noopener">Tom McLean’s Isohedral Tiling Templates</a>.
        </p>
        <div className="about_callout">
          <p>
            <strong>Result:</strong> a best‑fit isohedral type (IH), an optimized
            prototile polygon/curves, and a score summarizing energy/error and
            runtime.
          </p>
        </div>
      </section>
      <section id="tactile" className="about_section">
        <h2>tactile‑js: Interactive Isohedral Templates</h2>
        <p>
          <a href={LINKS.tactileJS} target="_blank" rel="noreferrer">tactile‑js</a> (by Craig S. Kaplan) encodes the combinatorics and symmetries of isohedral types. 
         There are <em>93 isohedral classes</em> of tilings in the plane. Out of the 93 isohedral classes, 12 were deemed boring. Therefore, the tactile‑js library lets you manipulate the other 81 types. 
         In short, if you give TactileJS a prototile design and parameters, it will generate a section of the plane completely covered by repeated copies of that tile according to the chosen isohedral class.
        </p>
      </section>
      <section id="workflow" className="about_section">
        <h2>Workflow</h2>
        <ol className="about_list--numbered">
          <li>
            <strong>Acquire</strong>: draw on canvas or import (file, URL,
            search).
          </li>
          <li>
            <strong>Preprocess</strong>: Remove the background and vectorize the shape.
          </li>
          <li>
            <strong>Solve</strong>: EscherTiling runs locally and returns IH
            type, prototile, and score.
          </li>
          <li>
            <strong>Visualize</strong>: tactile‑js renders the tiling.
          </li>
        </ol>
      </section>

      <section id="Acknowledgements" className="about_section">
        <h2>Acknowledgements</h2>
        <ul className="about_list--bulleted">
          <li>This app can query{" "}
            <a href={LINKS.pexels} target="_blank" rel="noreferrer">
              Pexels
            </a>
            ,{" "}
            <a href={LINKS.unsplash} target="_blank" rel="noreferrer">
              Unsplash
            </a>
            , and{" "}
            <a href={LINKS.pixabay} target="_blank" rel="noreferrer">
              Pixabay
            </a>{" "}
            for image search.</li>
          <li>
            <a href={LINKS.escherTiling} target="_blank" rel="noreferrer">
              nagata‑yuichi/EscherTiling
            </a>{" "}
            (MIT)
          </li>
          <li>
            <a href={LINKS.tactileJS} target="_blank" rel="noreferrer">
              isohedral/tactile‑js
            </a>{" "}
            by Craig S. Kaplan
          </li>
          <li>
            Kaplan, Craig S., and David H. Salesin. "Escherization." Proceedings of the 27th annual conference on Computer graphics and interactive techniques. 2000.
          </li>
          <li>Yuichi Nagata and Shinji Imahori, An Efficient Exhaustive Search Algorithm for the Escherization Problem, Algorithmica, Vol.82, No.9, 2502-2534, 2020. </li>
        </ul>
      </section>

      <section className="about_section" id="privacy">
        <h2>Privacy</h2>
        <p>
          All image processing runs entirely in your browser.
          By default, nothing you draw or upload is sent to any server. If you choose
          an online image source, your browser fetches that image directly from that
          provider.
        </p>
      </section>


      <footer className="about_footer">
        <p>
          Made for research/education. Issues or feedback? Open an issue on the
          repo or contact the author.
        </p>
      </footer>
    </main>
  );
}

export default About;
