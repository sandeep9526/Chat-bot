"""
Zeva Industry Templates

Pre-configured template presets for different business niches:
- Salon & Spa
- Dental / Health Clinic
- Real Estate Agency
- E-Commerce Store
- Coaching & Education
- General Business
"""

TEMPLATES: dict[str, dict] = {
    "general": {
        "id": "general",
        "name": "General Business Assistant",
        "accent": "#4f46e5",
        "welcome": "Hi there! How can I help you today?",
        "suggestions": ["What services do you offer?", "What are your business hours?", "How can I contact the team?"],
        "system_prompt_style": "Friendly, professional, and helpful customer support assistant.",
    },
    "salon": {
        "id": "salon",
        "name": "Glow Salon & Spa Assistant",
        "accent": "#ec4899",
        "welcome": "Welcome to Glow Salon! Looking for haircut prices, appointments, or glowing skin treatments?",
        "suggestions": ["What are your haircut & styling prices?", "Do you take walk-in appointments?", "Are you open on Sundays?"],
        "system_prompt_style": "Warm, stylish, welcoming salon front-desk receptionist.",
    },
    "clinic": {
        "id": "clinic",
        "name": "Health Clinic Assistant",
        "accent": "#0d9488",
        "welcome": "Hello! Welcome to Wellness Clinic. How can I assist with your appointment or health inquiry?",
        "suggestions": ["How do I book a doctor appointment?", "What are your consultation timings?", "Do you accept health insurance?"],
        "system_prompt_style": "Courteous, reassuring, clear, and professional clinic assistant.",
    },
    "realestate": {
        "id": "realestate",
        "name": "Prime Realty Concierge",
        "accent": "#2563eb",
        "welcome": "Welcome to Prime Realty! Looking to buy, rent, or schedule a property walkthrough?",
        "suggestions": ["What properties are available for sale?", "Can I schedule a home viewing?", "What is the price range per sq ft?"],
        "system_prompt_style": "Professional, informative real-estate property consultant focused on intent.",
    },
    "ecommerce": {
        "id": "ecommerce",
        "name": "Store Support Bot",
        "accent": "#8b5cf6",
        "welcome": "Hi! Need help with orders, shipping times, or product recommendations?",
        "suggestions": ["What is your return & exchange policy?", "How long does delivery take?", "Do you offer free shipping?"],
        "system_prompt_style": "Fast, direct, polite e-commerce shopper assistant.",
    },
    "coaching": {
        "id": "coaching",
        "name": "Academy Student Concierge",
        "accent": "#f59e0b",
        "welcome": "Welcome to Peak Academy! Have questions about our upcoming cohorts, syllabus, or fees?",
        "suggestions": ["What courses are currently open?", "What is the fee structure & schedule?", "How do I enroll?"],
        "system_prompt_style": "Encouraging, knowledgeable academic counselor.",
    },
}


def get_template(template_id: str) -> dict:
    """Return template dict by ID or default to 'general'."""
    return TEMPLATES.get((template_id or "").lower(), TEMPLATES["general"])
