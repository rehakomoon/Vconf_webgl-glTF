import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function FbxZipUploader() {
  const [content, setContent] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const blobUrls = useRef([]);

  useEffect(() => {
    return () => {
      blobUrls.current.forEach(URL.revokeObjectURL);
      blobUrls.current = [];
    };
  }, []);

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadStatus("");

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("https://3dobjcttest.yashubustudioetc.com/api/upload.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setUploadStatus(`✅ アップロード完了: ${result.fileName}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("アップロード失敗", error);
      setUploadStatus("❌ アップロード失敗: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = async (e) => {
    setContent(null);
    setFileToUpload(null);
    setUploadStatus("");

    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (ext.endsWith(".zip")) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const fileMap = new Map();

      await Promise.all(
        Object.values(zip.files).map(async (entry) => {
          if (entry.dir) return;
          const blob = await entry.async("blob");
          const url = URL.createObjectURL(blob);
          blobUrls.current.push(url);
          fileMap.set(entry.name.replace(/\\/g, "/"), url);
        })
      );

      const fbxEntry = [...fileMap.keys()].find((k) => k.toLowerCase().endsWith(".fbx"));
      if (!fbxEntry) {
        alert("ZIP 内に .fbx が見つかりません");
        return;
      }

      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        const filename = url.split("/").pop();
        const match = [...fileMap.keys()].find((k) => k.endsWith(filename));
        return match ? fileMap.get(match) : url;
      });

      new FBXLoader(manager).load(
        fileMap.get(fbxEntry),
        (obj) => {
          setContent(<primitive object={obj} />);
          setFileToUpload(file);
        },
        undefined,
        (err) => console.error("FBX load error:", err)
      );
    }
    else if (ext.endsWith(".fbx")) {
      const url = URL.createObjectURL(file);
      blobUrls.current.push(url);
      new FBXLoader().load(
        url,
        (obj) => {
          setContent(<primitive object={obj} />);
          setFileToUpload(file);
        },
        undefined,
        (err) => console.error("FBX load error:", err)
      );
    } else {
      alert("対応形式: .zip (fbx形式) または .fbx");
    }

    e.target.value = "";
  };

  return (
    <div>
      <input
        type="file"
        accept=".zip,.fbx"
        onChange={handleFile}
        style={{ marginBottom: 8 }}
      />

      <Canvas style={{ height: 500, background: "#f0f0f0", marginBottom: 8 }}>
        <ambientLight />
        <directionalLight position={[5, 10, 5]} />
        <OrbitControls />
        {content}
      </Canvas>

      {content && fileToUpload && (
        <>
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "アップロード中..." : "このファイルを提出する"}
          </button>

          {isUploading && (
            <div style={{
              width: "100%",
              maxWidth: "600px",
              background: "#eee",
              height: "10px",
              margin: "8px auto",
              position: "relative",
              overflow: "hidden",
              borderRadius: "4px"
            }}>
              <div style={{
                width: "100%",
                height: "100%",
                background: "#4caf50",
                animation: "progress 2s infinite linear"
              }} />
            </div>
          )}

          {uploadStatus && (
            <div style={{ marginTop: 8, color: uploadStatus.startsWith("✅") ? "green" : "red" }}>
              {uploadStatus}
            </div>
          )}
        </>
      )}

      {/* タスクバーアニメーション */}
      <style>
        {`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        `}
      </style>
    </div>
  );
}
