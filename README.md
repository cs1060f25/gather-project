**Gatherly**

# Gatherly - Meeting Preparation Tool

Gatherly is a web application that helps users prepare for meetings by providing relevant information about the people they're meeting with. This prototype demonstrates a feature that would integrate with LinkedIn to gather professional information and provide meeting preparation notes.

## Features

- Search for LinkedIn profiles (simulated with sample data)
- View detailed profile information
- Get meeting preparation notes
- Responsive design that works on desktop and mobile
- Clean, modern UI built with Tailwind CSS

## Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gatherly.git
   cd gatherly
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Generate sample LinkedIn profile data:
   ```bash
   python generate_data.py
   ```

### Running the Application

1. Start the Flask development server:
   ```bash
   python -m flask --app app run
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000/
   ```

## Project Structure

```
gatherly/
├── app/
│   ├── __init__.py          # Flask application factory
│   ├── static/              # Static files (CSS, JS, images)
│   │   ├── css/
│   │   └── js/
│   ├── templates/           # HTML templates
│   └── data/                # Data files (CSV with profile data)
├── generate_data.py         # Script to generate sample data
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## How It Works

1. The application uses a Flask backend to serve the web pages and handle API requests.
2. Sample LinkedIn profile data is stored in a CSV file and loaded into memory when the application starts.
3. Users can search for profiles by name, job title, or company.
4. The frontend is built with vanilla JavaScript and styled with Tailwind CSS for a responsive design.

## Future Enhancements

- Integrate with the LinkedIn API for real profile data
- Add user authentication
- Save meeting notes and preparation materials
- Add calendar integration
- Enable sharing of meeting preparation materials

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Flask](https://flask.palletsprojects.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

[Project Folder on Google Drive](https://drive.google.com/drive/folders/1wtmj0lfHxuVh9DfK9A5iHQziRVMTfHD-?usp=sharing)

Milan Naropanth, Talha Minhas, Ikenna Ogbogu
