import torch
import torch.nn.functional as F
from torchvision import transforms

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2
import io
import os
from PIL import Image
from datetime import datetime
from emotion_model import EfficientEmotion
from db_config import get_connection
import traceback

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

# 장치 설정
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model =EfficientEmotion().to(device)
model.load_state_dict(torch.load('best_ferplus_emotion_model_efficient_surprise_focus.pth',map_location=device))
model.eval()

face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
class_labels = ['angry', 'happy', 'neutral', 'sad', 'surprize']
analysis_start_times = {}  # 콘텐츠별 분석 시작 시각 저장용

# ----------------------------- 콘텐츠 등록 -----------------------------
@app.route('/add_content', methods=['POST'])
def add_content():
    try:
        data = request.form
        file = request.files['poster']
        upload_dir = os.path.join('static', 'images')
        os.makedirs(upload_dir, exist_ok=True)
        filename = datetime.now().strftime('%Y%m%d%H%M%S_') + file.filename
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        poster_url = f'static/images/{filename}'
        name = data.get('name')
        year = int(data.get('release_year'))
        distributor = data.get('distributor')
        genre = data.get('genre')
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO contents (name, release_year, distributor, genre, poster_url)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, year, distributor, genre, poster_url))
            conn.commit()
            cursor.execute("SELECT LAST_INSERT_ID() as id")
            content_id = cursor.fetchone()['id']
        create_emotion_tables(content_id)
        return jsonify({'status': 'success', 'content_id': content_id}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ----------------------------- 감정 분석 시작 시각 등록 -----------------------------
@app.route('/start_analysis/<int:content_id>', methods=['POST'])
def start_analysis(content_id):
    analysis_start_times[content_id] = datetime.now()
    print(f"[감정 분석 시작] 콘텐츠 {content_id} → 기준 시각: {analysis_start_times[content_id]}")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 시청자 수 증가
            cursor.execute("""
                UPDATE contents SET viewer_count = viewer_count + 1 WHERE id = %s
            """, (content_id,))
        conn.commit()
    finally:
        conn.close()

    return jsonify({'status': 'started'})

# ----------------------------- 콘텐츠별 감정 테이블 생성 -----------------------------
def create_emotion_tables(content_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS emotions_{content_id} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    emotion VARCHAR(20),
                    timestamp VARCHAR(20)
                )
            """)
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS top_emotion_{content_id} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    emotion VARCHAR(20),
                    count INT,
                    percentage FLOAT,
                    start_time VARCHAR(20),
                    end_time VARCHAR(20)
                )
            """)
        conn.commit()
        print(f"[DB 테이블 생성 완료] emotions_{content_id}, top_emotion_{content_id}")
    finally:
        conn.close()

# ----------------------------- 콘텐츠 목록 -----------------------------
@app.route('/contents', methods=['GET'])
def get_contents():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM contents")
            contents = cursor.fetchall()
        return jsonify(contents)
    finally:
        conn.close()

