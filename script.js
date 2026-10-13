const video = document.getElementById('webcam');
const blessing = document.getElementById('blessing');
let useFrontCamera = true;

// 啟動相機
async function startCamera() {
    try {
        const constraints = {
            video: { 
                facingMode: useFrontCamera ? 'user' : 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    } catch (err) {
        console.error("無法開啟相機: ", err);
        alert("請允許網頁使用相機權限！");
    }
}

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// 調整後的特徵分析函數（大幅放寬門檻，更容易觸發）
function analyzeFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 120;  // 縮小解析度以加快運算與容錯率
        canvas.height = 120;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const w = canvas.width;
        const h = canvas.height;

        let totalVariation = 0;
        let darkAreaCount = 0;

        // 簡化計算：統計畫面中的對比度與暗色區域（對應神尊與鬍鬚線條）
        for (let y = 2; y < h - 2; y += 2) {
            for (let x = 2; x < w - 2; x += 2) {
                const idx = (y * w + x) * 4;
                const gray = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114);
                
                // 計算與周邊像素的差異
                const rightGray = (pixels[(y * w + (x + 2)) * 4] * 0.299);
                const diff = Math.abs(gray - rightGray);
                
                totalVariation += diff;

                // 統計中央區域的暗色像素（如頭髮、鬍子區塊）
                if (y >= h * 0.3 && y < h * 0.8 && x >= w * 0.2 && x <= w * 0.8) {
                    if (gray < 100) {
                        darkAreaCount++;
                    }
                }
            }
        }

        // 可以在瀏覽器開發者工具的 Console 看到目前的數值，方便依實際情況微調
        console.log("對比度數值:", totalVariation, "暗色區塊數值:", darkAreaCount);

        // 放寬觸發條件：只要畫面有足夠的細節紋理與暗色特徵就顯示祝福
        if (totalVariation > 35000 && darkAreaCount > 80) {
            blessing.style.display = 'block'; // 顯示祝福
        } else {
            // 如果移開鏡頭，設定為自動隱藏
            blessing.style.display = 'none'; 
        }
    }
}

// 每 250 毫秒檢測一次
setInterval(analyzeFrame, 250);

// 切換前後鏡頭
document.getElementById('toggleBtn').addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    startCamera();
});

startCamera();