import os
from PIL import Image

images_dir = 'static/images'
for filename in os.listdir(images_dir):
    if filename.endswith('.jpg') or filename.endswith('.png'):
        base_name = os.path.splitext(filename)[0]
        input_path = os.path.join(images_dir, filename)
        output_path = os.path.join(images_dir, f"{base_name}.webp")
        
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if saving lossy webp or save directly
            if img.mode in ('RGBA', 'LA') and filename.endswith('.jpg'):
                img = img.convert('RGB')
            img.save(output_path, 'WEBP', quality=85, method=6)
            print(f"Converted {filename} -> {base_name}.webp ({os.path.getsize(output_path)} bytes)")
        
        # Remove original file
        os.remove(input_path)
        print(f"Removed original {filename}")

print("All images converted to WebP successfully!")
