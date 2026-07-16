import collections
from PIL import Image

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def blend_colors(color1_rgb, color2_rgb, weight):
    """
    weight is a float between 0 and 1.
    weight=1 means 100% color1, weight=0 means 100% color2.
    """
    r = int(color1_rgb[0] * weight + color2_rgb[0] * (1 - weight))
    g = int(color1_rgb[1] * weight + color2_rgb[1] * (1 - weight))
    b = int(color1_rgb[2] * weight + color2_rgb[2] * (1 - weight))
    return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))

def get_contrast_color(hex_str):
    """
    WCAG accessibility check. Returns white for dark backgrounds and dark slate for light ones.
    """
    rgb = hex_to_rgb(hex_str)
    # Calculate relative luminance using the formula
    y = (299 * rgb[0] + 587 * rgb[1] + 114 * rgb[2]) / 1000
    return "#ffffff" if y < 140 else "#0f172a"

def extract_colors_from_image(image_path, num_colors=8):
    """
    Extract dominant colors from an image path using PIL.
    Filters out transparent pixels and monochrome (white, black, gray) pixels where possible
    to find vibrant brand colors.
    """
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        
        # Resize to speed up extraction and smooth noise
        img.thumbnail((150, 150))
        
        pixels = list(img.getdata())
        
        color_counts = collections.Counter()
        for r, g, b, a in pixels:
            # Skip transparent pixels
            if a < 128:
                continue
            color_counts[(r, g, b)] += 1
            
        if not color_counts:
            # Fallback colors if image is transparent
            return ["#1e40af", "#0f766e", "#3b82f6"]
            
        unique_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
        
        def is_monochrome(r, g, b):
            max_val = max(r, g, b)
            min_val = min(r, g, b)
            # Grayish if difference between channels is small
            if max_val - min_val < 30:
                return True
            # Blackish
            if max_val < 40:
                return True
            # Whiteish
            if min_val > 220:
                return True
            return False

        extracted = []
        # Pass 1: Try to find colorful dominant colors
        for rgb, count in unique_colors:
            r, g, b = rgb
            if not is_monochrome(r, g, b):
                too_similar = False
                for r2, g2, b2 in extracted:
                    dist = ((r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2) ** 0.5
                    if dist < 45: # Similarity threshold
                        too_similar = True
                        break
                if not too_similar:
                    extracted.append(rgb)
                    if len(extracted) >= num_colors:
                        break
                        
        # Pass 2: If we don't have enough colors, allow monochrome colors
        if len(extracted) < num_colors:
            for rgb, count in unique_colors:
                r, g, b = rgb
                too_similar = False
                for r2, g2, b2 in extracted:
                    dist = ((r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2) ** 0.5
                    if dist < 30:
                        too_similar = True
                        break
                if not too_similar:
                    extracted.append(rgb)
                    if len(extracted) >= num_colors:
                        break
                        
        # Return as hex list
        return [rgb_to_hex(rgb) for rgb in extracted]
    except Exception as e:
        print(f"Error in color extraction: {e}")
        # Default fallbacks
        return ["#1e40af", "#0f766e", "#3b82f6"]

def generate_shades(base_hex):
    """
    Generate tints (50-400) and shades (600-900) for a color.
    """
    base_rgb = hex_to_rgb(base_hex)
    white = (255, 255, 255)
    black = (0, 0, 0)
    
    return {
        "50": rgb_to_hex(blend_colors(base_rgb, white, 0.08)),
        "100": rgb_to_hex(blend_colors(base_rgb, white, 0.20)),
        "200": rgb_to_hex(blend_colors(base_rgb, white, 0.40)),
        "300": rgb_to_hex(blend_colors(base_rgb, white, 0.60)),
        "400": rgb_to_hex(blend_colors(base_rgb, white, 0.80)),
        "500": base_hex,
        "600": rgb_to_hex(blend_colors(base_rgb, black, 0.82)),
        "700": rgb_to_hex(blend_colors(base_rgb, black, 0.68)),
        "800": rgb_to_hex(blend_colors(base_rgb, black, 0.52)),
        "900": rgb_to_hex(blend_colors(base_rgb, black, 0.36)),
    }

def generate_theme_json(company_name, logo_url, favicon_url, primary, secondary, accent=None):
    """
    Generates a full Light and Dark theme schema based on primary, secondary, and accent colors.
    """
    # 1. Resolve colors
    if not accent:
        # Default accent to a bright version of primary or a standard light blue
        accent = "#3b82f6"
        
    primary_shades = generate_shades(primary)
    secondary_shades = generate_shades(secondary)
    
    # 2. Base static states
    success = "#16a34a"  # standard accessible green
    warning = "#d97706"  # standard accessible orange
    error = "#dc2626"    # standard accessible red
    info = "#0284c7"     # standard accessible sky blue
    
    # 3. Create theme structures
    # A helper to compile a palette section
    def compile_palette(mode):
        is_dark = (mode == "dark")
        
        primary_main = primary_shades["400"] if is_dark else primary
        secondary_main = secondary_shades["400"] if is_dark else secondary
        
        # Shades are flipped or customized for dark mode
        p_shades = primary_shades
        s_shades = secondary_shades
        
        if is_dark:
            # We want slightly darker defaults, but glassmorphic tints
            # background default is very dark slate tinted with primary
            bg_default = rgb_to_hex(blend_colors(hex_to_rgb(primary), (13, 17, 23), 0.05))
            bg_paper = rgb_to_hex(blend_colors(hex_to_rgb(primary), (21, 27, 38), 0.08))
            card_bg = rgb_to_hex(blend_colors(hex_to_rgb(primary), (28, 36, 51), 0.10))
            input_bg = rgb_to_hex(blend_colors(hex_to_rgb(primary), (22, 28, 39), 0.06))
            
            text_primary = "#f8fafc"
            text_secondary = "#cbd5e1"
            text_disabled = "#64748b"
            
            border_main = "#2d3748"
            border_light = "#1e293b" # divider
            
            # Button states
            primary_hover = p_shades["300"]
            primary_active = p_shades["200"]
            primary_disabled = "#1e293b"
            
            secondary_hover = s_shades["300"]
            secondary_active = s_shades["200"]
            secondary_disabled = "#1e293b"
            
            # Sidebar states
            sidebar_bg = rgb_to_hex(blend_colors(hex_to_rgb(primary), (10, 14, 20), 0.04))
            sidebar_border = "#1a2230"
            sidebar_text = "#94a3b8"
            sidebar_text_active = "#ffffff"
            sidebar_bg_active = p_shades["900"]
            sidebar_bg_hover = "rgba(255, 255, 255, 0.03)"
            
            # Navbar states
            navbar_bg = "rgba(13, 17, 23, 0.85)"
            navbar_border = "#1a2230"
            navbar_text = "#ffffff"
        else:
            # Light mode
            bg_default = "#f8fafc"
            bg_paper = "#ffffff"
            card_bg = "#ffffff"
            input_bg = "#ffffff"
            
            text_primary = "#0f172a"
            text_secondary = "#475569"
            text_disabled = "#94a3b8"
            
            border_main = "#cbd5e1"
            border_light = "#e2e8f0" # divider
            
            # Button states
            primary_hover = p_shades["600"]
            primary_active = p_shades["700"]
            primary_disabled = "#cbd5e1"
            
            secondary_hover = s_shades["600"]
            secondary_active = s_shades["700"]
            secondary_disabled = "#cbd5e1"
            
            # Sidebar states
            sidebar_bg = "#ffffff"
            sidebar_border = "#e5e7eb"
            sidebar_text = "#475569"
            sidebar_text_active = p_shades["800"]
            sidebar_bg_active = p_shades["50"]
            sidebar_bg_hover = "#f8fafc"
            
            # Navbar states
            navbar_bg = "rgba(255, 255, 255, 0.94)"
            navbar_border = "#e5e7eb"
            navbar_text = "#0f172a"
            
        return {
            "mode": mode,
            "primary": {
                "main": primary_main,
                "light": p_shades["300"] if is_dark else p_shades["400"],
                "dark": p_shades["700"] if is_dark else p_shades["600"],
                "contrastText": get_contrast_color(primary_main),
                "shades": p_shades,
                "hover": primary_hover,
                "active": primary_active,
                "disabled": primary_disabled,
            },
            "secondary": {
                "main": secondary_main,
                "light": s_shades["300"] if is_dark else s_shades["400"],
                "dark": s_shades["700"] if is_dark else s_shades["600"],
                "contrastText": get_contrast_color(secondary_main),
                "shades": s_shades,
                "hover": secondary_hover,
                "active": secondary_active,
                "disabled": secondary_disabled,
            },
            "accent": {
                "main": accent,
                "contrastText": get_contrast_color(accent),
                "hover": rgb_to_hex(blend_colors(hex_to_rgb(accent), (0,0,0), 0.85)) if not is_dark else rgb_to_hex(blend_colors(hex_to_rgb(accent), (255,255,255), 0.85)),
            },
            "success": {
                "main": success,
                "contrastText": "#ffffff",
            },
            "warning": {
                "main": warning,
                "contrastText": "#ffffff",
            },
            "error": {
                "main": error,
                "contrastText": "#ffffff",
            },
            "info": {
                "main": info,
                "contrastText": "#ffffff",
            },
            "background": {
                "default": bg_default,
                "paper": bg_paper,
                "card": card_bg,
                "input": input_bg,
            },
            "text": {
                "primary": text_primary,
                "secondary": text_secondary,
                "disabled": text_disabled,
            },
            "border": {
                "main": border_main,
                "light": border_light,
            },
            "sidebar": {
                "background": sidebar_bg,
                "border": sidebar_border,
                "text": sidebar_text,
                "textActive": sidebar_text_active,
                "bgActive": sidebar_bg_active,
                "bgHover": sidebar_bg_hover,
            },
            "navbar": {
                "background": navbar_bg,
                "border": navbar_border,
                "text": navbar_text,
            },
            "charts": [
                primary_main,
                secondary_main,
                accent,
                success,
                warning,
                "#8b5cf6", # purple
                "#ec4899", # pink
                "#f59e0b"  # amber
            ]
        }
        
    return {
        "company_name": company_name,
        "logo_url": logo_url,
        "favicon_url": favicon_url,
        "primary_color": primary,
        "secondary_color": secondary,
        "accent_color": accent,
        "light": compile_palette("light"),
        "dark": compile_palette("dark"),
    }
