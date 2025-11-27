# Gatherly - Event Scheduler

A web application for scheduling events and collecting availability from participants.

## Features

- Create events with multiple time slots
- Share event links with participants
- Real-time response tracking
- Clean, responsive UI

## Prerequisites

- Python 3.8+
- MySQL Server
- Node.js (for development)

## Setup

1. **Clone the repository**

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up the database**
   - Create a new MySQL database
   - Update the `.env` file with your database credentials

5. **Run database migrations**
   ```bash
   flask db upgrade
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Access the application**
   - Open `http://localhost:5000` in your browser

## Project Structure

- `app.py` - Main application file
- `config.py` - Configuration settings
- `models.py` - Database models
- `templates/` - HTML templates
  - `base.html` - Base template
  - `create_event.html` - Event creation form
  - `event.html` - Event view and response form
- `static/` - Static files (CSS, JS, images)
- `.env` - Environment variables (not version controlled)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=gatherly_events

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
