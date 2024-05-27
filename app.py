from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/update', methods=['POST'])
def update_state():
    data = request.json
    socketio.emit('update', data)
    return jsonify(success=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, use_reloader=True, log_output=True)
