import React from "react";
import GltfLoader from "../components/GltfLoader";

export default function GltfViewer() {
  return (
    <div style={{ padding: 20 }}>
      <h2>glTF / GLB ビューア</h2>
      <p>
        単体の <code>.glb</code> / <code>.gltf</code>、
        または <code>.zip</code>（scene.gltf + scene.bin + textures） を
        アップロードしてください。
      </p>
      <GltfLoader />
    </div>
  );
}
