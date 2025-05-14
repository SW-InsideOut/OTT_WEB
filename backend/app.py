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

# 서버 시작 기준 시각
analysis_start_time = datetime.now()


# 감정 저장 함수
def save_emotion_to_db(emotion, timestamp):
    print(f"[저장 시도] 감정: {emotion}, 시간: {timestamp}")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO emotions (emotion, timestamp) VALUES (%s, %s)"
            cursor.execute(sql, (emotion, timestamp))
        conn.commit()
        print("[DB 저장 성공]")
    except Exception as e:
        print("[DB 저장 실패]", e)
    finally:
        conn.close()


# 감정 분석 함수
def analyze_emotion(base64_image):
    try:
        image_data = base64.b64decode(base64_image.split(',')[1])
        image = Image.open(io.BytesIO(image_data)).convert('L')
        img_np = np.array(image)
        faces = face_cascade.detectMultiScale(img_np, 1.3, 5)

        if len(faces) == 0:
            print("[감정 분석 실패] 얼굴 인식 안됨")
            return "no_face"

        (x, y, w, h) = faces[0]
        face = img_np[y:y+h, x:x+w]
        face_resized = cv2.resize(face, (48, 48)) / 255.0
        face_reshaped = np.expand_dims(face_resized, axis=(0, -1))

        prediction = model.predict(face_reshaped, verbose=0)
        label = class_labels[np.argmax(prediction)]
        print(f"[감정 분석 결과] {label}")
        return label
    except Exception as e:
        print("[감정 분석 중 오류 발생]", e)
        return "error"


# top_emotion 업데이트 함수
def update_top_emotion():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 현재 가장 많이 등장한 감정 구하기
            cursor.execute("""
                SELECT emotion
                FROM emotions
                GROUP BY emotion
                ORDER BY COUNT(*) DESC
                LIMIT 1;
            """)
            result = cursor.fetchone()
            if not result:
                return

            top_emotion = result['emotion']

            # 감정 기록 시간순 조회
            cursor.execute("""
                SELECT emotion, timestamp
                FROM emotions
                ORDER BY timestamp ASC;
            """)
            rows = cursor.fetchall()

            # 연속된 구간 찾기
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

            # top 감정 count 및 전체 대비 비율 계산
            cursor.execute("SELECT COUNT(*) AS total FROM emotions")
            total_count = cursor.fetchone()['total']

            cursor.execute("SELECT COUNT(*) AS top_total FROM emotions WHERE emotion = %s", (top_emotion,))
            top_count = cursor.fetchone()['top_total']

            percentage = round(top_count / total_count * 100, 1)

            # 현재 top_emotion 테이블에 저장된 가장 높은 count 가져오기
            cursor.execute("SELECT MAX(count) AS max_count FROM top_emotion")
            result = cursor.fetchone()
            max_count = result['max_count'] if result['max_count'] is not None else 0

            # top_count가 더 클 때만 저장
            if top_count > max_count:
                for seg_start, seg_end in segments:
                    insert_sql = """
                        INSERT INTO top_emotion (emotion, count, percentage, start_time, end_time)
                        VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(insert_sql, (
                        top_emotion,
                        top_count,
                        percentage,
                        str(seg_start),
                        str(seg_end)
                    ))
                conn.commit()
                print(f"[top_emotion 저장 완료] count 증가 ({max_count} → {top_count}), {len(segments)}개 구간 저장됨")
            else:
                print("[top_emotion 저장 생략] count 변화 없음")

    except Exception as e:
        print("[top_emotion 저장 오류]", e)
    finally:
        conn.close()


# 감정 예측 API
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    base64_img = data.get('image')
    emotion = analyze_emotion(base64_img)

    if emotion != "no_face" and emotion != "error":
        elapsed = datetime.now() - analysis_start_time
        timestamp = str(elapsed).split('.')[0]  # HH:MM:SS 형식

        save_emotion_to_db(emotion, timestamp)
        update_top_emotion()

    return jsonify({'emotion': emotion})


# 서버 실행
if __name__ == '__main__':
    print("[서버 시작 시각]", analysis_start_time.strftime('%Y-%m-%d %H:%M:%S'))
    app.run(host='0.0.0.0', port=5000)
