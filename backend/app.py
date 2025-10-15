import torch
import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64, numpy as np, cv2, io, os, traceback
from PIL import Image
from datetime import datetime
from emotion_model import EfficientEmotion
from db_config import get_connection

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

# ------------------- 모델 및 전역 변수 -------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = EfficientEmotion().to(device)
model.load_state_dict(torch.load('best_ferplus_emotion_model_efficient_surprise_focus.pth',
                                 map_location=device))
model.eval()

face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
class_labels = ['angry', 'happy', 'neutral', 'sad', 'surprize']

analysis_start_times = {}       # 콘텐츠별 분석 시작 시각
last_emotion_per_content = {}   # 마지막 저장 감정

# ---------------------------------------------------------
# 1. 콘텐츠 등록 : contents 테이블 + 동적 감정 테이블 생성
# ---------------------------------------------------------
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

# ---------------------------------------------------------
# 2. 분석 시작 : viewer_count 증가 + 기준 시각 저장
# ---------------------------------------------------------
@app.route('/start_analysis/<int:content_id>', methods=['POST'])
def start_analysis(content_id):
    analysis_start_times[content_id] = datetime.now()
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE contents SET viewer_count = viewer_count + 1 WHERE id = %s",
                           (content_id,))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'status': 'started'})

# ---------------------------------------------------------
# 3. 동적 감정 테이블 생성
# ---------------------------------------------------------
def create_emotion_tables(content_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS emotions_{content_id} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
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
    finally:
        conn.close()

# ---------------------------------------------------------
# 4. 콘텐츠 목록/상세/삭제
# ---------------------------------------------------------
@app.route('/contents', methods=['GET'])
def get_contents():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM contents")
            return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/content/<int:content_id>', methods=['GET'])
def get_content(content_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM contents WHERE id = %s", (content_id,))
            content = cursor.fetchone()
        return jsonify(content if content else {'error': 'Not found'}), 200
    finally:
        conn.close()

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

# ---------------------------------------------------------
# 5. 사용자(User) 설문 등록 및 통계
#    (기존 survey → users 로 전환)
# ---------------------------------------------------------
@app.route('/users', methods=['POST'])
def add_user():
    data = request.json
    content_id = data.get('content_id')
    gender = data.get('gender')
    age_group = data.get('age_group')
    if not all([content_id, gender, age_group]):
        return jsonify({'error': '필수 항목 누락'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (content_id, gender, age_group)
                VALUES (%s, %s, %s)
            """, (content_id, gender, age_group))
            conn.commit()

            cursor.execute("SELECT LAST_INSERT_ID() AS user_id")
            row = cursor.fetchone()
            new_id = row['user_id'] if row else None

        return jsonify({'user_id': new_id}), 200
    finally:
        conn.close()


@app.route('/users/stats/<int:content_id>', methods=['GET'])
def user_stats(content_id):
    """
    콘텐츠별 최다 성별/연령대 집계
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT gender, COUNT(*) as cnt
                FROM users
                WHERE content_id = %s
                GROUP BY gender
                ORDER BY cnt DESC
                LIMIT 1
            """, (content_id,))
            g = cursor.fetchone()

            cursor.execute("""
                SELECT age_group, COUNT(*) as cnt
                FROM users
                WHERE content_id = %s
                GROUP BY age_group
                ORDER BY cnt DESC
                LIMIT 1
            """, (content_id,))
            a = cursor.fetchone()
        return jsonify({
            'most_gender': g['gender'] if g else None,
            'most_age_group': a['age_group'] if a else None
        })
    finally:
        conn.close()

# ---------------------------------------------------------
# 6. 감정 분석 (예측 및 DB 저장)
# ---------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    base64_img = data.get('image')
    content_id = data.get('content_id')
    user_id    = data.get('user_id') 

    if user_id is None:
        return jsonify({'error': 'user_id missing'}), 400 

    emotion = analyze_emotion(base64_img)

    if emotion not in ("no_face", "error"):
        start_time = analysis_start_times.get(content_id)
        if not start_time:
            return jsonify({'emotion': 'error', 'message': '분석 시작 안 됨'}), 400
        elapsed = datetime.now() - start_time
        timestamp = str(elapsed).split('.')[0]
        save_emotion_to_db(content_id, user_id, emotion, timestamp)
        update_top_emotion(content_id)

        return jsonify({'emotion': emotion, 'timestamp': timestamp})

    return jsonify({'emotion': emotion})

def analyze_emotion(base64_image):
    try:
        img_data = base64.b64decode(base64_image.split(',')[1])
        image = Image.open(io.BytesIO(img_data)).convert('L')
        img_np = np.array(image)
        faces = face_cascade.detectMultiScale(img_np, 1.3, 5)
        if len(faces) == 0:
            return "no_face"
        x, y, w, h = faces[0]
        face = cv2.resize(img_np[y:y+h, x:x+w], (48, 48)) / 255.0
        face_tensor = torch.tensor(face, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
        with torch.no_grad():
            output = model(face_tensor)
            pred = torch.argmax(F.softmax(output, dim=1), dim=1).item()
        return class_labels[pred]
    except Exception:
        return "error"

def save_emotion_to_db(content_id, user_id, emotion, timestamp):
    table = f"emotions_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO {table} (user_id, emotion, timestamp) VALUES (%s, %s, %s)",
                (user_id, emotion, timestamp)
            )
        conn.commit()
    finally:
        conn.close()

def update_top_emotion(content_id):
    t_e = f"emotions_{content_id}"
    t_t = f"top_emotion_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT emotion
                FROM {t_e}
                GROUP BY emotion
                ORDER BY COUNT(*) DESC
                LIMIT 1
            """)
            top = cursor.fetchone()
            if not top: return
            top_emo = top['emotion']
            cursor.execute(f"SELECT emotion, timestamp FROM {t_e} ORDER BY timestamp ASC")
            rows = cursor.fetchall()

            segments, cur, start, prev = [], None, None, None
            for r in rows:
                e, ts = r['emotion'], r['timestamp']
                if e == top_emo:
                    if cur != top_emo:
                        start = ts
                    cur, prev = top_emo, ts
                else:
                    if cur == top_emo and start and prev:
                        segments.append((start, prev))
                        start = None
                    cur = e
            if cur == top_emo and start and prev:
                segments.append((start, prev))

            cursor.execute(f"SELECT COUNT(*) FROM {t_e}")
            total = cursor.fetchone()['COUNT(*)']
            cursor.execute(f"SELECT COUNT(*) FROM {t_e} WHERE emotion=%s", (top_emo,))
            top_cnt = cursor.fetchone()['COUNT(*)']
            perc = round(top_cnt / total * 100, 1)

            cursor.execute(f"SELECT MAX(count) FROM {t_t}")
            max_cnt = cursor.fetchone()['MAX(count)'] or 0
            if top_cnt > max_cnt:
                for s, e in segments:
                    cursor.execute(f"""
                        INSERT INTO {t_t} (emotion, count, percentage, start_time, end_time)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (top_emo, top_cnt, perc, s, e))
                conn.commit()
    finally:
        conn.close()

@app.route('/emotions/<int:content_id>', methods=['GET'])
def get_emotions(content_id):
    table = f"emotions_{content_id}"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT emotion, timestamp FROM {table} ORDER BY id DESC")
            return jsonify(cursor.fetchall())
    finally:
        conn.close()

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

# ---------------------------------------------------------
# 7. 서버 실행
# ---------------------------------------------------------
if __name__ == '__main__':
    print("[서버 시작됨]")
    app.run(host='0.0.0.0', port=5000)
