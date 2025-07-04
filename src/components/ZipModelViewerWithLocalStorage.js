import React, { useEffect, useState, useRef } from "react";
import JSZip from "jszip";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import * as THREE from "three";

const STORAGE_KEY = "tempModelZip";
const CHUNK = 0x8000;              // 32 768 byte

/* ---------- util: ArrayBuffer ⇄ Base64 ---------- */
const arrayBufferToBase64 = (ab) => {
  const u8 = new Uint8Array(ab);
  let binary = "";
  for (let i = 0; i < u8.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (b64) => {
  const binary = atob(b64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return u8.buffer;
};
/* ----------------------------------------------- */

export default function ZipModelViewer() {
  const [model, setModel] = useState(null);
  const blobUrls = useRef([]);
  const inputRef  = useRef(null);
  const loadedRef = useRef(false);

  /* zip → Three.js */
  const loadZip = async (ab) => {
    const zip = await JSZip.loadAsync(ab);
    const map = new Map();

    await Promise.all(
      Object.keys(zip.files).map(async (name) => {
        const f = zip.files[name];
        if (f.dir) return;
        const blob = await f.async("blob");
        const url  = URL.createObjectURL(blob);
        map.set(name.replace(/\\/g, "/"), url);
        blobUrls.current.push(url);
      })
    );

    const obj = [...map.keys()].find((n) => n.toLowerCase().endsWith(".obj"));
    const mtl = [...map.keys()].find((n) => n.toLowerCase().endsWith(".mtl"));
    if (!obj || !mtl) return alert("OBJ / MTL が見つかりません");

    const mgr = new THREE.LoadingManager();
    mgr.setURLModifier((url) => map.get(url.replace(/^(\.\/)?/, "").replace(/\\/g, "/")) || url);

    new MTLLoader(mgr).load(map.get(mtl), (mats) => {
      mats.preload();
      new OBJLoader(mgr).setMaterials(mats).load(map.get(obj), (o) => {
        setModel(<primitive object={o} />);
      });
    });
  };

  /* ---------- upload ---------- */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".zip")) return;

    const ab = await file.arrayBuffer();
    localStorage.setItem(STORAGE_KEY, arrayBufferToBase64(ab));
    await loadZip(ab);

    /** 同じファイルで onChange が再発火しないようクリア */
    if (inputRef.current) inputRef.current.value = "";
  };

  /* ---------- 初回ロード時 ---------- */
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) loadZip(base64ToArrayBuffer(saved));

    const cleanup = () => {
      blobUrls.current.forEach((u) => URL.revokeObjectURL(u));
      localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  /* ---------- UI ---------- */
  return (
    <div>
      <input type="file" accept=".zip" ref={inputRef} onChange={handleUpload} />
      <Canvas style={{ height: 500, background: "#f0f0f0" }}>
        <ambientLight />
        <directionalLight position={[5, 10, 5]} />
        <OrbitControls />
        {model}
      </Canvas>
    </div>
  );
}
