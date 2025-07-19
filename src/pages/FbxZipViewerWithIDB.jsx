import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import MultiViewCanvas from "../components/MultiViewCanvas";

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

  const validateScene = async (scene, zip) => {
    let error = null;

    let polyCount = 0;
    scene.traverse((obj) => {
      if (obj.isMesh) {
        const geo = obj.geometry;
        polyCount += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
        if (/[^\x01-\x7E]/.test(obj.name) || /\u3000/.test(obj.name)) {
          error = "オブジェクト名に2Byte文字か全角スペースが含まれています";
        }
      }
    });
    if (polyCount > 20000) error = "ポリゴン数が2万を超えています";

    const matSet = new Set();
    scene.traverse((obj) => {
      if (obj.isMesh) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => matSet.add(m));
        else matSet.add(obj.material);
      }
    });
    if (matSet.size > 5) error = "マテリアル数が5を超えています";

    if (zip) {
      const textures = Object.values(zip.files).filter((f) => /\.(png|jpe?g)$/i.test(f.name));
      if (textures.length > 1) error = "テクスチャ画像は1枚のみ許可です";
      for (const imgEntry of textures) {
        const blob = await imgEntry.async("blob");
        const url = URL.createObjectURL(blob);
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.width > 960 || img.height > 540) {
              error = "テクスチャ解像度は960x540以下にしてください";
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }
    }

    return error;
  };

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
        async (obj) => {
          const errMsg = await validateScene(obj, zip);
          if (errMsg) {
            alert(errMsg);
            return;
          }
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
        async (obj) => {
          const errMsg = await validateScene(obj);
          if (errMsg) {
            alert(errMsg);
            URL.revokeObjectURL(url);
            return;
          }
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
    <div style={{ padding: "2rem" }}>
      <h1>FBXビューワー</h1>
      <p>
        単体の <code>.fbx</code> または <code>.zip</code>（fbx ファイル一式） を
        アップロードしてください。
      </p>
      <p>投稿するモデルは以下の条件を満たしてください。</p>
      <ul>
        <li>ポリゴン数は 20,000 以下</li>
        <li>テクスチャは解像度 1K (960×540) 以下のものを 1 枚</li>
        <li>マテリアル数は 5 個以下</li>
        <li>オブジェクト名に 2 バイト文字や全角スペースを使用しない</li>
      </ul>
      <input
        type="file"
        accept=".zip,.fbx"
        onChange={handleFile}
        style={{ marginBottom: 8 }}
      />

      <MultiViewCanvas style={{ height: 600, marginBottom: 16 }}>
        {content}
      </MultiViewCanvas>

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
