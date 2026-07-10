"""
07_pregnancy_trimester_brain.py

Comprehensive Maternal & Child Health Copilot (Week-by-Week Engine)
Provides granular, week-specific clinical milestones, testing schedules, and danger screenings.
Outputs structured JSON for LLM consumption.
"""

from dataclasses import dataclass, asdict
from typing import Optional, List
import json


@dataclass
class MaternalContext:
    pregnancy_week: Optional[int] = None
    postpartum_days: Optional[int] = None
    infant_age_months: Optional[int] = None
    
    fever: bool = False
    heavy_bleeding: bool = False
    
    infant_cough_fast_breathing: bool = False
    infant_diarrhea: bool = False
    
    anc_visits_completed: int = 0
    tetanus_doses_completed: int = 0

@dataclass
class CopilotResponse:
    category: str
    title: str
    description: str

# --- WEEK-BY-WEEK KNOWLEDGE BASE ---
WEEKLY_MILESTONES = {
    4: "Your baby is the size of a poppy seed. The neural tube (brain and spinal cord) is forming.",
    5: "Your baby is the size of an apple seed. The heart begins to beat this week!",
    6: "Your baby is the size of a sweet pea. Facial features are starting to form.",
    7: "Your baby is the size of a blueberry. Arm and leg buds are growing.",
    8: "Your baby is the size of a raspberry. All major organs have begun to develop.",
    9: "Your baby is the size of a cherry. The fetal tail disappears.",
    10: "Your baby is the size of a strawberry. Bones are beginning to harden.",
    11: "Your baby is the size of a fig. Tooth buds are forming under the gums.",
    12: "Your baby is the size of a lime. The digestive system is practicing contractions.",
    13: "Your baby is the size of a peapod. Vocal cords are forming.",
    14: "Your baby is the size of a lemon. The kidneys are producing urine.",
    15: "Your baby is the size of an apple. The baby can now sense light.",
    16: "Your baby is the size of an avocado. You might start feeling 'flutters' (quickening).",
    17: "Your baby is the size of a turnip. The skeleton is turning from cartilage to bone.",
    18: "Your baby is the size of a bell pepper. Hearing is developing—talk to your baby!",
    19: "Your baby is the size of a mango. A waxy coating (vernix) protects the skin.",
    20: "Your baby is the size of a banana. You are halfway there! Sleep patterns are emerging.",
    21: "Your baby is the size of a carrot. Taste buds are forming.",
    22: "Your baby is the size of a papaya. Lips and eyebrows are distinct.",
    23: "Your baby is the size of a grapefruit. The baby can hear loud noises outside the womb.",
    24: "Your baby is the size of an ear of corn. The lungs are developing branches.",
    25: "Your baby is the size of a rutabaga. Capillaries are forming under the skin.",
    26: "Your baby is the size of a scallion. The eyes begin to open.",
    27: "Your baby is the size of a cauliflower. The brain is very active.",
    28: "Your baby is the size of an eggplant. The baby can blink and dream.",
    29: "Your baby is the size of an acorn squash. Muscles and lungs continue to mature.",
    30: "Your baby is the size of a cabbage. The amniotic fluid is peaking in volume.",
    31: "Your baby is the size of a coconut. The baby is gaining a lot of weight now.",
    32: "Your baby is the size of a jicama. Most babies are in a head-down position by now.",
    33: "Your baby is the size of a pineapple. The immune system is receiving antibodies from you.",
    34: "Your baby is the size of a cantaloupe. The central nervous system is maturing.",
    35: "Your baby is the size of a honeydew melon. Kidneys are fully developed.",
    36: "Your baby is the size of a romaine lettuce. The baby is dropping into the pelvis (lightening).",
    37: "Your baby is the size of a Swiss chard. The baby is considered 'early term'.",
    38: "Your baby is the size of a leek. Organ functions are fine-tuning for outside life.",
    39: "Your baby is the size of a mini-watermelon. The baby is ready to be born!",
    40: "Your baby is the size of a small pumpkin. You have reached your due date!"
}

