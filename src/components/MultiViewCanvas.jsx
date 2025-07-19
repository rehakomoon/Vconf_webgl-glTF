import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// 固定カメラコンポーネント
function FixedCamera({ position, target }) {
  const { camera, gl, scene } = useThree();
  
  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target]);

  useFrame(() => {
    gl.render(scene, camera);
  });

  return null;
}

// 各視点のラベル
const viewLabels = {
  main: "メインビュー",
  front: "前方",
  back: "後方", 
  left: "左側",
  right: "右側",
  top: "真上"
};

// カメラ位置の定義
const viewPoints = {
  front: { position: [0, 0, 2], target: [0, 0, 0] },
  back: { position: [0, 0, -2], target: [0, 0, 0] },
  left: { position: [-2, 0, 0], target: [0, 0, 0] },
  right: { position: [2, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 2, 0], target: [0, 0, 0] }
};

export default function MultiViewCanvas({ children, style = {} }) {
  const containerRef = useRef();
  const defaultStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 220px",
    gridTemplateRows: "1fr",
    gap: "10px",
    height: "600px",
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    ...style
  };

  const mainCanvasStyle = {
    width: "100%",
    height: "100%",
    background: "#f0f0f0",
    borderRadius: "8px",
    minHeight: "0"
  };

  const subCanvasStyle = {
    width: "180px",
    height: "100px",
    background: "#f8f8f8",
    border: "2px solid #ddd",
    borderRadius: "4px",
    flexShrink: 0
  };

  const subViewsContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "0",
    overflow: "auto",
    maxHeight: "100%"
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "4px",
    color: "#666"
  };  return (
    <div ref={containerRef} style={defaultStyle} className="multi-view-container">
      {/* メインキャンバス */}
      <div style={{ position: "relative", minWidth: "0", minHeight: "0" }}>
        <div style={labelStyle}>{viewLabels.main}</div>
        <Canvas style={mainCanvasStyle}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          {children}
        </Canvas>
      </div>

      {/* サブビューコンテナ */}
      <div style={subViewsContainerStyle} className="sub-views-container">
        {Object.entries(viewPoints).map(([viewName, viewData]) => (
          <div key={viewName} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={labelStyle}>{viewLabels[viewName]}</div>
            <Canvas style={subCanvasStyle} className="sub-canvas">
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={0.8} />
              <FixedCamera 
                position={viewData.position} 
                target={viewData.target} 
              />
              <OrbitControls 
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
              />
              {children}
            </Canvas>
          </div>
        ))}
      </div>
    </div>
  );
}
