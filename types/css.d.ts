declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "maplibre-gl/dist/maplibre-gl.css";
