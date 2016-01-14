from __future__ import division
import json

data = []

# Load data
with open('html/data.csv') as f:
    lines = f.readlines()
    lines = map(lambda s: s.strip(), lines)
    lines = map(lambda s: s.split(','), lines)

    headers = lines[0]

    lines = map(lambda lst: map(lambda v: v if ' ' in v else float(v), lst), lines[1:])

    for row in lines:
        data.append(dict(zip(headers, row)))

# Discretize
step_size = 2
x_steps = int(105 / step_size + 0.5)
y_steps = int(68 / step_size + 0.5)

result = []

for tag_id in range(16):
    grid = [[0 for y in range(y_steps)] for x in range(x_steps)]
    qnt = [[0 for y in range(y_steps)] for x in range(x_steps)]

    for datum in data:
        x = int(datum['x_pos'] / step_size)
        y = int(datum['y_pos'] / step_size)

        if x >= 0 and y >= 0 and x < x_steps and y < y_steps and (datum['tag_id'] == tag_id or tag_id == 0):
            grid[x][y] += datum['speed']
            qnt[x][y] += 1

    # Average
    for x in range(x_steps):
        for y in range(y_steps):
            grid[x][y] /= qnt[x][y] if qnt[x][y] > 0 else 1

    # Normalize
    max_value = max(map(max, grid))
    if max_value != 0:
        grid = map(lambda r: map(lambda v: v / max_value, r), grid)

    result.append(grid)

# Export
with open('html/heatmaps/speed.json', 'w') as f:
    json.dump(result, f)