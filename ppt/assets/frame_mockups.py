import os
from PIL import Image, ImageDraw, ImageFilter

screenshots_dir = "ppt/product/screenshots"
output_dir = "ppt/assets/illustrations"
os.makedirs(output_dir, exist_ok=True)

def create_phone_mockup(screenshot_path, output_path):
    # Target frame size: ~500 x 1020
    im = Image.open(screenshot_path).convert("RGBA")
    
    # Scale screenshot to fit inside phone screen
    screen_w = 420
    screen_h = int(im.height * (screen_w / im.width))
    im_scaled = im.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    # Crop if too tall
    max_h = 860
    if screen_h > max_h:
        im_scaled = im_scaled.crop((0, 0, screen_w, max_h))
        screen_h = max_h

    bezel = 16
    frame_w = screen_w + bezel * 2
    frame_h = screen_h + bezel * 2
    
    # Create phone body with rounded corners
    phone = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(phone)
    
    # Phone body (dark slate/navy frame)
    corner_r = 36
    draw.rounded_rectangle(
        [(0, 0), (frame_w - 1, frame_h - 1)],
        radius=corner_r,
        fill="#172B36",
        outline="#334E68",
        width=3
    )
    
    # Mask screenshot to rounded screen corners
    screen_mask = Image.new("L", (screen_w, screen_h), 0)
    screen_draw = ImageDraw.Draw(screen_mask)
    screen_draw.rounded_rectangle(
        [(0, 0), (screen_w - 1, screen_h - 1)],
        radius=20,
        fill=255
    )
    
    phone.paste(im_scaled, (bezel, bezel), screen_mask)
    
    # Dynamic Island / Camera pill at top
    pill_w, pill_h = 90, 18
    pill_x = (frame_w - pill_w) // 2
    pill_y = bezel + 8
    draw.rounded_rectangle(
        [(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
        radius=9,
        fill="#0A141A"
    )
    
    phone.save(output_path, "PNG")
    print(f"Phone mockup saved: {output_path}")

def create_laptop_mockup(screenshot_path, output_path, max_w=900):
    im = Image.open(screenshot_path).convert("RGBA")
    
    # Screen aspect ratio 16:10 / 16:9
    screen_w = max_w
    screen_h = int(im.height * (screen_w / im.width))
    im_scaled = im.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    top_bar_h = 28
    bezel = 10
    frame_w = screen_w + bezel * 2
    frame_h = screen_h + top_bar_h + bezel * 2
    
    laptop = Image.new("RGBA", (frame_w, frame_h + 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(laptop)
    
    # Bezel
    draw.rounded_rectangle(
        [(0, 0), (frame_w - 1, frame_h - 1)],
        radius=14,
        fill="#172B36",
        outline="#334E68",
        width=2
    )
    
    # Window controls (three dots)
    dot_y = bezel + top_bar_h // 2
    for i, color in enumerate(["#EF4444", "#F59E0B", "#10B981"]):
        draw.ellipse([(bezel + 14 + i * 16, dot_y - 4), (bezel + 22 + i * 16, dot_y + 4)], fill=color)
        
    # URL bar mockup
    draw.rounded_rectangle(
        [(bezel + 70, dot_y - 7), (frame_w - bezel - 70, dot_y + 7)],
        radius=4,
        fill="#233B47"
    )
    
    # Paste screenshot
    laptop.paste(im_scaled, (bezel, bezel + top_bar_h))
    
    # Laptop base notch
    base_w = frame_w + 30
    base_h = 10
    base_x = (frame_w - base_w) // 2
    draw.rounded_rectangle(
        [(base_x, frame_h - 2), (base_x + base_w, frame_h + base_h)],
        radius=4,
        fill="#475569",
        outline="#334E68",
        width=1
    )
    
    laptop.save(output_path, "PNG")
    print(f"Laptop mockup saved: {output_path}")

if __name__ == "__main__":
    # 1. Phone mockup
    phone_src = os.path.join(screenshots_dir, "10_mobile_citizen_wizard.png")
    if os.path.exists(phone_src):
        create_phone_mockup(phone_src, os.path.join(output_dir, "mockup_phone_wizard.png"))
        
    # 2. Laptop queue mockup
    queue_src = os.path.join(screenshots_dir, "04_authority_queue.png")
    if os.path.exists(queue_src):
        create_laptop_mockup(queue_src, os.path.join(output_dir, "mockup_laptop_queue.png"), max_w=840)
        
    # 3. Laptop map mockup
    map_src = os.path.join(screenshots_dir, "02_explore_map.png")
    if os.path.exists(map_src):
        create_laptop_mockup(map_src, os.path.join(output_dir, "mockup_laptop_map.png"), max_w=840)

