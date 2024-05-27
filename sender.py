import requests
import json
url = 'http://localhost:5000/update'
import plotly.graph_objects as go

# Sample data
x_data = [1, 2, 3, 4, 5]
y_data = [10, 11, 12, 13, 14]

# Create a trace
trace = go.Scatter(x=x_data, y=y_data, mode='markers+lines', name='Sample Data')

# Create layout
layout = go.Layout(title='Sample Plot', xaxis=dict(title='X-axis'), yaxis=dict(title='Y-axis'))

# Create figure
fig = go.Figure(data=[trace], layout=layout)

# Show plot

data = {"data": fig.to_json(), "command": "setActivePlot"}
response = requests.post(url, json=data)
if response.status_code == 200:
    print ("Data sent successfully")
else:
    print("Failed to send data")

