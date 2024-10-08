import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

# 페이지 제목
st.title("Labeled Data Visualization")

# 세션 상태에서 라벨링된 데이터 가져오기
if "data" not in st.session_state or "input_column" not in st.session_state or "output_column" not in st.session_state:
    st.warning("No data found. Please complete the labeling process on the previous page.")
    st.stop()

# 세션 데이터 불러오기
df = pd.DataFrame(st.session_state["data"])
input_column = st.session_state["input_column"]
output_column = st.session_state["output_column"]

# 토픽과 태스크 컬럼이 없는 경우 경고
if "Topic" not in df.columns or "Task" not in df.columns:
    st.warning("Labeled data does not contain 'Topic' or 'Task' columns. Please check the labeling process.")
    st.stop()

# 1. 입력 문장 길이 분포
st.write("### 1. Input Sentence Length Distribution")
df["Input_Length"] = df[input_column].apply(lambda x: len(str(x).split()))
plt.figure(figsize=(10, 6))
plt.hist(df["Input_Length"], bins=30, color='skyblue', edgecolor='black')
plt.title("Input Sentence Length Distribution")
plt.xlabel("Sentence Length")
plt.ylabel("Frequency")
st.pyplot(plt.gcf())  # 그래프 출력

# 2. 출력 문장 길이 분포
st.write("### 2. Output Sentence Length Distribution")
df["Output_Length"] = df[output_column].apply(lambda x: len(str(x).split()))
plt.figure(figsize=(10, 6))
plt.hist(df["Output_Length"], bins=30, color='lightgreen', edgecolor='black')
plt.title("Output Sentence Length Distribution")
plt.xlabel("Sentence Length")
plt.ylabel("Frequency")
st.pyplot(plt.gcf())  # 그래프 출력

# 3. Topic 별 빈도
st.write("### 3. Topic Frequency Distribution")
topic_counts = df["Topic"].value_counts()
plt.figure(figsize=(12, 6))
topic_counts.plot(kind='bar', color='coral')
plt.title("Topic Frequency Distribution")
plt.xlabel("Topic")
plt.ylabel("Frequency")
plt.xticks(rotation=45, ha="right")
st.pyplot(plt.gcf())  # 그래프 출력

# 4. Task 별 빈도
st.write("### 4. Task Frequency Distribution")
task_counts = df["Task"].value_counts()
plt.figure(figsize=(12, 6))
task_counts.plot(kind='bar', color='lightblue')
plt.title("Task Frequency Distribution")
plt.xlabel("Task")
plt.ylabel("Frequency")
plt.xticks(rotation=45, ha="right")
st.pyplot(plt.gcf())  # 그래프 출력

# 데이터 다운로드 버튼 제공
st.write("### Download Processed Data")
st.download_button(
    label="Download Labeled Data as CSV",
    data=df.to_csv(index=False),
    file_name="labeled_data_visualization.csv",
    mime="text/csv"
)
