const video = document.getElementById('webcam');
const blessing = document.getElementById('blessing');
let useFrontCamera = true;

// 啟動手機/電腦相機
async function startCamera() {
    try {
        const constraints = {
            video: { facingMode: useFrontCamera ? 'user' : 'environment' }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    } catch (err) {
        console.error("無法開啟相機: ", err);
        alert("請允許網頁使用相機權限！");
    }
}

// 模擬辨識邏輯（在網頁上若要精準比對特定圖片，通常會使用圖片上傳比對或 Marker 追蹤）
// 這裡先提供基礎框架，您可以加入圖片比對演算法
video.addEventListener('play', () => {
    // 範例：當相機啟動後，提供一個按鈕或點擊畫面來模擬「對準後顯示祝福」
    // 實際專案中可結合 ml5.js 或 OpenCV.js 進行特徵比對
});

document.getElementById('toggleBtn').addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    startCamera();
});

// 點擊畫面測試顯示祝福語（實際部署時可換成自動辨識觸發）
video.addEventListener('click', () => {
    if (blessing.style.display === 'block') {
        blessing.style.display = 'none';
    } else {
        blessing.style.display = 'block';
    }
});

startCamera();