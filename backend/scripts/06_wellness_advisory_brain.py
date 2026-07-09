"""
06_wellness_advisory_brain.py

Wellness Advisory Engine for SAKHI.
This module provides holistic, non-clinical lifestyle advice based on the 
user's current cycle phase and real-time symptoms. It outputs clean JSON arrays 
so that an LLM API (like Gemini) can easily format these safe, vetted tips 
into conversational chat messages.
"""

from dataclasses import dataclass, asdict
from typing import Optional, List
import json


@dataclass
class WellnessSymptomInput:
    cycle_phase: str = "unknown"  # "menstrual" | "follicular" | "ovulation" | "luteal" | "unknown"
    
    # Pain & Discomfort
    cramp_severity: int = 0       # 0-10
    headache_severity: int = 0    # 0-10
    bloating_severity: int = 0    # 0-10
    nausea: bool = False
    
    # Energy & Mood
    fatigue_severity: int = 0     # 0-10
    anxiety_or_stress: bool = False
    mood_swings: bool = False
    
    # Cycle Irregularities
    cycle_delayed: bool = False   # True if expected period hasn't arrived
    flow_intensity: str = "normal"


@dataclass
class AdviceItem:
    category: str    # "Nutrition", "Pain Relief", "Mental Health", "Movement", "Insight"
    tip: str
    explanation: str


def generate_wellness_advice(s: WellnessSymptomInput) -> List[dict]:
    advice_list = []

    # =========================================================================
    # 1. CYCLE PHASE INSIGHTS & BASELINE ADVICE
    # =========================================================================
    if s.cycle_phase == "menstrual":
        advice_list.append(AdviceItem(
            category="Insight",
            tip="Your hormones are at their lowest point right now.",
            explanation="It's completely normal to feel tired and introspective. Your body is working hard to shed the uterine lining."
        ))
        advice_list.append(AdviceItem(
            category="Nutrition",
            tip="Boost your iron and Vitamin C.",
            explanation="Eating iron-rich foods like spinach, lentils, or dark chocolate, paired with Vitamin C (like citrus), helps replenish what you lose during your period."
        ))
    elif s.cycle_phase == "follicular":
        advice_list.append(AdviceItem(
            category="Insight",
            tip="Estrogen is rising, bringing a natural energy boost.",
            explanation="This is a great time to start new projects, learn something new, or socialize."
        ))
        advice_list.append(AdviceItem(
            category="Movement",
            tip="Take advantage of the energy spike.",
            explanation="Light to moderate cardio, running, or dancing are great ways to utilize the rising estrogen levels."
        ))
    elif s.cycle_phase == "ovulation":
        advice_list.append(AdviceItem(
            category="Insight",
            tip="Estrogen and testosterone are peaking.",
            explanation="You might feel your most confident and social right now. It's also when you are most fertile."
        ))
        advice_list.append(AdviceItem(
            category="Nutrition",
            tip="Focus on anti-inflammatory foods.",
            explanation="High estrogen can sometimes slow digestion. Fiber-rich foods like berries, nuts, and leafy greens keep things moving smoothly."
        ))
    elif s.cycle_phase == "luteal":
        advice_list.append(AdviceItem(
            category="Insight",
            tip="Progesterone is taking over.",
            explanation="Progesterone has a natural calming effect, but as it drops right before your period, it can trigger PMS symptoms. This is your body, not just your mind."
        ))
        advice_list.append(AdviceItem(
            category="Mental Health",
            tip="Prioritize boundaries and self-care.",
            explanation="It's normal to feel more sensitive or easily overwhelmed. Give yourself permission to rest and say no to extra commitments."
        ))

    # =========================================================================
    # 2. SYMPTOM-SPECIFIC ADVICE
    # =========================================================================
    
    # Pain Relief (Cramps & Headaches)
    if s.cramp_severity >= 4:
        advice_list.append(AdviceItem(
            category="Pain Relief",
            tip="Apply a heat patch to your lower abdomen or lower back.",
            explanation="Heat helps relax the contracting uterine muscles that cause cramps. Sip on warm chamomile or ginger tea for extra comfort."
        ))
    
    if s.headache_severity >= 4:
        advice_list.append(AdviceItem(
            category="Pain Relief",
            tip="Hydrate and rest in a dark, quiet room.",
            explanation="Hormonal headaches are often triggered by estrogen drops. Staying hydrated and applying a cold compress to your forehead can help soothe the pain."
        ))

    # Bloating & Nausea
    if s.bloating_severity >= 4:
        advice_list.append(AdviceItem(
            category="Nutrition",
            tip="Reduce sodium intake and sip peppermint tea.",
            explanation="Progesterone slows down your digestive tract. Peppermint tea helps relax your gut, and avoiding salty or heavily processed foods will reduce water retention."
        ))
    
    if s.nausea:
        advice_list.append(AdviceItem(
            category="Nutrition",
            tip="Try ginger and small, frequent meals.",
            explanation="Ginger root is a natural anti-nausea remedy. Eat small, bland meals like toast or crackers instead of large, heavy portions."
        ))

    # Energy & Mood
    if s.fatigue_severity >= 5:
        advice_list.append(AdviceItem(
            category="Movement",
            tip="Swap intense workouts for gentle restorative yoga.",
            explanation="Pushing through severe fatigue raises cortisol (stress). A 15-minute gentle stretch or a short walk is much better for your body today."
        ))
        
    if s.anxiety_or_stress or s.mood_swings:
        advice_list.append(AdviceItem(
            category="Mental Health",
            tip="Try a 5-minute breathing exercise or meditation.",
            explanation="Hormonal shifts directly impact neurotransmitters like serotonin. A quick breathing exercise can help reset your nervous system."
        ))
        if s.cycle_phase == "luteal":
            advice_list.append(AdviceItem(
                category="Nutrition",
                tip="Consider a magnesium-rich snack.",
                explanation="Magnesium helps regulate cortisol and relax the nervous system. Try a handful of pumpkin seeds, almonds, or a banana."
            ))

    # Irregularity & Delays
    if s.cycle_delayed:
        advice_list.append(AdviceItem(
            category="Insight",
            tip="Don't panic if your cycle is a few days late.",
            explanation="Stress, travel, illness, and dietary changes can all delay ovulation, which in turn delays your period. Focus on stress-reduction. (Note: If you are sexually active and significantly delayed, consider a pregnancy test)."
        ))

    # Convert the dataclass objects to raw dictionaries so they can be JSON serialized
    return [asdict(item) for item in advice_list]


if __name__ == "__main__":
    # Smoke Test 1: Luteal Phase with Cramps and Anxiety
    print("--- SCENARIO 1: LUTEAL PHASE (PMS) ---")
    user_state = WellnessSymptomInput(
        cycle_phase="luteal",
        cramp_severity=6,
        bloating_severity=5,
        anxiety_or_stress=True
    )
    advice = generate_wellness_advice(user_state)
    print(json.dumps(advice, indent=2))

    # Smoke Test 2: Delayed Cycle
    print("\n--- SCENARIO 2: DELAYED PERIOD ---")
    user_state = WellnessSymptomInput(
        cycle_phase="unknown",
        cycle_delayed=True,
        anxiety_or_stress=True
    )
    advice = generate_wellness_advice(user_state)
    print(json.dumps(advice, indent=2))
