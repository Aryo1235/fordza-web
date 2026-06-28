import json
import random
import time

def make_id():
    return str(int(time.time())) + str(random.randint(1000, 9999))

elements = []

def add_rect(x, y, w, h, stroke_color, bg_color, is_dashed=False, id=None):
    rect_id = id if id else "rect_" + make_id()
    elements.append({
        "id": rect_id,
        "type": "rectangle",
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "angle": 0,
        "strokeColor": stroke_color,
        "backgroundColor": bg_color,
        "fillStyle": "solid" if bg_color != "transparent" else "transparent",
        "strokeWidth": 1.5,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "seed": random.randint(1, 100000),
        "version": 1,
        "versionNonce": random.randint(1, 100000),
        "isDeleted": False,
        "boundElements": None,
        "updated": int(time.time() * 1000),
        "link": None,
        "locked": False
    })
    return rect_id

def add_text(x, y, w, h, text, size=12, color="#000000", align="center", id=None):
    text_id = id if id else "text_" + make_id()
    elements.append({
        "id": text_id,
        "type": "text",
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "angle": 0,
        "strokeColor": color,
        "backgroundColor": "transparent",
        "fillStyle": "hachure",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "seed": random.randint(1, 100000),
        "version": 1,
        "versionNonce": random.randint(1, 100000),
        "isDeleted": False,
        "boundElements": None,
        "updated": int(time.time() * 1000),
        "link": None,
        "locked": False,
        "text": text,
        "fontSize": size,
        "fontFamily": 5,
        "textAlign": align,
        "verticalAlign": "middle"
    })
    return text_id

def add_line(start_x, start_y, points, stroke_color="#000000"):
    elements.append({
        "id": "line_" + make_id(),
        "type": "line",
        "x": start_x,
        "y": start_y,
        "width": abs(points[-1][0]),
        "height": abs(points[-1][1]),
        "angle": 0,
        "strokeColor": stroke_color,
        "backgroundColor": "transparent",
        "fillStyle": "hachure",
        "strokeWidth": 1.5,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "seed": random.randint(1, 100000),
        "version": 1,
        "versionNonce": random.randint(1, 100000),
        "isDeleted": False,
        "boundElements": None,
        "updated": int(time.time() * 1000),
        "points": points
    })

def add_3d_box(x, y, w, h, stroke_color, bg_color, d=12, id_prefix="box3d"):
    # 1. Front face
    front_id = add_rect(x, y, w, h, stroke_color, bg_color, id=f"{id_prefix}_front")
    
    # 2. Slanted depth edges
    add_line(x, y, [[0, 0], [d, -d]], stroke_color)
    add_line(x + w, y, [[0, 0], [d, -d]], stroke_color)
    add_line(x + w, y + h, [[0, 0], [d, -d]], stroke_color)
    
    # 3. Back edges
    add_line(x + d, y - d, [[0, 0], [w, 0]], stroke_color)
    add_line(x + w + d, y - d, [[0, 0], [0, h]], stroke_color)
    
    return front_id

def add_artifact(x, y, w, h, title, stroke_color="#2b2b2b", bg_color="#ffffff"):
    # 1. Main flat rectangle
    rect_id = add_rect(x, y, w, h, stroke_color, bg_color)
    
    # 2. Tiny document icon in the top-right corner of the rectangle
    icon_x = x + w - 22
    icon_y = y + 8
    icon_w = 12
    icon_h = 15
    
    # Draw document outline
    add_line(icon_x, icon_y, [[0, 0], [icon_w - 4, 0], [icon_w, 4], [icon_w, icon_h], [0, icon_h], [0, 0]], stroke_color)
    # The fold line
    add_line(icon_x + icon_w - 4, icon_y, [[0, 0], [0, 4], [4, 4]], stroke_color)
    
    # 3. Label text inside the artifact
    add_text(x + 5, y + 5, w - 30, h - 10, title, size=12, color=stroke_color)
    
    return rect_id

def add_connection(start_x, start_y, points, label=None, stroke_color="#495057"):
    conn_id = "conn_" + make_id()
    elements.append({
        "id": conn_id,
        "type": "line",
        "x": start_x,
        "y": start_y,
        "width": abs(points[-1][0]),
        "height": abs(points[-1][1]),
        "angle": 0,
        "strokeColor": stroke_color,
        "backgroundColor": "transparent",
        "fillStyle": "hachure",
        "strokeWidth": 1.5,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "seed": random.randint(1, 100000),
        "version": 1,
        "versionNonce": random.randint(1, 100000),
        "isDeleted": False,
        "boundElements": None,
        "updated": int(time.time() * 1000),
        "points": points
    })
    
    if label:
        mid_x = start_x + (points[-1][0]) / 2 - 50
        mid_y = start_y + (points[-1][1]) / 2 - 12
        add_text(mid_x, mid_y, 100, 20, label, size=11, color=stroke_color)
        
    return conn_id

