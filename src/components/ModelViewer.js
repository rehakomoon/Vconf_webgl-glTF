import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import * as THREE from "three";

export default function ModelViewer() {
  const [model, setModel] = useState(null);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileMap = new Map();

    // ファイル名 → Blob URL を map に格納
    for (const file of files) {
      const url = URL.createObjectURL(file);
      fileMap.set(file.name, url);
    }

    // .objファイルの検索
    const objFile = files.find((f) => f.name.endsWith(".obj"));
    const mtlFile = files.find((f) => f.name.endsWith(".mtl"));

    if (!objFile) {
      alert("objファイルが見つかりません");
      return;
    }

    if (mtlFile) {
      const mtlLoader = new MTLLoader();

      mtlLoader.setMaterialOptions({ side: THREE.DoubleSide });
      mtlLoader.setResourcePath(""); // 無視されるが必要
      mtlLoader.setPath(""); // 無視されるが必要
      mtlLoader.load(fileMap.get(mtlFile.name), (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(fileMap.get(objFile.name), (obj) => {
          setModel(<primitive object={obj} />);
        });
      });
    } else {
      // MTLなしでも読み込めるように
      const objLoader = new OBJLoader();
      objLoader.load(fileMap.get(objFile.name), (obj) => {
        setModel(<primitive object={obj} />);
      });
    }
  };

  return (
    <div>
      <input type="file" multiple accept=".obj,.mtl,.jpg,.png" onChange={handleUpload} />
      <Canvas style={{ height: "500px", background: "#f0f0f0" }}>
        <ambientLight />
        <directionalLight position={[5, 5, 5]} />
        <OrbitControls />
        {model}
      </Canvas>
    </div>
  );
}
