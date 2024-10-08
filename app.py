import streamlit as st

# 초기 페이지 설정
st.sidebar.title("Data Selection Tool Navigation")
page = st.sidebar.radio("Choose a page", ["Upload", "Labeling", "Visualization", "Filtering"])

# 페이지 선택에 따라 각 파일 불러오기
if page == "Upload":
    exec(open("pages/1_upload.py", encoding="utf-8").read())
elif page == "Labeling":
    exec(open("pages/2_labeling.py", encoding="utf-8").read())
elif page == "Visualization":
    exec(open("pages/3_visualization.py", encoding="utf-8").read())
elif page == "Filtering":
    exec(open("pages/4_filtering.py", encoding="utf-8").read())
