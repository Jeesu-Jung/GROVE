import streamlit as st
import pandas as pd
import openai

# 세션에서 데이터와 컬럼명 가져오기
if "data" not in st.session_state or "input_column" not in st.session_state or not st.session_state["data"]:
    st.warning("No data found. Please go back to the Upload page and complete the process.")
    st.stop()

# 세션에서 불러온 데이터 변환
df = pd.DataFrame(st.session_state["data"])
input_column = st.session_state["input_column"]

# 데이터 미리보기
st.write(f"## Data Preview (Input Column: {input_column})")
st.write(df[[input_column]].head())  # 입력 컬럼만 미리보기

# OpenAI API Key 입력받기
openai_api_key = st.text_input("Enter your OpenAI API Key", type="password")
if openai_api_key:
    from openai import OpenAI
    openai.api_key = openai_api_key
    client = OpenAI(api_key=openai_api_key)


# GPT-4 라벨링 함수 정의
def gpt4_labeling(text):
    # 도서 총류 000-999 기반 주제 라벨 정의
    topic_labels = ["Computer Science, Information & General Works",
                    "Philosophy & Psychology",
                    "Religion",
                    "Social Sciences",
                    "Language",
                    "Science",
                    "Technology",
                    "Arts & Recreation",
                    "Literature",
                    "History & Geography"]
    # NLP 작업 유형 라벨 정의
    task_labels = ["Linguistic Analysis",
                   "Text Classification",
                   "Information Extraction",
                   "Creative Generation",
                   "Transformative Generation",
                   "Information Retrieval",
                   "Question Answering",
                   "Translation"]

    messages = [
        {"role": "system", "content": "You are a helpful assistant that labels text data."},
        {"role": "user", "content": f"Given the following text: '{text}', classify it into a topic and a task.\n\n"
                                    f"Available Topics: Computer Science, Information & General Works, "
                                    f"Philosophy & Psychology, Religion, Social Sciences, Language, Science, Technology, "
                                    f"Arts & Recreation, Literature, History & Geography.\n\n"
                                    f"Available Tasks: Linguistic Analysis, Text Classification, Information Extraction, "
                                    f"Creative Generation, Transformative Generation, Information Retrieval, "
                                    f"Question Answering, Translation.\n\n"
                                    "Respond with the format:\nTopic: <One of the Topics>\nTask: <One of the Tasks>"}
    ]
    response = client.chat.completions.create(
        model="gpt-4-turbo",  # 또는 "gpt-3.5-turbo" 사용 가능
        messages=messages,
        max_tokens=150,
        temperature=0.3
    )

    # 응답에서 Topic과 Task 추출
    output = response.choices[0].message.content.strip().split("\n")
    topic = output[0].replace("Topic: ", "").strip()
    task = output[1].replace("Task: ", "").strip()
    return topic, task


# 라벨링 작업 수행하기
if st.button("Start Labelling"):
    # 로딩 바 및 스피너 생성
    progress_bar = st.progress(0)
    total_data = len(df)
    topics, tasks = [], []

    # 각 데이터포인트에 대해 GPT-4를 사용하여 라벨링 수행
    for i, text in enumerate(df[input_column]):
        topic, task = gpt4_labeling(str(text))
        topics.append(topic)
        tasks.append(task)

        # 진행 상태 업데이트
        progress = (i + 1) / total_data
        progress_bar.progress(progress)

    # 라벨링 결과를 데이터프레임에 추가
    df["Topic"] = topics
    df["Task"] = tasks
    st.session_state["data"] = df

    st.success("Labelling completed successfully!")
    st.write(df[[input_column, "Topic", "Task"]].head(10))

    # 라벨링 결과를 JSON 파일로 다운로드할 수 있도록 설정
    st.download_button(
        label="Download Labeled Data as JSON",
        data=df.to_json(orient="records", indent=4),
        file_name="gpt4_labeled_data.json",
        mime="application/json"
    )
