import subprocess
import os
import signal
import sys

def signal_handler(sig, frame):
    print('Stopping Docker Compose...')
    subprocess.call(['docker', 'compose', 'down'])
    print('Stopping Flask and Scrapyrt...')
    flask_process.terminate()
    scrapyrt_process.terminate()
    sys.exit(0)

def main():
    os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
    global flask_process, scrapyrt_process
    flask_process = subprocess.Popen(['flask', 'run'])
    scrapyrt_process = subprocess.Popen(['scrapyrt'])
    docker_compose_process = subprocess.Popen(['docker', 'compose', 'up', '-d'])

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    flask_process.wait()
    scrapyrt_process.wait()
    docker_compose_process.wait()

if __name__ == '__main__':
    main()
