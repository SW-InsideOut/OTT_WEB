from flask import Flask, request, jsonify
from flask_cors import CORS  # CORS 허용 추가
import base64
import numpy as np
import cv2
import io
import time
import pymysql
from PIL import Image
from tensorflow.keras.models import load_model
from db_config import get_connection

app = Flask(__name__)
CORS(app)  # 모든 출처 허용

model = load_model('best_model_local8.h5')
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
class_labels = ['angry', 'happy', 'neutral', 'sad', 'surprize']

def save_emotion_to_db(emotion, timestamp):
    print(f"[저장 시도] 감정: {emotion}, 시간: {timestamp}")  # 저장 시도 로그
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO emotions (emotion, timestamp) VALUES (%s, %s)"
            cursor.execute(sql, (emotion, timestamp))
        conn.commit()
        print("[DB 저장 성공]")  # 성공 로그
    except Exception as e:
        print("[DB 저장 실패]", e)  # 실패 시 오류 출력
    finally:
        conn.close()

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

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    base64_img = data.get('image')
    emotion = analyze_emotion(base64_img)

    if emotion != "no_face" and emotion != "error":
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        save_emotion_to_db(emotion, timestamp)

    return jsonify({'emotion': emotion})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
