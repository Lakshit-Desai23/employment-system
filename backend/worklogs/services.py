from datetime import datetime, date

class WorkLogService:
    @staticmethod
    def calculate_duration(start_time, end_time):
        """Helper to calculate difference in hours between two time objects."""
        if not start_time or not end_time:
            return 0.0
        
        # Combine with dummy dates to calculate time difference
        dummy_date = date.today()
        dt_start = datetime.combine(dummy_date, start_time)
        dt_end = datetime.combine(dummy_date, end_time)
        
        diff = dt_end - dt_start
        hours = diff.total_seconds() / 3600.0
        return round(max(0.0, hours), 2)
