"""
05_symptom_triage_rules.py

Symptom triage engine -- deliberately RULE-BASED, not machine learning.
This acts as the "Medical Brain" of the app, using heuristics extracted from 
peer-reviewed clinical literature to map patient symptoms to urgency tiers and 
suspected clinical profiles (PCOS, Thyroid).

Urgency levels returned:
  "EMERGENCY"   -> seek care immediately / emergency services
  "SEE_DOCTOR"  -> book a clinician visit soon (days, not weeks)
  "MONITOR"     -> track it, mention at next routine visit
  "NORMAL"      -> within typical range, no action needed
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SymptomInput:
    # Menstrual Baseline
    flow_intensity: str = "normal"     # "spotting" | "light" | "normal" | "heavy" | "very_heavy"
    period_length_days: Optional[int] = None
    cycle_length_days: Optional[int] = None
    missed_periods_streak: int = 0     # consecutive missed cycles

    # Pain & Systemic
    cramp_severity: int = 0            # 0-10 self-reported scale
    headache_severity: int = 0         # 0-10
    headache_with_vision_changes: bool = False
    bloating_severity: int = 0         # 0-10
    fever_c: Optional[float] = None
    fainting_or_dizziness: bool = False
    soaking_pad_hourly: bool = False   # soaking through a pad/tampon every hour for 2+ hrs
    severe_abdominal_pain: bool = False
    tiredness_severe: bool = False

    # Endocrine & Metabolic (Hyperandrogenism / PCOS flags)
    acne_severity: int = 0             # 0-10
    hair_growth_new: bool = False
    skin_darkening: bool = False
    weight_gain_rapid: bool = False

    other_flags: list = field(default_factory=list)  # free-text extras from voice input


@dataclass
class TriageResult:
    urgency: str
    reasons: list
    suspected_profiles: list
    advice: str


RED_FLAG_EMERGENCY_ADVICE = (
    "These symptoms can indicate a medical emergency. Please seek immediate "
    "in-person care (ER or emergency services) rather than waiting for a routine appointment."
)
SEE_DOCTOR_ADVICE = (
    "This pattern is worth getting checked by a doctor within the next few days -- "
    "it's not necessarily an emergency, but it shouldn't wait for a routine annual visit."
)
MONITOR_ADVICE = (
    "Keep logging this in the app. If it persists over your next 2-3 cycles or gets worse, "
    "bring it up with a doctor -- the app's doctor-visit-brief can summarize the pattern for you."
)
NORMAL_ADVICE = "This is within a typical range. No action needed."


def triage_symptoms(s: SymptomInput) -> TriageResult:
    reasons = []
    suspected_profiles = []

    # =========================================================================
    # 1. INTELLIGENT SYNDROME PROFILING (Based on clinical literature)
    # =========================================================================
    
    # Adolescence Menstrual Boundaries (Omidvar et al.)
    is_oligomenorrhea = s.cycle_length_days is not None and s.cycle_length_days > 35
    is_polymenorrhea = s.cycle_length_days is not None and s.cycle_length_days < 21
    is_menorrhagia = s.period_length_days is not None and s.period_length_days > 7
    is_hypomenorrhea = s.flow_intensity == "spotting" or (s.period_length_days is not None and s.period_length_days < 2)

    # PCOS Profile (Elmannai et al.)
    # Irregular cycles + Hyperandrogenism signs
    hyperandrogenism_score = sum([
        s.acne_severity >= 5,
        s.hair_growth_new,
        s.skin_darkening,
        s.weight_gain_rapid
    ])
    if (is_oligomenorrhea or s.missed_periods_streak > 0) and hyperandrogenism_score >= 2:
        suspected_profiles.append("PCOS_RISK")

    # Thyroid Profiles (Jacobson et al.)
    # Hypothyroidism: heavy/prolonged periods + extreme tiredness
    if (is_menorrhagia or s.flow_intensity in ["heavy", "very_heavy"]) and s.tiredness_severe:
        suspected_profiles.append("HYPOTHYROID_RISK")
    
    # Hyperthyroidism: scanty/short bleeding
    if is_hypomenorrhea and is_polymenorrhea:
        suspected_profiles.append("HYPERTHYROID_RISK")


    # =========================================================================
    # 2. URGENCY TRIAGE RULES
    # =========================================================================

    # --- EMERGENCY tier: check first, short-circuit everything else ---
    if s.soaking_pad_hourly:
        reasons.append("Soaking through a pad/tampon every hour for 2+ hours (possible hemorrhage)")
    if s.fainting_or_dizziness:
        reasons.append("Fainting or dizziness alongside menstrual symptoms")
    if s.severe_abdominal_pain and s.cramp_severity >= 8:
        reasons.append("Severe, sudden abdominal pain (possible ovarian torsion / rupture)")
    if s.fever_c is not None and s.fever_c >= 39.0:
        reasons.append(f"High fever ({s.fever_c}°C) during menstruation (possible infection / TSS)")
    if s.headache_with_vision_changes and s.headache_severity >= 8:
        reasons.append("Severe headache with vision changes (possible neurological emergency)")
    if reasons:
        return TriageResult("EMERGENCY", reasons, suspected_profiles, RED_FLAG_EMERGENCY_ADVICE)


    # --- SEE_DOCTOR tier ---
    if s.flow_intensity == "very_heavy":
        reasons.append("Very heavy flow reported")
    if is_menorrhagia:
        reasons.append(f"Period lasting {s.period_length_days} days (>7 day threshold)")
    if is_oligomenorrhea:
        reasons.append(f"Cycle lasting {s.cycle_length_days} days (>35 day threshold for Oligomenorrhea)")
    if is_polymenorrhea:
        reasons.append(f"Cycle lasting {s.cycle_length_days} days (<21 day threshold for Polymenorrhea)")
    if s.cramp_severity >= 8: # Bumped to 8 based on Omidvar et al. showing severe dysmenorrhea prevalence
        reasons.append(f"Severe cramp severity {s.cramp_severity}/10 impacting daily life")
    if s.headache_severity >= 7:
        reasons.append(f"Headache severity {s.headache_severity}/10")
    if s.missed_periods_streak >= 3:
        reasons.append(f"{s.missed_periods_streak} consecutive missed periods")
    if s.fever_c is not None and 38.0 <= s.fever_c < 39.0:
        reasons.append(f"Fever ({s.fever_c}°C)")
    
    if reasons:
        advice = SEE_DOCTOR_ADVICE
        if suspected_profiles:
            advice += " Suggesting you run the ML Risk Predictors in the app for: " + ", ".join(suspected_profiles)
        return TriageResult("SEE_DOCTOR", reasons, suspected_profiles, advice)


    # --- MONITOR tier ---
    if s.flow_intensity == "heavy":
        reasons.append("Heavier than usual flow")
    if 4 <= s.cramp_severity < 8:
        reasons.append(f"Moderate cramps ({s.cramp_severity}/10)")
    if 4 <= s.headache_severity <= 6:
        reasons.append(f"Moderate headache ({s.headache_severity}/10)")
    if s.bloating_severity >= 6:
        reasons.append(f"Notable bloating ({s.bloating_severity}/10)")
    if s.missed_periods_streak in (1, 2):
        reasons.append(f"{s.missed_periods_streak} missed period(s)")
    if "PCOS_RISK" in suspected_profiles:
        reasons.append("Reported multiple hyperandrogenism signs (acne, hair growth, etc.)")
    
    if reasons:
        advice = MONITOR_ADVICE
        if suspected_profiles:
            advice += " Additionally, run the ML Predictors in the app for: " + ", ".join(suspected_profiles)
        return TriageResult("MONITOR", reasons, suspected_profiles, advice)


    return TriageResult("NORMAL", ["No symptoms outside typical range"], suspected_profiles, NORMAL_ADVICE)


# --- Pregnancy-mode danger-sign checker ---
@dataclass
class PregnancySymptomInput:
    vaginal_bleeding: bool = False
    severe_abdominal_pain: bool = False
    severe_headache_with_vision_changes: bool = False  # possible pre-eclampsia
    reduced_fetal_movement: bool = False
    swelling_face_hands_sudden: bool = False            # possible pre-eclampsia
    fever_c: Optional[float] = None
    contractions_before_37_weeks: bool = False


def triage_pregnancy_danger_signs(s: PregnancySymptomInput) -> TriageResult:
    reasons = []
    if s.vaginal_bleeding:
        reasons.append("Vaginal bleeding during pregnancy")
    if s.severe_abdominal_pain:
        reasons.append("Severe abdominal pain")
    if s.severe_headache_with_vision_changes:
        reasons.append("Severe headache with vision changes (possible pre-eclampsia)")
    if s.reduced_fetal_movement:
        reasons.append("Reduced or absent fetal movement")
    if s.swelling_face_hands_sudden:
        reasons.append("Sudden swelling of face/hands (possible pre-eclampsia)")
    if s.fever_c is not None and s.fever_c >= 38.0:
        reasons.append(f"Fever ({s.fever_c}°C) during pregnancy")
    if s.contractions_before_37_weeks:
        reasons.append("Contractions before 37 weeks (possible preterm labor)")

    if reasons:
        return TriageResult("EMERGENCY", reasons, [], RED_FLAG_EMERGENCY_ADVICE)
    return TriageResult("NORMAL", ["No danger signs reported"], [], NORMAL_ADVICE)


if __name__ == "__main__":
    # Smoke tests showcasing the new AI Brain heuristics
    print("--- EMERGENCY ---")
    print(triage_symptoms(SymptomInput(soaking_pad_hourly=True)))
    
    print("\n--- PCOS SUSPECTED ---")
    print(triage_symptoms(SymptomInput(cycle_length_days=40, acne_severity=6, hair_growth_new=True)))
    
    print("\n--- HYPOTHYROID SUSPECTED ---")
    print(triage_symptoms(SymptomInput(flow_intensity="heavy", period_length_days=9, tiredness_severe=True)))
    
    print("\n--- HYPERTHYROID SUSPECTED ---")
    print(triage_symptoms(SymptomInput(flow_intensity="spotting", cycle_length_days=19)))
    
    print("\n--- NORMAL ---")
    print(triage_symptoms(SymptomInput(cycle_length_days=28, period_length_days=5)))
