def format_hours_to_hours_minutes(hours_decimal):
    """Convert a decimal number of hours into 'Xh Ym' string format."""
    if not hours_decimal:
        return "0h 0m"
    hours = int(hours_decimal)
    minutes = int((hours_decimal - hours) * 60)
    return f"{hours}h {minutes}m"