def generate_maternal_insights(ctx: MaternalContext) -> List[dict]:
    responses = []

    if ctx.pregnancy_week is not None:
        wk = ctx.pregnancy_week
        
        # 1. Week-Specific Fetal Milestone
        if wk in WEEKLY_MILESTONES:
            responses.append(CopilotResponse(
                "Milestone", f"Week {wk} Development",
                WEEKLY_MILESTONES[wk]
            ))
        else:
            responses.append(CopilotResponse(
                "Milestone", "Early Pregnancy",
                "Your body is undergoing massive hormonal shifts to support the embryo. Folic acid is critical."
            ))
            
        # 2. Week-Specific Clinical Testing
        if 11 <= wk <= 14:
            responses.append(CopilotResponse(
                "Action_Required", "NT Scan Reminder",
                "You are in the window for the Nuchal Translucency (NT) Ultrasound and First Trimester Screening. Please consult your doctor."
            ))
        elif 18 <= wk <= 22:
            responses.append(CopilotResponse(
                "Action_Required", "Anatomy Scan (Anomaly Scan)",
                "It's time for your mid-pregnancy ultrasound! The doctor will check all major organs and fetal growth."
            ))
        elif 24 <= wk <= 28:
            responses.append(CopilotResponse(
                "Action_Required", "Glucose Tolerance Test (OGTT)",
                "You are in the critical window to be screened for Gestational Diabetes. Ask your doctor about the glucose drink test."
            ))
        elif 35 <= wk <= 37:
            responses.append(CopilotResponse(
                "Action_Required", "GBS Screening",
                "Your doctor should perform a Group B Strep swab soon. This prevents dangerous infections during delivery."
            ))

        # 3. Trimester Danger Screenings
        if wk <= 12:
            responses.append(CopilotResponse(
                "Question", "Hyperemesis Check",
                "Are you experiencing severe, continuous vomiting that prevents you from keeping water down? (If yes, please see a doctor immediately to prevent dehydration)."
            ))
        elif 13 <= wk <= 26:
            responses.append(CopilotResponse(
                "Question", "Pre-eclampsia Check",
                "Are you experiencing any sudden swelling in your face or hands, severe headaches, or blurry vision? (These are danger signs to report immediately)."
            ))
        elif wk >= 27:
            responses.append(CopilotResponse(
                "Question", "Kick Counting & Labor Signs",
                "Is your baby moving normally today? (Call your doctor if you feel fewer than 10 movements in 2 hours). Are you feeling any regular, painful contractions?"
            ))

        # 4. ANC & Tetanus Enforcement
        if wk <= 28 and ctx.anc_visits_completed < (wk // 4):
            responses.append(CopilotResponse(
                "Action_Required", "Schedule Monthly ANC Visit",
                "You should be seeing your doctor once a month. Ensure they check your BP, Urine, and provide Iron/Folic acid."
            ))
        elif 28 < wk <= 36:
            responses.append(CopilotResponse(
                "Action_Required", "Fortnightly ANC Visit",
                "You are in the fortnightly visit window. Keep up with your checkups!"
            ))
        elif wk > 36:
            responses.append(CopilotResponse(
                "Action_Required", "Weekly ANC Visit",
                "You should be seeing your doctor every week now until delivery."
            ))

        if wk > 12 and ctx.tetanus_doses_completed < 2:
            responses.append(CopilotResponse(
                "Action_Required", "Tetanus Vaccine",
                "Crucial reminder: You need 2 doses of the Tetanus Toxoid (TT) vaccine during pregnancy."
            ))

    # --- Postpartum Care ---
    if ctx.postpartum_days is not None:
        if ctx.postpartum_days <= 2:
            responses.append(CopilotResponse(
                "Action_Required", "CRITICAL: 48-Hour Checkup",
                "A medical checkup in the first 48 hours after delivery is critical to prevent hemorrhage. Please ensure you are seen by a professional."
            ))
        if ctx.fever or ctx.heavy_bleeding:
            responses.append(CopilotResponse(
                "Action_Required", "Postpartum Danger Sign",
                "Fever or heavy bleeding after delivery can indicate a severe infection or secondary hemorrhage. Seek emergency medical care immediately."
            ))

    # --- Early Infant Care ---
    if ctx.infant_age_months is not None:
        if ctx.infant_cough_fast_breathing:
            responses.append(CopilotResponse(
                "Pediatric_Alert", "Acute Respiratory Infection (ARI) Risk",
                "A cough with rapid breathing is a strong indicator of ARI. TAKE YOUR CHILD TO A DOCTOR IMMEDIATELY."
            ))
        if ctx.infant_diarrhea:
            responses.append(CopilotResponse(
                "Pediatric_Alert", "Diarrhea & Dehydration Risk",
                "Infant diarrhea causes fast dehydration. CONTINUE FEEDING/BREASTFEEDING and start ORS immediately."
            ))
        if ctx.infant_age_months >= 12:
            responses.append(CopilotResponse(
                "Action_Required", "Vaccination Check",
                "By 12 months, your child should be fully vaccinated against BCG, DPT, Polio, and Measles."
            ))

    return [asdict(r) for r in responses]

if __name__ == "__main__":
    print("--- SCENARIO 1: WEEK 12 (NT Scan Window) ---")
    w12 = MaternalContext(pregnancy_week=12)
    print(json.dumps(generate_maternal_insights(w12), indent=2))

    print("\n--- SCENARIO 2: WEEK 25 (Glucose Test Window) ---")
    w25 = MaternalContext(pregnancy_week=25, anc_visits_completed=5, tetanus_doses_completed=2)
    print(json.dumps(generate_maternal_insights(w25), indent=2))

    print("\n--- SCENARIO 3: WEEK 36 (GBS Swab Window) ---")
    w36 = MaternalContext(pregnancy_week=36, anc_visits_completed=8, tetanus_doses_completed=2)
    print(json.dumps(generate_maternal_insights(w36), indent=2))
