import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function GltfLoader() {
  const [sceneObj, setSceneObj] = useState(null);
  const blobUrls = useRef([]);

  // 終了時に Blob URL を破棄
  useEffect(() => {
    return () => {
      blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.current = [];
    };
  }, []);

  const onFileChange = async (e) => {
    setSceneObj(null);
    const file = e.target.files[0];
    if (!file) return;

    // ZIP の場合
    if (file.name.toLowerCase().endsWith(".zip")) {
      const ab = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(ab);
      const fileMap = new Map();

      // ZIP 内を Blob URL にマッピング
      await Promise.all(
        Object.values(zip.files).map(async (entry) => {
          if (entry.dir) return;
          const blob = await entry.async("blob");
          const url  = URL.createObjectURL(blob);
          const path = entry.name.replace(/\\/g, "/");
          fileMap.set(path, url);
          blobUrls.current.push(url);
        })
      );

      // 読み込む glTF ファイルを探す
      const gltfKey = [...fileMap.keys()].find((k) =>
        k.toLowerCase().endsWith(".gltf")
      );
      if (!gltfKey) {
        alert("ZIP 内に scene.gltf が見つかりません");
        return;
      }

      // LoadingManager で相対パスを Blob URL に置き換え
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        const clean = url
          .split("?")[0]
          .split("#")[0]
          .replace(/^(\.\/)?/, "")
          .replace(/\\/g, "/");
        return fileMap.get(clean) || url;
      });

      // 実際にロード
      new GLTFLoader(manager).load(
        fileMap.get(gltfKey),
        (gltf) => setSceneObj(<primitive object={gltf.scene} />),
        undefined,
        (err) => console.error("GLTF load error:", err)
      );
    }
    // 単体の .glb/.gltf の場合
    else if (
      file.name.toLowerCase().endsWith(".glb") ||
      file.name.toLowerCase().endsWith(".gltf")
    ) {
      const url = URL.createObjectURL(file);
      blobUrls.current.push(url);
      new GLTFLoader().load(
        url,
        (gltf) => {
          setSceneObj(<primitive object={gltf.scene} />);
          URL.revokeObjectURL(url);
        },
        undefined,
        (err) => console.error("GLTF load error:", err)
      );
    }
    else {
      alert("対応形式：.zip（.gltf/.bin/textures）または .glb/.gltf");
    }

    // 同一ファイル選択で無限ループしないようにクリア
    e.target.value = "";
  };

  return (
    <div>
      <input
        type="file"
        accept=".zip,.glb,.gltf"
        onChange={onFileChange}
      />
      <Canvas style={{ height: 500, background: "#f0f0f0", marginTop: 16 }}>
        <ambientLight />
        <directionalLight position={[5, 10, 5]} />
        <OrbitControls />
        {sceneObj}
      </Canvas>
    </div>
  );
}
