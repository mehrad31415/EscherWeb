import "../css/Gallery.css";

function parseFileName(fileName) {
    const base = fileName.split("/").pop();
    const [name] = base.split(".");
    const parts = name.split("_");

    let variant = "";
    let shape = "";

    if (parts[0] === "contour") {
        variant = "contour";
        shape = parts[1];
    } else if (parts[0] === "escherized") {
        variant = "escherized";
        shape = parts[1];
    } else if (parts[0] === "tiling") {
        if (parts[1] === "escher") {
            variant = "tile_escher";
            shape = parts[2];
        } else if (parts[1] === "tactile") {
            variant = "tile_tactile";
            shape = parts[2];
        }
    } else {
        variant = "image";
        shape = parts[0];
    }
    return { shape, variant };
}

function Gallery() {
    const modules = import.meta.glob("../gallery/*.{png,jpg,jpeg,gif}", { eager: true });
    const grouped = {};
    Object.entries(modules).forEach(([path, mod]) => {
        const { shape, variant } = parseFileName(path);
        if (!grouped[shape]) grouped[shape] = {};
        grouped[shape][variant] = mod.default;
    });

    const variants = ["image", "contour", "escherized", "tile_escher", "tile_tactile"];

    return (
        <div className="gallery">
            <table>
                <thead>
                    <tr>
                        <th>Shape</th>
                        {variants.map(v => (
                            <th key={v}>{v.replace("_", " ")}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(grouped).map(([shape, imgs]) => (
                        <tr key={shape}>
                            <td className="shape-name">{shape}</td>
                            {variants.map(v => (
                                <td key={v}>
                                    {imgs[v] ? (
                                        <img src={imgs[v]} alt={`${shape}-${v}`} />
                                    ) : (
                                        <span className="missing">—</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Gallery;
