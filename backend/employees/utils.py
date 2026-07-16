def parse_skills(skills_string):
    """Convert comma separated skills into a list of cleaned strings."""
    if not skills_string:
        return []
    return [skill.strip() for skill in skills_string.split(',') if skill.strip()]
