import streamlit as st
import json

# 페이지 제목 설정
st.title("Data Upload and Column Selection")

# 세션 상태 초기화
if "input_column" not in st.session_state:
    st.session_state["input_column"] = ""
if "output_column" not in st.session_state:
    st.session_state["output_column"] = ""
if "data" not in st.session_state:
    st.session_state["data"] = None

# JSON 파일 업로드 기능
uploaded_file = st.file_uploader("Upload your JSON file", type=["json"])

if uploaded_file is not None:
    try:
        # 파일의 내용을 JSON 형식으로 파싱하고 세션에 데이터 저장
        data = json.load(uploaded_file)
        st.session_state["data"] = data
        st.success("File uploaded successfully!")

        # 업로드된 JSON 데이터 미리보기
        st.write("Preview of the JSON data:")
        st.json(data)

        # 입력/출력 컬럼 설정
        input_column = st.text_input("Enter the Input Column Name", value=st.session_state["input_column"])
        output_column = st.text_input("Enter the Output Column Name", value=st.session_state["output_column"])

        if input_column:
            st.session_state["input_column"] = input_column
        if output_column:
            st.session_state["output_column"] = output_column

        # 입력된 컬럼명을 확인하고 출력
        if st.button("Confirm Columns"):
            if input_column and output_column:
                st.write(f"Input Column: `{input_column}`, Output Column: `{output_column}`")
                st.success("Columns have been set successfully!")
            else:
                st.warning("Please enter both Input and Output column names.")

        # 데이터가 세션 상태에 존재하고 컬럼도 설정되었으면 다음 페이지 이동 버튼 생성
        if st.session_state["data"] is not None and st.session_state["input_column"] and st.session_state["output_column"]:
            st.write("Data and columns have been set. You can proceed to the next page.")
    except json.JSONDecodeError:
        st.error("Invalid JSON file. Please upload a valid JSON file.")
else:
    st.info("Please upload a JSON file to get started.")
