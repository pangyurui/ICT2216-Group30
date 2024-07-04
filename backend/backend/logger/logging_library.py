import os
from datetime import datetime, timedelta
import threading
import time

# Ensure the logs directory exists
LOG_DIR = './logs'
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Initialize the log file path
current_log_date = datetime.now().strftime('%Y-%m-%d')
log_filename = f'{current_log_date}.log'
log_filepath = os.path.join(LOG_DIR, log_filename)
log_file_index = 1
MAX_LOG_FILE_SIZE = 5 * 1024 * 1024  # 5MB for example


# Function to get the current log file path
def get_log_filepath():
    global log_filepath, current_log_date, log_file_index
    new_log_date = datetime.now().strftime('%Y-%m-%d')
    if new_log_date != current_log_date:
        current_log_date = new_log_date
        log_file_index = 1
        log_filename = f'{current_log_date}.log'
        log_filepath = os.path.join(LOG_DIR, log_filename)
    elif os.path.exists(log_filepath) and os.path.getsize(log_filepath) > MAX_LOG_FILE_SIZE:
        log_filename = f'{current_log_date}-{log_file_index}.log'
        log_filepath = os.path.join(LOG_DIR, log_filename)
        log_file_index += 1
    # Create a new log file if it doesn't exist
    if not os.path.exists(log_filepath):
        open(log_filepath, 'a').close()


# Initialize the log file handler
get_log_filepath()


# Function to update the log file handler at midnight
def update_log_file_handler():
    while True:
        now = datetime.now()
        next_day = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        sleep_time = (next_day - now).total_seconds()
        time.sleep(sleep_time)
        get_log_filepath()


# Start a thread to handle log file rotation
rotation_thread = threading.Thread(target=update_log_file_handler, daemon=True)
rotation_thread.start()


def get_ip_address(request):
    req_headers = request.META
    x_forwarded_for_value = req_headers.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for_value:
        ip_addr = x_forwarded_for_value.split(',')[-1].strip()
    else:
        ip_addr = req_headers.get('REMOTE_ADDR')
    return ip_addr


def log_message(message):
    # Ensure the log file exists and check for rotation
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
    get_log_filepath()
    with open(log_filepath, 'a') as log_file:
        log_file.write(message)


def log_access(request, response, page_name):
    level="INFO"
    ip_address = get_ip_address(request)
    access_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    response_status = response.status_code
    formatted_message = f'{access_time} {ip_address} [{level}] Page accessed: {page_name}, Response Status: {response_status}\n'
    log_message(formatted_message)


def log_access_register(request, page_name):
    level="INFO"
    ip_address = get_ip_address(request)
    access_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    formatted_message = f'{access_time} {ip_address} [{level}] Page accessed: {page_name}, Message: {request.data}\n'
    log_message(formatted_message)

def log_exception(request, exception):
    level = "Error"
    ip_address = get_ip_address(request)
    access_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    formatted_message = f'{access_time} {ip_address} [{level}] Exception occurred: {exception}\n'
    print(formatted_message)
    log_message(formatted_message)
