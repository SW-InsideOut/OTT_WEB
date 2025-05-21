from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2
import io
from PIL import Image
from datetime import datetime
from tensorflow.keras.models import load_model
from db_config import get_connection

app = Flask(__name__)
CORS(app)

model = load_model('best_model_local8.h5')
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
class_labels = ['angry', 'happy', 'neutral', 'sad', 'surprize']
analysis_start_time = datetime.now()

# ----------------------------- 콘텐츠 등록 -----------------------------
@app.route('/add_content', methods=['POST'])
def add_content():
    try:
        data = request.form
        file = request.files['poster']

        filename = datetime.now().strftime('%Y%m%d%H%M%S_') + file.filename
        file_path = f'static/images/{filename}'
        file.save(file_path)

        name = data.get('name')
        year = int(data.get('year'))
        distributor = data.get('distributor')
        genres = data.get('genres')

        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO contents (name, year, distributor, genres, poster_url)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, year, distributor, genres, file_path))
            conn.commit()

            cursor.execute("SELECT LAST_INSERT_ID() as id")
            content_id = cursor.fetchone()['id']
        return jsonify({'status': 'success', 'content_id': content_id}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
            conn.commit()
        return jsonify({'status': 'deleted'})
    finally:
        conn.close()


# ----------------------------- 감정 분석 -----------------------------
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    base64_img = data.get('image')
    content_id = data.get('content_id')
    emotion = analyze_emotion(base64_img)

    if emotion != "no_face" and emotion != "error":
        elapsed = datetime.now() - analysis_start_time
        timestamp = str(elapsed).split('.')[0]  # HH:MM:SS

        save_emotion_to_db(content_id, emotion, timestamp)
        update_top_emotion(content_id)

    return jsonify({'emotion': emotion})

def analyze_emotion(base64_image):
    try:
        image_data = base64.b64decode(base64_image.split(',')[1])
        image = Image.open(io.BytesIO(image_data)).convert('L')
        img_np = np.array(image)
        faces = face_cascade.detectMultiScale(img_np, 1.3, 5)

        if len(faces) == 0:
            return "no_face"

        (x, y, w, h) = faces[0]
        face = img_np[y:y+h, x:x+w]
        face_resized = cv2.resize(face, (48, 48)) / 255.0
        face_reshaped = np.expand_dims(face_resized, axis=(0, -1))

        prediction = model.predict(face_reshaped, verbose=0)
        return class_labels[np.argmax(prediction)]
    except:
        return "error"

def save_emotion_to_db(content_id, emotion, timestamp):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO emotions (content_id, emotion, timestamp) VALUES (%s, %s, %s)"
            cursor.execute(sql, (content_id, emotion, timestamp))
        conn.commit()
    finally:
        conn.close()

# ----------------------------- Top Emotion 콘텐츠별 저장 -----------------------------
def update_top_emotion(content_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT emotion
                FROM emotions
                WHERE content_id = %s
                GROUP BY emotion
                ORDER BY COUNT(*) DESC
                LIMIT 1;
            """, (content_id,))
            result = cursor.fetchone()
            if not result:
                return

            top_emotion = result['emotion']

            cursor.execute("""
                SELECT emotion, timestamp
                FROM emotions
                WHERE content_id = %s
                ORDER BY timestamp ASC;
            """, (content_id,))
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

            cursor.execute("SELECT COUNT(*) FROM emotions WHERE content_id = %s", (content_id,))
            total_count = cursor.fetchone()['COUNT(*)']

            cursor.execute("SELECT COUNT(*) FROM emotions WHERE content_id = %s AND emotion = %s", (content_id, top_emotion))
            top_count = cursor.fetchone()['COUNT(*)']

            percentage = round(top_count / total_count * 100, 1)

            cursor.execute("SELECT MAX(count) FROM top_emotion WHERE content_id = %s", (content_id,))
            result = cursor.fetchone()
            max_count = result['MAX(count)'] if result['MAX(count)'] is not None else 0

            if top_count > max_count:
                for seg_start, seg_end in segments:
                    insert_sql = """
                        INSERT INTO top_emotion (content_id, emotion, count, percentage, start_time, end_time)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(insert_sql, (
                        content_id,
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

# ----------------------------- 서버 실행 -----------------------------
if __name__ == '__main__':
    print("[서버 시작 시각]", analysis_start_time.strftime('%Y-%m-%d %H:%M:%S'))
    app.run(host='0.0.0.0', port=5000)
