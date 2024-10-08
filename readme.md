# Data Selection and Labeling Tool

## 📋 Overview
This project is a **Streamlit-based data selection and labeling tool** designed to help users upload, label, visualize, and filter textual data using various sampling methods. The tool integrates with the **OpenAI GPT-4 model** to automatically label data based on predefined **topic** and **task categories**.

The tool is divided into four main pages:
1. **Data Upload**: Upload your JSON data file and define input/output columns.
2. **Data Labeling**: Use GPT-4 to automatically label the data with specific `Topic` and `Task` labels.
3. **Data Visualization**: Visualize labeled data through different distribution and frequency charts.
4. **Data Filtering**: Filter labeled data based on frequency, top-k sampling, and topic-task combinations.

## 🔧 Features
### Data Upload (`1_upload.py`)
- Allows users to upload a JSON file.
- Users can specify the **input** and **output** columns for further processing.

### Data Labeling (`2_labeling.py`)
- Automatically labels the uploaded data using **OpenAI's GPT-4**.
- Provides predefined `Topic` and `Task` labels for consistent classification.

### Data Visualization (`3_visualization.py`)
- Visualizes the labeled data using **four types of bar plots**:
  1. **Input sentence length distribution**
  2. **Output sentence length distribution**
  3. **Topic frequency distribution**
  4. **Task frequency distribution**

### Data Filtering (`4_filtering.py`)
- Supports various filtering and sampling techniques:
  1. **Frequency-based sampling**: Random, length-based, topic/task-based.
  2. **Top-k sampling**: Extracts top-k examples per `Topic` or `Task`.
  3. **Topic x Task combinations**: Filter data based on specific combinations of `Topic` and `Task`.

## 🚀 Requirements
To run this project, you need the following Python packages:

- **Streamlit** (latest version)
- **pandas**
- **openai**
- **matplotlib**

Install the required libraries using:

```bash
pip install streamlit pandas openai matplotlib
```

You will also need an **OpenAI API key** to use the labeling functionality. Get your API key from [OpenAI](https://platform.openai.com/account/api-keys) and provide it in the Data Labeling page when prompted.

## 📂 Project Structure
The project is divided into the following files:

```
project_directory/
├── app.py                    # Main Streamlit file for page navigation
├── requirements.txt          # Required packages for the project
└── pages/
    ├── 1_upload.py           # Data Upload Page
    ├── 2_labeling.py         # Data Labeling Page
    ├── 3_visualization.py    # Data Visualization Page
    └── 4_filtering.py        # Data Filtering Page
```

## 📊 How to Run
1. **Clone** the repository to your local machine.
2. **Navigate** to the project directory.
3. **Run** the Streamlit application using the command:

```bash
streamlit run app.py
```

4. Open the **localhost URL** provided by Streamlit in your browser.
5. Use the **sidebar** to navigate through the different pages.

## 💡 Usage Guide
1. **Upload your Data**: Start with the **Data Upload** page to upload your JSON file and define the input and output columns.
2. **Label your Data**: Move to the **Data Labeling** page and run the automatic labeling process using your OpenAI API key.
3. **Visualize your Data**: Analyze the labeled data through various distribution and frequency charts in the **Data Visualization** page.
4. **Filter your Data**: Filter and sample your data based on various criteria in the **Data Filtering** page.
5. **Download the Data**: Download the filtered or labeled data in JSON or CSV format using the provided download buttons.

## 🧩 Example Labels
The tool uses predefined **Topic** and **Task** labels for consistent labeling. Below are the categories:

**Topic Labels**:
- Computer Science, Information & General Works
- Philosophy & Psychology
- Religion
- Social Sciences
- Language
- Science
- Technology
- Arts & Recreation
- Literature
- History & Geography

**Task Labels**:
- Linguistic Analysis
- Text Classification
- Information Extraction
- Creative Generation
- Transformative Generation
- Information Retrieval
- Question Answering
- Translation

## 📝 Future Extensions
- **Enhanced Labeling Options**: Add more customizable labeling options.
- **Additional Filtering Methods**: Introduce advanced filtering methods like custom regex-based filtering.
- **Interactive Visualizations**: Replace static plots with interactive ones using Plotly.

## ✨ Contribution
Feel free to fork this repository and create a pull request with any improvements or bug fixes.

## 🛠️ Troubleshooting
If you encounter any issues, check the following:

- Ensure you have a valid **OpenAI API key** for the labeling functionality.
- Make sure all required Python packages are installed (`requirements.txt`).
- Verify that your JSON file is properly formatted.

For further assistance, please create an issue in the repository or reach out to the project owner.

## 🙌 Acknowledgements
Special thanks to the OpenAI team for providing the powerful GPT models that make this tool possible.
