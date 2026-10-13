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

// 結構與邊緣特徵分析函數（不依賴顏色）
function analyzeFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 160;
        canvas.height = 160;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const w = canvas.width;
        const h = canvas.height;

        let edgeCount = 0;
        let beardAreaCount = 0;
        let weaponLineCount = 0;

        // 將畫面轉為灰階並計算簡易梯度（邊緣檢測）
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                
                // 取得灰階值
                const gray = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114);
                
                // 左右像素差異（偵測垂直線條，如寶劍與手指線條）
                const leftGray = (pixels[(y * w + (x - 1)) * 4] * 0.299);
                const rightGray = (pixels[(y * w + (x + 1)) * 4] * 0.299);
                const diff = Math.abs(leftGray - rightGray);

                if (diff > 35) {
                    edgeCount++;
                    // 如果在左側或右側邊緣偵測到明顯直線特徵（對應手持劍器或手指）
                    if (x < w * 0.35 || x > w * 0.65) {
                        weaponLineCount++;
                    }
                }

                // 偵測中心偏下方區域（對應長鬍子與面部輪廓的深色聚集區）
                if (y >= h * 0.4 && y < h * 0.75 && x >= w * 0.35 && x <= w * 0.65) {
                    if (gray < 90) { // 較暗的像素群
                        beardAreaCount++;
                    }
                }
            }
        }

        // 綜合結構判定：當畫面中出現足夠的邊緣線條（劍/手勢輪廓）與中心鬍子區塊時自動觸發
        if (edgeCount > 1200 && beardAreaCount > 150 && weaponLineCount > 300) {
            blessing.style.display = 'block'; // 顯示祝福
        } else {
            // blessing.style.display = 'none'; // 可依需求決定是否移開後自動隱藏
        }
    }
}

// 每 300 毫秒檢測一次
setInterval(analyzeFrame, 300);

// 切換前後鏡頭
document.getElementById('toggleBtn').addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    startCamera();
});

startCamera();