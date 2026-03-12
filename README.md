# 딥러닝 기반 OTT 콘텐츠 시청자의 실시간 감정 변화 추적 시스템

## 프로젝트 포스터
![프로젝트 포스터](./docs/poster.png)



---

## 1. 프로젝트 개요
숏폼/OTT 콘텐츠 소비가 증가하면서, 장면 단위의 시청자 반응을 정량적으로 파악하는 수요가 커지고 있습니다.  
본 프로젝트는 **웹캠 기반 얼굴 표정 분석**으로 시청 중 감정 변화를 추적하고, 이를 **시각적으로 기록**하여 서비스 개선 및 개인화 추천에 활용할 수 있도록 설계했습니다.

- 학과: 소프트웨어학부
- 팀장: 임예윤
- 팀원: 변해정, 신가람, 임예윤
- 역할 분담:
  - 변해정: 프론트엔드 개발
  - 신가람: 백엔드 개발
  - 임예윤: AI 개발


## 2. 개발 동기
- 숏폼 성장으로 OTT 장면 콘텐츠의 중요성 확대
- 시청자 감정의 실시간 반응 데이터 필요
- 감정 기반 마케팅/추천 전략을 위한 근거 데이터 확보

## 3. 작품 설명
- 콘텐츠 시청 중 사용자의 감정을 실시간으로 분석
- 시간 축 기반 감정 변화(예: happy/sad/angry 등)를 로그로 기록
- 웹 UI에서 감정 결과를 확인해 직관적으로 해석 가능

## 4. 개발 환경
- **Frontend**: React
- **Backend**: Flask (Python)
- **Web**: HTML / JavaScript / CSS
- **DB**: MySQL
- **딥러닝 프레임워크**: PyTorch

## 5. 데이터셋
본 프로젝트 감정 인식 모델 학습에 다음 데이터셋을 사용했습니다.

- **FER+**
- **KDEF**

> 출처: Kaggle, KDEF(kdef.se)

## 6. AI 모델
최종 감정 인식 모델은 **EfficientNet 기반 모델**을 채택했습니다.

- 실험 비교: 병합 전 CNN 모델 → 병합 후 CNN 모델 → ResNet → **EfficientNet(최종)**
- 최종 선택 근거: 비교 모델 중 가장 높은 검증 정확도 달성
- 적용 방식: 학습된 모델을 백엔드에서 로드하여 웹캠 프레임 단위로 감정 추론

### 모델 성능 요약
- 병합 전 CNN 모델: Validation Accuracy 약 40%
- 병합 후 CNN 모델: Validation Accuracy 약 62%
- ResNet: Validation Accuracy 약 65%
- **EfficientNet: Validation Accuracy 약 80% (최종 모델)**

## 7. 주요 기능
- 사용자 등록 및 조회
- 콘텐츠 목록/상세 조회
- 웹캠 기반 얼굴 감정 분석
- 감정 분석 결과 시계열 기록 및 표시

## 8. 실행 방법
### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 9. 기대 효과
- 개인 맞춤형 추천 시스템의 보조 신호로 활용
- 감정 반응 기반 콘텐츠 기획/제작 지원 도구로 확장 가능

## 10. 한계 및 향후 개선
- 표정 기반 분석만으로는 복합 감정 반영에 한계 존재
- 음성/텍스트/시청 맥락 멀티모달 결합으로 고도화 필요
- 다양한 조명/각도/가림 환경에서의 강건성 개선 필요

---

### 저장소 구조
```bash
OTT_WEB/
├── backend/      # Flask API, 모델 추론 코드, 학습 가중치
├── frontend/     # React 클라이언트
├── docs/         # 포스터/문서 이미지
└── README.md
```
