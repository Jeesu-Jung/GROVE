import streamlit as st
import pandas as pd
import random

# 페이지 제목 설정
st.title("Labeled Data Filtering")

# 세션 상태에서 데이터 가져오기
if "data" not in st.session_state or "input_column" not in st.session_state or "output_column" not in st.session_state:
    st.warning("No data found. Please complete the labeling process on the previous page.")
    st.stop()

# 세션 데이터 불러오기
df = pd.DataFrame(st.session_state["data"])
input_column = st.session_state["input_column"]
output_column = st.session_state["output_column"]

# 토픽과 태스크 컬럼이 있는지 확인
if "Topic" not in df.columns or "Task" not in df.columns:
    st.warning("Labeled data does not contain 'Topic' or 'Task' columns. Please check the labeling process.")
    st.stop()

# 필터링 방식 선택
st.sidebar.write("## Select Filtering Method")
filter_method = st.sidebar.selectbox("Choose a filtering method",
                                     ["Frequency-based Sampling", "Top-k Sampling", "Topic x Task Combination"])

# 필터링 결과를 저장할 데이터프레임
filtered_df = pd.DataFrame()

# 1. 빈도 기반 샘플링
if filter_method == "Frequency-based Sampling":
    st.write("### Frequency-based Sampling")

    # 샘플링 기준 선택
    sample_by = st.selectbox("Select the sampling criterion", ["Random", "Length-based", "Topic-based", "Task-based"])
    sample_ratio = st.slider("Select the proportion to sample (0.0 - 1.0)", min_value=0.1, max_value=1.0, value=0.2,
                             step=0.1)

    if sample_by == "Random":
        filtered_df = df.sample(frac=sample_ratio, random_state=42)
    elif sample_by == "Length-based":
        sentence_length = st.selectbox("Choose sentence length for sampling", ["Input Length", "Output Length"])
        length_column = "Input_Length" if sentence_length == "Input Length" else "Output_Length"
        if length_column not in df.columns:
            df["Input_Length"] = df[input_column].apply(lambda x: len(str(x).split()))
            df["Output_Length"] = df[output_column].apply(lambda x: len(str(x).split()))
        length_sorted_df = df.sort_values(by=length_column)
        filtered_df = length_sorted_df.head(int(len(df) * sample_ratio))
    elif sample_by == "Topic-based":
        topic = st.selectbox("Select a Topic", df["Topic"].unique())
        topic_df = df[df["Topic"] == topic]
        filtered_df = topic_df.sample(frac=sample_ratio, random_state=42)
    elif sample_by == "Task-based":
        task = st.selectbox("Select a Task", df["Task"].unique())
        task_df = df[df["Task"] == task]
        filtered_df = task_df.sample(frac=sample_ratio, random_state=42)

# 2. Top-k 샘플링
elif filter_method == "Top-k Sampling":
    st.write("### Top-k Sampling")
    top_k_criterion = st.selectbox("Select the criterion", ["Topic", "Task"])
    k = st.slider("Select the number of samples (k)", min_value=1, max_value=10, value=5)

    if top_k_criterion == "Topic":
        filtered_df = df.groupby("Topic").head(k)
    elif top_k_criterion == "Task":
        filtered_df = df.groupby("Task").head(k)

# 3. Topic x Task 조합
elif filter_method == "Topic x Task Combination":
    st.write("### Topic x Task Combination Filtering")
    selected_topic = st.selectbox("Select a Topic", df["Topic"].unique())
    selected_task = st.selectbox("Select a Task", df["Task"].unique())

    filtered_df = df[(df["Topic"] == selected_topic) & (df["Task"] == selected_task)]

# 필터링 결과 표시
st.write(f"### Filtered Data: {len(filtered_df)} rows")
st.write(filtered_df.head(10))

# 필터링된 데이터 다운로드 버튼
st.download_button(
    label="Download Filtered Data as Json",
    data=filtered_df.to_json(index=False, indent=4, orient='records'),
    file_name="filtered_labeled_data.json",
    mime="text/json"
)