# ----------------------------- 콘텐츠 상세 -----------------------------
@app.route('/content/<int:content_id>', methods=['GET'])
def get_content(content_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM contents WHERE id = %s", (content_id,))
            content = cursor.fetchone()
        if content:
            return jsonify(content)
        else:
            return jsonify({'error': 'Content not found'}), 404
    finally:
        conn.close()

# ----------------------------- 콘텐츠 삭제 -----------------------------
@app.route('/content/<int:content_id>', methods=['DELETE'])
def delete_content(content_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM contents WHERE id = %s", (content_id,))
            cursor.execute(f"DROP TABLE IF EXISTS emotions_{content_id}")
            cursor.execute(f"DROP TABLE IF EXISTS top_emotion_{content_id}")
            conn.commit()
        return jsonify({'status': 'deleted'})
    finally:
        conn.close()

# ----------------------------- 설문 저장 API -----------------------------
@app.route('/survey', methods=['POST'])
def submit_survey():
    data = request.json
    content_id = data.get('content_id')
    gender = data.get('gender')
    age_group = data.get('age_group')

    if not all([content_id, gender, age_group]):
        return jsonify({'error': '필수 항목이 누락되었습니다.'}), 400

    conn = get_connection()
    cursor = conn.cursor()
    sql = "INSERT INTO survey (content_id, gender, age_group) VALUES (%s, %s, %s)"
    cursor.execute(sql, (content_id, gender, age_group))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': '설문 응답이 저장되었습니다.'}), 200

# ----------------------------- 콘텐츠별 설문 데이터 조회 -----------------------------
@app.route('/survey/<int:content_id>', methods=['GET'])
def get_survey_results(content_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT gender, age_group, COUNT(*) AS count
        FROM survey
        WHERE content_id = %s
        GROUP BY gender, age_group
    """
    cursor.execute(sql, (content_id,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(results)

# ----------------------------- 감정 분석 -----------------------------
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    base64_img = data.get('image')
    content_id = data.get('content_id')
    emotion = analyze_emotion(base64_img)

    if emotion != "no_face" and emotion != "error":
        start_time = analysis_start_times.get(content_id)
        if not start_time:
            print("[오류] 감정 분석 시작 시점 없음")
            return jsonify({'emotion': 'error', 'message': '분석 시작 안 됨'}), 400

        elapsed = datetime.now() - start_time
        timestamp = str(elapsed).split('.')[0]

        save_emotion_to_db(content_id, emotion, timestamp)
        update_top_emotion(content_id)
        print(f"[감정 분석 완료] 감정: {emotion}, 시간: {timestamp}")
    else:
        print("[감정 분석 실패 또는 오류]")

    return jsonify({'emotion': emotion})

# ----------------------------- 감정 분석 함수 -----------------------------
def analyze_emotion(base64_image):
    try:
        image_data = base64.b64decode(base64_image.split(',')[1])
        image = Image.open(io.BytesIO(image_data)).convert('L')  # 흑백
        img_np = np.array(image)

        faces = face_cascade.detectMultiScale(img_np, 1.3, 5)
        if len(faces) == 0:
            print("[감정 분석 실패] 얼굴 인식 안됨")
            return "no_face"

        (x, y, w, h) = faces[0]
        face = img_np[y:y+h, x:x+w]
        face_resized = cv2.resize(face, (48, 48)) / 255.0
        face_tensor = torch.tensor(face_resized, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)

        # PyTorch 추론
        model.eval()
        with torch.no_grad():
            output = model(face_tensor)
            probs = F.softmax(output, dim=1)
            pred_idx = torch.argmax(probs, dim=1).item()
            label = class_labels[pred_idx]

        print(f"[감정 분석 결과] {label}")
        return label

    except Exception as e:
        print("[감정 분석 중 오류 발생]", e)
        return "error"

# ----------------------------- 감정 DB 저장 -----------------------------
def save_emotion_to_db(content_id, emotion, timestamp):
    table = f"emotions_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = f"INSERT INTO {table} (emotion, timestamp) VALUES (%s, %s)"
            cursor.execute(sql, (emotion, timestamp))
        conn.commit()
        print(f"[DB 저장 성공] 감정: {emotion}, 시간: {timestamp}")
    except Exception as e:
        print("[DB 저장 실패]", e)
    finally:
        conn.close()

# ----------------------------- Top Emotion 저장 -----------------------------
def update_top_emotion(content_id):
    table_e = f"emotions_{content_id}"
    table_top = f"top_emotion_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT emotion
                FROM {table_e}
                GROUP BY emotion
                ORDER BY COUNT(*) DESC
                LIMIT 1;
            """)
            result = cursor.fetchone()
            if not result:
                return
            top_emotion = result['emotion']

            cursor.execute(f"""
                SELECT emotion, timestamp
                FROM {table_e}
                ORDER BY timestamp ASC;
            """)
            rows = cursor.fetchall()

            segments = []
            current_emotion = None
            start_time = None
            prev_time = None

            for row in rows:
                emotion = row['emotion']
                timestamp = row['timestamp']

                if emotion == top_emotion:
                    if current_emotion != top_emotion:
                        start_time = timestamp
                    current_emotion = top_emotion
                    prev_time = timestamp
                else:
                    if current_emotion == top_emotion and start_time and prev_time:
                        segments.append((start_time, prev_time))
                        start_time = None
                    current_emotion = emotion

            if current_emotion == top_emotion and start_time and prev_time:
                segments.append((start_time, prev_time))

            cursor.execute(f"SELECT COUNT(*) FROM {table_e}")
            total_count = cursor.fetchone()['COUNT(*)']

            cursor.execute(f"SELECT COUNT(*) FROM {table_e} WHERE emotion = %s", (top_emotion,))
            top_count = cursor.fetchone()['COUNT(*)']

            percentage = round(top_count / total_count * 100, 1)

            cursor.execute(f"SELECT MAX(count) FROM {table_top}")
            result = cursor.fetchone()
            max_count = result['MAX(count)'] if result['MAX(count)'] is not None else 0

            if top_count > max_count:
                for seg_start, seg_end in segments:
                    cursor.execute(f"""
                        INSERT INTO {table_top} (emotion, count, percentage, start_time, end_time)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        top_emotion,
                        top_count,
                        percentage,
                        str(seg_start),
                        str(seg_end)
                    ))
                conn.commit()
                print(f"[top_emotion 저장 완료] 콘텐츠 {content_id}, 감정 {top_emotion}, {len(segments)}개 구간 저장")
            else:
                print(f"[top_emotion 생략] count 증가 없음 for content {content_id}")
    except Exception as e:
        print("[top_emotion 저장 오류]", e)
    finally:
        conn.close()

# ----------------------------- 감정 최근 기록 -----------------------------
@app.route('/emotions/<int:content_id>', methods=['GET'])
def get_emotions(content_id):
    table = f"emotions_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT emotion, timestamp
                FROM {table}
                ORDER BY id DESC
            """)
            rows = cursor.fetchall()
        return jsonify(rows)
    finally:
        conn.close()


# ----------------------------- 최신 Top 감정 1개 -----------------------------
@app.route('/top_emotion/<int:content_id>', methods=['GET'])
def get_latest_top_emotion(content_id):
    table = f"top_emotion_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT emotion, count, percentage, start_time, end_time
                FROM {table} ORDER BY id DESC LIMIT 1
            """)
            result = cursor.fetchone()
        return jsonify(result if result else {})
    finally:
        conn.close()

# ----------------------------- 서버 실행 -----------------------------
if __name__ == '__main__':
    print("[서버 시작됨]")
    app.run(host='0.0.0.0', port=5000)