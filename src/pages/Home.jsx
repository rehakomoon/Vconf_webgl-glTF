import React from "react";
import Glft from "./GltfZipViewerWithIDB";

export default function Home() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>glFTビューワー</h1>
      <p>
        単体の <code>.glb</code>
        または <code>.zip</code>（scene.gltf + scene.bin + textures） を
        アップロードしてください。
      </p>
      <Glft/>
    </div>
  );
}
