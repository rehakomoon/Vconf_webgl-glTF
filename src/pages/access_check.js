import React, { useState } from "react";

export default function PingButton() {
  const [pingResult, setPingResult] = useState(null);

  const checkConnection = async () => {
    try {
      const res = await fetch("https://3dobjcttest.yashubustudioetc.com/api/ping.php", {
        method: "GET",
        mode: "cors"
      });
      const data = await res.json();
      setPingResult(`✅ サーバー応答: ${data.status} / ${data.time}`);
    } catch (err) {
      setPingResult("❌ サーバーへの接続に失敗しました");
      console.error("Ping failed:", err);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={checkConnection}>サーバー接続確認</button>
      {pingResult && <div style={{ marginTop: 8 }}>{pingResult}</div>}
    </div>
  );
}
