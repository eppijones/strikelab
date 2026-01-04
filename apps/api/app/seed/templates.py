"""
Session Log Templates for StrikeLab
Bilingual: English (EN) and Norwegian (NO)
"""

TEMPLATES = [
    # English Templates
    {
        "name": "SESSION 1 – LOG",
        "language": "en",
        "description": "Standard session logging template with pre and post session fields",
        "is_default": True,
        "is_system": True,
        "structure": {
            "pre_session": {
                "energy": {
                    "type": "scale",
                    "min": 1,
                    "max": 5,
                    "label": "Energy Level",
                    "description": "How energized do you feel?"
                },
                "mental_state": {
                    "type": "scale",
                    "min": 1,
                    "max": 5,
                    "label": "Mental State",
                    "description": "How focused and clear is your mind?"
                },
                "intent": {
                    "type": "text",
                    "label": "Intent",
                    "placeholder": "What are you working on today?"
                },
                "routine_discipline": {
                    "type": "boolean",
                    "label": "Following routine?",
                    "description": "Are you committing to your pre-shot routine?"
                },
                "feel_tags": {
                    "type": "tags",
                    "label": "How do you feel?",
                    "options": ["calm", "heavy", "late", "stress", "focused", "smooth", "quick", "tight"]
                }
            },
            "shot_blocks": [
                {
                    "name": "Warmup",
                    "fields": ["hit_target", "miss_pattern"],
                    "description": "Initial warmup shots"
                },
                {
                    "name": "Main Session",
                    "fields": ["hit_target", "miss_pattern", "notes"],
                    "description": "Primary practice block"
                },
                {
                    "name": "Pressure Block",
                    "fields": ["hit_target", "miss_pattern", "notes"],
                    "description": "Shots with score/pressure element"
                }
            ],
            "post_session": {
                "what_worked": {
                    "type": "text",
                    "label": "What worked?",
                    "placeholder": "What clicked today?"
                },
                "take_forward": {
                    "type": "text",
                    "label": "What to take forward?",
                    "placeholder": "One focus for next session"
                },
                "dont_overthink": {
                    "type": "text",
                    "label": "What not to overthink?",
                    "placeholder": "Let this go..."
                },
                "coach_note": {
                    "type": "text",
                    "label": "Note to self",
                    "placeholder": "Message to future you"
                }
            },
            "fatigue_mode": True
        }
    },
    {
        "name": "SESSION 1 – NEW YEAR PLAN",
        "language": "en",
        "description": "Season opener reflection and goal setting template",
        "is_default": False,
        "is_system": True,
        "structure": {
            "pre_session": {
                "season_goals": {
                    "type": "text",
                    "label": "Season Goals",
                    "placeholder": "What do you want to achieve this season?"
                },
                "handicap_target": {
                    "type": "text",
                    "label": "Handicap Target",
                    "placeholder": "Target handicap by end of season"
                },
                "key_focus_areas": {
                    "type": "tags",
                    "label": "Key Focus Areas",
                    "options": ["driver", "irons", "wedges", "putting", "course management", "mental game"]
                }
            },
            "shot_blocks": [
                {
                    "name": "Baseline Test",
                    "fields": ["hit_target", "miss_pattern", "notes"],
                    "description": "Establish current baseline"
                }
            ],
            "post_session": {
                "baseline_assessment": {
                    "type": "text",
                    "label": "Baseline Assessment",
                    "placeholder": "Where are you starting from?"
                },
                "priority_improvements": {
                    "type": "text",
                    "label": "Priority Improvements",
                    "placeholder": "Top 3 things to improve"
                },
                "first_week_plan": {
                    "type": "text",
                    "label": "First Week Plan",
                    "placeholder": "What will you work on this week?"
                }
            },
            "fatigue_mode": False
        }
    },
    
    # Norwegian Templates
    {
        "name": "ØKT 1 – LOGG",
        "language": "no",
        "description": "Standard øktlogging med før og etter økt-felt",
        "is_default": True,
        "is_system": True,
        "structure": {
            "pre_session": {
                "energy": {
                    "type": "scale",
                    "min": 1,
                    "max": 5,
                    "label": "Energinivå",
                    "description": "Hvor energisk føler du deg?"
                },
                "mental_state": {
                    "type": "scale",
                    "min": 1,
                    "max": 5,
                    "label": "Mental tilstand",
                    "description": "Hvor fokusert og klar er hodet?"
                },
                "intent": {
                    "type": "text",
                    "label": "Intensjon",
                    "placeholder": "Hva trener du på i dag?"
                },
                "routine_discipline": {
                    "type": "boolean",
                    "label": "Følger du rutinen?",
                    "description": "Gjennomfører du pre-shot rutinen?"
                },
                "feel_tags": {
                    "type": "tags",
                    "label": "Hvordan føler du deg?",
                    "options": ["rolig", "tung", "sen", "stress", "fokusert", "myk", "hurtig", "stram"]
                }
            },
            "shot_blocks": [
                {
                    "name": "Oppvarming",
                    "fields": ["hit_target", "miss_pattern"],
                    "description": "Innledende oppvarmingsslag"
                },
                {
                    "name": "Hovedøkt",
                    "fields": ["hit_target", "miss_pattern", "notes"],
                    "description": "Hovedtrening"
                },
                {
                    "name": "Pressblokk",
                    "fields": ["hit_target", "miss_pattern", "notes"],
                    "description": "Slag med score/press-element"
                }
            ],
            "post_session": {
                "what_worked": {
                    "type": "text",
                    "label": "Hva fungerte?",
                    "placeholder": "Hva klikket i dag?"
                },
                "take_forward": {
                    "type": "text",
                    "label": "Hva tar du med videre?",
                    "placeholder": "Ett fokus til neste økt"
                },
                "dont_overthink": {
                    "type": "text",
                    "label": "Hva skal du ikke overtenke?",
                    "placeholder": "La dette ligge..."
                },
                "coach_note": {
                    "type": "text",
                    "label": "Notat til deg selv",
                    "placeholder": "Melding til fremtidige deg"
                }
            },
            "fatigue_mode": True
        }
    },
    {
        "name": "ØKT 1 – NYÅRSPLAN",
        "language": "no",
        "description": "Sesongåpner med refleksjon og målsetting",
        "is_default": False,
        "is_system": True,
        "structure": {
            "pre_session": {
                "season_goals": {
                    "type": "text",
                    "label": "Sesongmål",
                    "placeholder": "Hva vil du oppnå denne sesongen?"
                },
                "handicap_target": {
                    "type": "text",
                    "label": "Handicap-mål",
                    "placeholder": "Mål-handicap ved sesongslutt"
                },
                "key_focus_areas": {
                    "type": "tags",
                    "label": "Hovedfokusområder",
                    "options": ["driver", "jern", "wedger", "putting", "banespill", "mental game"]
                }
            },
            "shot_blocks": [
                {
                    "name": "Baseline-test",
                    "fields": ["hit_target", "miss_pattern", "notes"],
                    "description": "Etabler nåværende baseline"
                }
            ],
            "post_session": {
                "baseline_assessment": {
                    "type": "text",
                    "label": "Baseline-vurdering",
                    "placeholder": "Hvor starter du fra?"
                },
                "priority_improvements": {
                    "type": "text",
                    "label": "Prioriterte forbedringer",
                    "placeholder": "Topp 3 ting å forbedre"
                },
                "first_week_plan": {
                    "type": "text",
                    "label": "Plan for første uke",
                    "placeholder": "Hva skal du jobbe med denne uken?"
                }
            },
            "fatigue_mode": False
        }
    }
]


def get_templates():
    """Return all session log templates."""
    return TEMPLATES
