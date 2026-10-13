import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def put_chinese_text(img, text, position, text_color, text_size):
    """使用 PIL 在 OpenCV 影像上繪製中文字體，避免亂碼"""
    img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)
    try:
        font = ImageFont.truetype("msjh.ttc", text_size)
    except IOError:
        try:
            font = ImageFont.truetype("Arial Unicode.ttf", text_size)
        except IOError:
            font = ImageFont.load_default()
            
    draw.text(position, text, font=font, fill=text_color)
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

def main():
    # 1. 讀取目標圖片 (玄天上帝圖片)
    target_img_path = 'XuanTian.png'
    target_img = cv2.imread(target_img_path, cv2.IMREAD_GRAYSCALE)
    
    if target_img is None:
        print(f"錯誤：找不到目標圖片 {target_img_path}，請確認檔案是否在同一個資料夾下！")
        return

    # 2. 初始化 ORB 特徵點偵測器
    orb = cv2.ORB_create(nfeatures=1000)
    kp_target, des_target = orb.detectAndCompute(target_img, None)

    if des_target is None or len(des_target) < 10:
        print("錯誤：目標圖片的特徵點不足，請換一張更清晰的照片！")
        return

    # 3. 設定 FLANN 匹配器 (針對 ORB 二進位特徵使用 LSH 演算法)
    FLANN_INDEX_LSH = 6
    index_params = dict(algorithm=FLANN_INDEX_LSH,
                        table_number=6,    # 12
                        key_size=12,       # 20
                        multi_probe_level=1)
    search_params = dict(checks=50)
    
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    # 4. 開啟相機
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("錯誤：無法開啟相機！")
        return

    print("相機已啟動！請將相機對準玄天上帝圖片... 按下 'q' 鍵即可退出程式。")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("無法讀取相機畫面")
            break

        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        kp_frame, des_frame = orb.detectAndCompute(gray_frame, None)

        display_frame = frame.copy()
        is_matched = False

        if des_frame is not None and len(des_frame) > 10:
            # 進行 KNN 匹配 (k=2)
            matches = flann.knnMatch(des_target, des_frame, k=2)

            # 使用 Lowe's ratio test 篩選出高品質的匹配點
            good_matches = []
            for m_n in matches:
                if len(m_n) == 2:
                    m, n = m_n
                    if m.distance < 0.75 * n.distance:
                        good_matches.append(m)

            # 提高觸發門檻（例如必須有 25 個以上的高品質特徵點符合才算數）
            if len(good_matches) > 25:
                src_pts = np.float32([kp_target[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
                dst_pts = np.float32([kp_frame[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
                
                if len(src_pts) >= 4:
                    matrix, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
                    if mask is not None:
                        inliers_count = np.sum(mask)
                        # 額外透過 RANSAC 內點數量（真正符合透視變換的點）來嚴格把關
                        if inliers_count > 15:
                            is_matched = True
                            # 繪製追蹤框
                            h, w = target_img.shape
                            pts = np.float32([[0, 0], [0, h-1], [w-1, h-1], [w-1, 0]]).reshape(-1, 1, 2)
                            dst = cv2.perspectiveTransform(pts, matrix)
                            display_frame = cv2.polylines(display_frame, [np.int32(dst)], True, (0, 255, 0), 3)

        # 只有在確實辨識到圖片時才顯示祝福語
        if is_matched:
            display_frame = put_chinese_text(
                display_frame, 
                "玄天上帝保佑你一切順利平安", 
                (40, 40), 
                (0, 255, 0),  
                32            
            )

        # 顯示即時畫面
        cv2.imshow('XuanTian Blessing Detector', display_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()