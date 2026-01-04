from typing import Optional, Any
from sqlalchemy.orm import Session
from uuid import UUID
import statistics
import os
import httpx
import json

from app.models.session import Session as SessionModel
from app.models.shot import Shot
from app.models.log import SessionLog
from app.models.coach import CoachReport, ChatMessage


class CoachEngine:
    """
    AI Coach Engine for generating reports and chat responses.
    
    In production, this would integrate with an LLM API (OpenAI, Anthropic, etc.)
    For MVP, we generate structured reports based on statistical analysis.
    """
    
    def generate_report(
        self,
        session: SessionModel,
        user_id: UUID,
        language: str,
        db: Session,
    ) -> CoachReport:
        """Generate a coach report for a session."""
        
        # Get shots and log
        shots = db.query(Shot).filter(Shot.session_id == session.id).all()
        log = db.query(SessionLog).filter(SessionLog.session_id == session.id).first()
        
        # Analyze metrics
        analysis = self._analyze_session(shots)
        
        # Generate report sections
        diagnosis = self._generate_diagnosis(analysis, log, language)
        interpretation = self._generate_interpretation(analysis, log, language)
        prescription = self._generate_prescription(analysis, language)
        validation = self._generate_validation(analysis, language)
        next_best_move = self._generate_next_move(analysis, log, language)
        
        # Create report
        report = CoachReport(
            session_id=session.id,
            user_id=user_id,
            diagnosis=diagnosis,
            interpretation=interpretation,
            prescription=prescription,
            validation=validation,
            next_best_move=next_best_move,
            linked_metrics=analysis,
            report_type="session",
            language=language,
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return report
    
    def _analyze_session(self, shots: list[Shot]) -> dict[str, Any]:
        """Analyze session metrics."""
        if not shots:
            return {}
        
        # Filter non-mishits for analysis
        valid_shots = [s for s in shots if not s.is_mishit]
        
        if not valid_shots:
            return {"shot_count": len(shots), "mishit_count": len(shots)}
        
        # Group by club
        clubs: dict[str, list[Shot]] = {}
        for shot in valid_shots:
            if shot.club not in clubs:
                clubs[shot.club] = []
            clubs[shot.club].append(shot)
        
        # Calculate metrics per club
        club_metrics = {}
        for club, club_shots in clubs.items():
            carries = [s.carry_distance for s in club_shots if s.carry_distance]
            smash_factors = [s.smash_factor for s in club_shots if s.smash_factor]
            face_to_paths = [s.face_to_path for s in club_shots if s.face_to_path]
            spin_axes = [s.spin_axis for s in club_shots if s.spin_axis]
            offline = [s.offline_distance for s in club_shots if s.offline_distance]
            
            club_metrics[club] = {
                "count": len(club_shots),
                "avg_carry": statistics.mean(carries) if carries else None,
                "carry_std": statistics.stdev(carries) if len(carries) > 1 else None,
                "avg_smash": statistics.mean(smash_factors) if smash_factors else None,
                "avg_face_to_path": statistics.mean(face_to_paths) if face_to_paths else None,
                "face_to_path_std": statistics.stdev(face_to_paths) if len(face_to_paths) > 1 else None,
                "avg_spin_axis": statistics.mean(spin_axes) if spin_axes else None,
                "avg_offline": statistics.mean(offline) if offline else None,
                "offline_std": statistics.stdev(offline) if len(offline) > 1 else None,
            }
        
        # Calculate overall scores
        all_smash = [s.smash_factor for s in valid_shots if s.smash_factor]
        all_face_to_path = [s.face_to_path for s in valid_shots if s.face_to_path]
        all_carry_std = [m["carry_std"] for m in club_metrics.values() if m.get("carry_std")]
        all_offline_std = [m["offline_std"] for m in club_metrics.values() if m.get("offline_std")]
        
        # Score calculations (0-100 scale)
        strike_score = self._calculate_strike_score(all_smash)
        face_control_score = self._calculate_face_control_score(all_face_to_path)
        distance_control_score = self._calculate_distance_control_score(all_carry_std)
        dispersion_score = self._calculate_dispersion_score(all_offline_std)
        
        return {
            "shot_count": len(shots),
            "valid_shot_count": len(valid_shots),
            "mishit_count": len(shots) - len(valid_shots),
            "clubs_used": list(clubs.keys()),
            "club_metrics": club_metrics,
            "strike_score": strike_score,
            "face_control_score": face_control_score,
            "distance_control_score": distance_control_score,
            "dispersion_score": dispersion_score,
        }
    
    def _calculate_strike_score(self, smash_factors: list[float]) -> float:
        if not smash_factors:
            return 70.0
        avg = statistics.mean(smash_factors)
        # Baseline: 1.45 = 100, 1.35 = 70
        return min(100, max(0, 70 + (avg - 1.35) * 300))
    
    def _calculate_face_control_score(self, face_to_paths: list[float]) -> float:
        if not face_to_paths:
            return 70.0
        avg_abs = statistics.mean([abs(f) for f in face_to_paths])
        # Lower is better: 0° = 100, 4° = 60
        return min(100, max(0, 100 - avg_abs * 10))
    
    def _calculate_distance_control_score(self, carry_stds: list[float]) -> float:
        if not carry_stds:
            return 70.0
        avg_std = statistics.mean(carry_stds)
        # Lower std is better: 0m = 100, 10m = 60
        return min(100, max(0, 100 - avg_std * 4))
    
    def _calculate_dispersion_score(self, offline_stds: list[float]) -> float:
        if not offline_stds:
            return 70.0
        avg_std = statistics.mean(offline_stds)
        # Lower is better: 0m = 100, 15m = 60
        return min(100, max(0, 100 - avg_std * 2.67))
    
    def _generate_diagnosis(
        self, analysis: dict, log: Optional[SessionLog], language: str
    ) -> str:
        if language == "no":
            return self._diagnosis_no(analysis, log)
        return self._diagnosis_en(analysis, log)
    
    def _diagnosis_en(self, analysis: dict, log: Optional[SessionLog]) -> str:
        if not analysis:
            return "Insufficient data for analysis."
        
        parts = []
        
        # Shot count
        parts.append(f"Session contained {analysis.get('valid_shot_count', 0)} valid shots across {len(analysis.get('clubs_used', []))} clubs.")
        
        # Scores
        strike = analysis.get("strike_score", 70)
        face = analysis.get("face_control_score", 70)
        distance = analysis.get("distance_control_score", 70)
        dispersion = analysis.get("dispersion_score", 70)
        
        if strike < 75:
            parts.append(f"Strike quality needs attention (score: {strike:.0f}).")
        if face < 75:
            parts.append(f"Face control variance detected (score: {face:.0f}).")
        if distance < 75:
            parts.append(f"Distance control inconsistent (score: {distance:.0f}).")
        if dispersion < 75:
            parts.append(f"Dispersion pattern wider than target (score: {dispersion:.0f}).")
        
        if min(strike, face, distance, dispersion) >= 75:
            parts.append("All core metrics within solid range. Focus on maintaining consistency.")
        
        return " ".join(parts)
    
    def _diagnosis_no(self, analysis: dict, log: Optional[SessionLog]) -> str:
        if not analysis:
            return "Utilstrekkelig data for analyse."
        
        parts = []
        parts.append(f"Økten inneholdt {analysis.get('valid_shot_count', 0)} gyldige slag med {len(analysis.get('clubs_used', []))} køller.")
        
        strike = analysis.get("strike_score", 70)
        if strike < 75:
            parts.append(f"Treffkvalitet trenger oppmerksomhet (score: {strike:.0f}).")
        
        return " ".join(parts)
    
    def _generate_interpretation(
        self, analysis: dict, log: Optional[SessionLog], language: str
    ) -> str:
        parts = []
        
        # Correlate with subjective data if available
        if log:
            if log.energy_level and log.energy_level <= 2:
                parts.append("Low energy reported may be affecting swing mechanics.")
            if log.feel_tags and "stress" in log.feel_tags:
                parts.append("Stress indicator detected - this often correlates with tension patterns.")
            if log.feel_tags and "late" in log.feel_tags:
                parts.append("Late timing feel may explain face-to-path variance.")
        
        if not parts:
            parts.append("Continue to log subjective data to enable deeper correlation analysis.")
        
        if language == "no":
            return "Subjektive data korrelert med metrics. " + " ".join(parts)
        return " ".join(parts)
    
    def _generate_prescription(self, analysis: dict, language: str) -> str:
        if language == "no":
            return "Øvelse: 10 sakte svinger med fokus på passive hender gjennom impact. Begrensning: Pause 2 sekunder på toppen før nedsvingen."
        
        prescriptions = []
        
        strike = analysis.get("strike_score", 70)
        face = analysis.get("face_control_score", 70)
        
        if strike < 75:
            prescriptions.append("Drill: 10 half-speed swings focusing on center contact. Feel the ball compress.")
        if face < 75:
            prescriptions.append("Constraint: Close eyes on backswing to reduce visual interference with face awareness.")
        
        if not prescriptions:
            prescriptions.append("Maintain current practice structure. Consider adding pressure element (score targets).")
        
        return " ".join(prescriptions)
    
    def _generate_validation(self, analysis: dict, language: str) -> str:
        if language == "no":
            return "Suksessmål: Face-to-path under 2° på neste økt. Monitor: Smash factor bør returnere til 1.41+ baseline."
        
        return "Success metric: Face-to-path variance under 2° on next session. Monitor smash factor return to 1.41+ baseline."
    
    def _generate_next_move(
        self, analysis: dict, log: Optional[SessionLog], language: str
    ) -> str:
        if language == "no":
            return "Kort økt i morgen: 20 baller, kun 7-jern, med pause-drill. Logg energi og følelse før start."
        
        return "Short session tomorrow: 20 balls, 7-iron only, with pause drill. Log energy and feel before starting."
    
    def generate_chat_response(
        self,
        message: str,
        context: Optional[dict],
        user_id: UUID,
        db: Session,
    ) -> str:
        """Generate a chat response using AI (Anthropic Claude) or fallback."""
        
        # Check for API key
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        # Get conversation history for context
        history = db.query(ChatMessage).filter(
            ChatMessage.user_id == user_id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        
        history_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(history)
        ]
        
        # Build context string from session data
        context_str = self._build_context_string(context, user_id, db)
        
        # Try Anthropic Claude first
        if anthropic_key:
            try:
                return self._call_anthropic(message, history_messages, context_str, anthropic_key)
            except Exception as e:
                print(f"Anthropic API error: {e}")
        
        # Try OpenAI as fallback
        if openai_key:
            try:
                return self._call_openai(message, history_messages, context_str, openai_key)
            except Exception as e:
                print(f"OpenAI API error: {e}")
        
        # Fallback to rule-based responses
        return self._generate_fallback_response(message, context)
    
    def _build_context_string(self, context: Optional[dict], user_id: UUID, db: Session) -> str:
        """Build context string from user data for the AI."""
        parts = []
        
        if context:
            # Recent sessions context
            if context.get("recent_sessions"):
                parts.append("Recent practice sessions:")
                for s in context["recent_sessions"][:3]:
                    stats = s.get("stats", {})
                    parts.append(
                        f"- {s.get('name', 'Session')} ({s.get('date', 'N/A')}): "
                        f"{s.get('shot_count', 0)} shots, "
                        f"Strike: {stats.get('strike_score', 'N/A')}, "
                        f"Face Control: {stats.get('face_control_score', 'N/A')}"
                    )
            
            # Handicap context
            if context.get("handicap"):
                parts.append(f"Current handicap: {context['handicap']}")
        
        return "\n".join(parts) if parts else "No session data available yet."
    
    def _call_anthropic(
        self, 
        message: str, 
        history: list[dict], 
        context: str, 
        api_key: str
    ) -> str:
        """Call Anthropic Claude API."""
        system_prompt = f"""You are an expert golf coach AI assistant for StrikeLab, a golf performance tracking app. 
You help golfers improve their game by analyzing their data, suggesting drills, and providing personalized coaching.

Player Context:
{context}

Guidelines:
- Be encouraging but honest about areas needing work
- Provide specific, actionable drills when relevant
- Reference their data when available
- Keep responses concise (2-4 paragraphs max)
- Use golf terminology appropriately
- If asked about something outside golf, politely redirect to golf topics
- Never make up statistics or data - only reference what's provided"""

        # Build messages
        messages = []
        for msg in history[-6:]:  # Last 6 messages for context
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        messages.append({"role": "user", "content": message})
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",  # Fast and cost-effective
                    "max_tokens": 1024,
                    "system": system_prompt,
                    "messages": messages,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]
    
    def _call_openai(
        self, 
        message: str, 
        history: list[dict], 
        context: str, 
        api_key: str
    ) -> str:
        """Call OpenAI API as fallback."""
        system_prompt = f"""You are an expert golf coach AI assistant for StrikeLab. 
You help golfers improve by analyzing data, suggesting drills, and providing personalized coaching.

Player Context:
{context}

Be encouraging, specific, and concise (2-4 paragraphs). Use golf terminology appropriately."""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": 1024,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def _generate_fallback_response(self, message: str, context: Optional[dict]) -> str:
        """Generate a response without AI API (rule-based fallback)."""
        message_lower = message.lower()
        
        # Analyze message intent
        if any(word in message_lower for word in ["driver", "tee shot", "off the tee"]):
            return """For driver consistency, focus on these fundamentals:

1. **Ball Position**: Play the ball off your lead heel (inside the instep). This promotes an upward strike for optimal launch.

2. **Spine Angle**: Tilt your spine slightly away from the target at address. Maintain this through impact.

3. **Tempo**: The driver swing should feel smooth, not rushed. Try counting "1-2-3" during your backswing.

**Quick Drill**: Hit 5 drivers at 70% effort focusing only on center contact. Then gradually build speed while maintaining that strike quality."""

        if any(word in message_lower for word in ["slice", "fade", "cut", "open face"]):
            return """A slice typically comes from an open clubface relative to your swing path. Here's how to fix it:

1. **Grip Check**: Ensure you can see 2-3 knuckles on your lead hand at address. A weak grip often causes an open face.

2. **Path Drill**: Place a headcover 3 inches outside your ball. Practice swinging without hitting it - this promotes an in-to-out path.

3. **Feel**: At impact, feel like you're "closing the door" with your trail hand.

Start with half-swings and progress to full swings once the feeling clicks. This usually takes 20-30 balls to feel natural."""

        if any(word in message_lower for word in ["hook", "draw", "closed face", "pull"]):
            return """A hook happens when your face is closed to your path. Let's work on that:

1. **Grip**: Check that your trail hand isn't too strong (palm facing up). Rotate it more toward neutral.

2. **Exit Path**: Feel like your hands exit toward the target, not around your body.

3. **Drill**: Hit shots with a slightly open stance - this encourages a more out-to-in path to neutralize the hook.

**Focus**: On your next range session, hit 10 shots trying to hit a slight fade. Even if you hit it straight, you'll have reduced the hook tendency."""

        if any(word in message_lower for word in ["iron", "irons", "approach"]):
            return """Iron play is all about consistent low point control. Here's how to improve:

1. **Ball Position**: Play standard irons (6-9) center to slightly forward. Long irons a ball forward.

2. **Contact Drill**: Place a tee in the ground 2 inches in front of your ball. Your goal is to brush the grass AFTER the ball, at the tee location.

3. **Weight**: At impact, 70-80% of your weight should be on your lead foot.

**Practice Routine**: Hit 5 shots each with 8-iron, 7-iron, 6-iron, focusing purely on ball-first contact. Don't worry about distance - just quality strikes."""

        if any(word in message_lower for word in ["wedge", "short game", "chip", "pitch"]):
            return """Short game improvement comes from consistent technique and lots of reps. Here's a structured approach:

1. **30-Yard Pitch**: Master this first. Use your 56° or 60° wedge with a compact swing. Ball slightly back, weight forward.

2. **Distance Control Ladder**: Hit shots to 10, 20, 30, 40, 50 yards. Develop feel for each distance.

3. **One-Hop-and-Stop**: Practice landing the ball at a specific spot and having it release predictably.

**Key Feel**: In pitching, the big muscles control the swing. Let your arms respond to body rotation, don't flip your hands."""

        if any(word in message_lower for word in ["putt", "putting", "green"]):
            return """Putting is 40% of your strokes - it deserves focused practice. Here's how:

1. **Alignment**: Set up a string line on the practice green to check your eye position and putter face.

2. **Speed Control**: Practice lag putting first. Drop 5 balls at 30 feet and focus on getting them within 3 feet.

3. **Short Putt Confidence**: Set up 4 balls around the hole at 3 feet. Don't leave until you make all 4. Then move to 4 feet.

**Gate Drill**: Set two tees just wider than your putter head. Practice striking through the gate for consistent face alignment."""

        if any(word in message_lower for word in ["practice", "drill", "plan", "routine"]):
            return """Here's a structured practice session template based on your goals:

**Warm-Up (10 min)**
- 5 half-swing wedges
- 5 full swing wedges
- 5 mid-irons
- 3 drivers

**Technical Work (20 min)**
- Pick ONE thing to work on
- Use alignment sticks
- Hit 30-40 balls focused on feel

**Performance Practice (15 min)**
- Simulate on-course scenarios
- Change clubs each shot
- Pick targets

**Short Game (15 min)**
- 10 pitch shots to different distances
- 10 chip shots
- 10 putts from various lengths

Remember: Quality over quantity. 50 focused shots beats 100 mindless swings."""

        if any(word in message_lower for word in ["improve", "better", "lower", "handicap"]):
            return """To lower your handicap, focus on these high-impact areas:

1. **Short Game**: The fastest path to lower scores. Most amateurs lose 5+ shots per round within 50 yards.

2. **Course Management**: Play to your strengths. If you hit a fade, aim down the left side. Don't fight your tendencies.

3. **Putting Inside 5 Feet**: These should be automatic. Practice until you rarely miss inside 5 feet.

4. **Consistency Over Distance**: A straight 230-yard drive beats a 280-yard slice into the trees.

Based on typical handicap breakdowns, working on your short game and putting will give you the fastest improvement. Would you like specific drills for any of these areas?"""

        # Default response for unrecognized queries
        return """I'm here to help you improve your golf game! I can assist with:

🎯 **Technique**: Driver, irons, wedges, putting
🔧 **Fixes**: Slice, hook, distance control, consistency  
📋 **Practice**: Drills, routines, training plans
📊 **Analysis**: Understanding your shot data and patterns

What aspect of your game would you like to work on? The more specific your question, the better I can help!"""