# Title
add_text(250, 40, 700, 30, "dd Deployment of Components", size=20, color="#3c3025", align="left")

# Outer Nodes (Devices) - Styled in soft beige/cream
device_stroke = "#3c3025"
device_bg = "#fef4e8"

# Inner Nodes (Execution Environments) - Styled in white
env_stroke = "#8a7060"
env_bg = "#ffffff"

# Artifacts - Styled in light gray
art_stroke = "#2b2b2b"
art_bg = "#f8f9fa"

# 1. Device: Client Device
add_3d_box(60, 180, 260, 240, device_stroke, device_bg, d=12, id_prefix="client_device")
add_text(60, 185, 260, 40, "«device»\n:Client Device", size=13, color=device_stroke)

# Inner: Web Browser
add_3d_box(80, 235, 220, 160, env_stroke, env_bg, d=8, id_prefix="web_browser")
add_text(80, 240, 220, 40, "«execution environment»\n:Web Browser", size=11, color=env_stroke)

# Artifact in Client Browser
add_artifact(100, 295, 180, 80, "«artifact»\n:FordzaWebClient\n[Frontend UI & POS]", art_stroke, art_bg)


# 2. Device: Vercel Server
add_3d_box(380, 180, 280, 240, device_stroke, device_bg, d=12, id_prefix="vercel_server")
add_text(380, 185, 280, 40, "«device»\n:Vercel Server", size=13, color=device_stroke)

# Inner: Next.js Runtime
add_3d_box(400, 235, 240, 160, env_stroke, env_bg, d=8, id_prefix="nextjs_env")
add_text(400, 240, 240, 40, "«execution environment»\n:Next.js Engine\n(Node.js Runtime)", size=11, color=env_stroke)

# Artifact
add_artifact(420, 295, 200, 80, "«artifact»\n:FordzaWebApp\n[Static CDN & API]", art_stroke, art_bg)


# 3. Device: Supabase Server
add_3d_box(720, 180, 260, 200, device_stroke, device_bg, d=12, id_prefix="supabase_server")
add_text(720, 185, 260, 40, "«device»\n:Supabase Server", size=13, color=device_stroke)

# Artifact
add_artifact(750, 245, 200, 110, "«artifact»\n:fordza-bucket\n[Supabase Storage\nObject Database]", art_stroke, art_bg)


# 4. Device: Neon Server
add_3d_box(720, 420, 260, 200, device_stroke, device_bg, d=12, id_prefix="neon_server")
add_text(720, 425, 260, 40, "«device»\n:Neon Server", size=13, color=device_stroke)

# Artifact
add_artifact(750, 485, 200, 110, "«artifact»\n:PostgreSQL_DB\n[Core Tables &\nSales Analytics]", art_stroke, art_bg)



# Connections between physical nodes (solid lines without arrowheads)
# 1. Client Device to Vercel Server
add_connection(320, 300, [[0, 0], [60, 0]], "HTTPS")

# 2. Vercel Server to Supabase Server
add_connection(660, 280, [[0, 0], [60, 0]], "HTTPS")

# 3. Vercel Server to Neon Database Server (slanted connect)
add_connection(660, 320, [[0, 0], [60, 160]], "TCP/IP")

# 4. Client Device to Supabase Server (fetching images)
# High horizontal link looping above Vercel
add_connection(190, 180, [[0, 0], [0, -35], [660, -35], [660, 0]], "GET Images")

# Final Excalidraw JSON Structure
excalidraw_data = {
    "type": "excalidraw",
    "version": 2,
    "source": "https://excalidraw.com",
    "elements": elements,
    "appState": {
        "viewBackgroundColor": "#ffffff",
        "gridSize": 20
    },
    "files": {}
}

with open("e:/fordza-web/docs/deployment-diagram.excalidraw", "w") as f:
    json.dump(excalidraw_data, f, indent=2)

print("UML deployment diagram generated successfully at e:/fordza-web/docs/deployment-diagram.excalidraw!")
