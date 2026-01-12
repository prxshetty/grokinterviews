# GrokInterviews Roadmap

## Voice Interview 2.0: The "Human" Experience
*Transitioning from standard Q&A to immersive, low-latency, and personalized interview simulations.*

### Phase 1: Real-Time & Interactive (Low Latency)
- [ ] **Migrate to Google Gemini Live API**
    - Implement WebSocket-based streaming via the Google SDK.
    - Targeting sub-500ms latency for natural conversational flow.
    - Enable Full Duplex Communication to allow for user interruptions and AI cues.
    - *Technical Note:* Deprecating the sequential Speech-to-Text -> LLM -> Text-to-Speech model.

### Phase 2: Personas & Structured Logic
- [ ] **Dynamic Interviewer Personas**
    - Implement context-aware interviewer behaviors.
    - Utilize RAG and advanced job description parsing to tailor technical and behavioral depth for every query.
- [ ] **Stateful Interview Flows**
    - Replace hardcoded logic with a session state machine.
    - **Defined Stages:**
        1. Introduction and Ice-breakers
        2. Technical and Behavioral Deep Dive
        3. Challenge/Curveball Implementation
        4. Wrap-up and Candidate Questions

### Phase 3: Multi-Modal & Visual Intelligence
- [ ] **Resume-Tailored Questions**
    - **Automated PDF Parsing:** Extract technology stack and experience from uploaded resumes.
    - **Contextual Generation:** Generate specific questions based on past project experience (e.g., specific infrastructure or leadership challenges).
- [ ] **Webcam Integration**
    - Analyze non-verbal cues such as eye contact and posture using client-side computer vision.
    - Provide objective feedback on executive presence and confidence metrics.
- [ ] **Session Recording**
    - Archive full video and audio replays for candidate self-review.

---

## Data & Infrastructure

### Open Source Resource Pipeline
- [ ] **GitHub Migration (from Cloudflare R2)**
    - Migrate JSON blobs to a structured GitHub repository.
    - Facilitate community-driven updates via Pull Requests for questions and content fixes.
    - Utilize Git's versioning and compression for dataset management.
- [ ] **Data Pipeline Optimization**
    - Implement concurrent processing for resource updates.
    - Establish automated validity checks via CI/CD for data integrity.

---

## Future Specifications

- [ ] **Interactive System Design Board:** A specialized whiteboard interface providing the AI with visual context of candidate diagrams.
- [ ] **Global Language Support:** Native technical interview support for Mandarin, Hindi, and Spanish.
