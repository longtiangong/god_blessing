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

function analyzeFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const w = canvas.width;
        const h = canvas.height;

        let veryDarkPixels = 0; // 極深色像素（如鬍子）
        let veryBrightPixels = 0; // 極亮色像素（如冠冕）

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const gray = (r * 0.299 + g * 0.587 + b * 0.114);

            // 統計畫面中極黑與極亮的比例（玄天上帝圖片同時具備極亮的冠冕與極黑的鬍子/陰影）
            if (gray < 40) {
                veryDarkPixels++;
            } else if (gray > 210) {
                veryBrightPixels++;
            }
        }

        // 必須同時出現大量的極亮區塊與極暗區塊（一般房間背景或木紋無法同時滿足這兩個極端條件）
        if (veryDarkPixels > 300 && veryBrightPixels > 400) {
            blessing.style.display = 'block'; // 顯示祝福
        } else {
            blessing.style.display = 'none'; // 未對準時強制隱藏
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