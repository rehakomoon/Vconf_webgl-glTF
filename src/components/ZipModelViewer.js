import React, { useState } from "react";
import JSZip from "jszip";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import * as THREE from "three";

export default function ZipModelViewer() {
  const [model, setModel] = useState(null);

  const handleZipUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith(".zip")) return;

    const zip = await JSZip.loadAsync(file);
    const fileMap = new Map();

    // zip内のファイル名 → Blob URL を登録
    for (const filename of Object.keys(zip.files)) {
      const zipEntry = zip.files[filename];
      if (!zipEntry.dir) {
        const blob = await zipEntry.async("blob");
        const blobUrl = URL.createObjectURL(blob);

        // ファイルパスを正規化（\ → / に統一）
        const normalizedName = filename.replace(/\\/g, "/");
        fileMap.set(normalizedName, blobUrl);
      }
    }

    // 対象ファイルを探す
    const objPath = [...fileMap.keys()].find((f) => f.toLowerCase().endsWith(".obj"));
    const mtlPath = [...fileMap.keys()].find((f) => f.toLowerCase().endsWith(".mtl"));

    if (!objPath || !mtlPath) {
      alert("OBJまたはMTLファイルが見つかりません");
      return;
    }

    // ローディングマネージャーで URL を Blob URL に置き換え
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      const normalizedUrl = url.replace(/^(\.\/)?/, "").replace(/\\/g, "/");
      const blobUrl = fileMap.get(normalizedUrl);
      if (!blobUrl) {
        console.warn("Missing blob for:", normalizedUrl);
      }
      return blobUrl || url;
    });

    // MTL → OBJ の順で読み込む
    const mtlLoader = new MTLLoader(manager);
    mtlLoader.load(fileMap.get(mtlPath), (materials) => {
      materials.preload();

      const objLoader = new OBJLoader(manager);
      objLoader.setMaterials(materials);
      objLoader.load(fileMap.get(objPath), (obj) => {
        setModel(<primitive object={obj} />);
      });
    });
  };

  return (
    <div>
      <input type="file" accept=".zip" onChange={handleZipUpload} />
      <Canvas style={{ height: "500px", background: "#eee" }}>
        <ambientLight />
        <directionalLight position={[5, 10, 5]} />
        <OrbitControls />
        {model}
      </Canvas>
    </div>
  );
}
