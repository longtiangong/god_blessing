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

// 智慧特徵辨識函數 (已提高嚴格度)
function analyzeFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 120;  // 縮小解析度以加快運算
        canvas.height = 120;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const w = canvas.width;
        const h = canvas.height;

        let centerDarkCount = 0;   // 中間：暗色臉部與長鬍子特徵
        let outerLineCount = 0;    // 周圍：衣服或劍的輪廓線條
        
        // 掃描畫面像素並對應神尊的特徵位置
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const gray = (r * 0.299 + g * 0.587 + b * 0.114); // 灰階值

                // 1. **核心區域 (30% ~ 80%)**：偵測暗色區塊 (長鬍子與頭髮)
                // 此處將灰階閥值調得更暗 (從 100 降到 70) 且限制在更中心的位置
                if (y >= h * 0.3 && y < h * 0.8 && x > w * 0.35 && x < w * 0.65 && gray < 70) {
                    centerDarkCount++;
                }

                // 2. **周圍輪廓 (不特定區域)**：偵測邊緣線條
                const rightIdx = (y * w + Math.min(x + 1, w - 1)) * 4;
                const rightGray = (pixels[rightIdx] * 0.299 + pixels[rightIdx+1] * 0.587 + pixels[rightIdx+2] * 0.114);
                if (Math.abs(gray - rightGray) > 50) { // 有明顯邊緣
                    outerLineCount++;
                }
            }
        }

        // 3. **綜合判定**：大幅提高核心深色像素的要求量 (從 80 提高到 200)
        // 確保中央必須有足夠多且足夠暗的像素 (鬍子)，且畫面有一定輪廓
        if (centerDarkCount > 200 && outerLineCount > 150) {
            blessing.style.display = 'block'; // 顯示祝福
        } else {
            blessing.style.display = 'none'; // 移開或未對準時隱藏
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