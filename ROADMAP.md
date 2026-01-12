### Phase 1: Real-Time & Interactive
- [ ] Migrate to Google Gemini Live API
    - WebSocket-based streaming via Google SDK
    - Target sub-500ms latency
    - Full duplex communication for interruptions and AI cues

### Phase 2: Personas & Structured Logic
- [ ] Dynamic Interviewer Personas
    - Context-aware interviewer behaviors
    - LocalRAG + job description parsing for tailored depth
- [ ] Stateful Interview Flows
    - Session state machine with defined stages: Introduction, Technical Deep Dive, Curveball, Wrap-up

### Phase 3: Multi-Modal & Visual Intelligence
- [ ] Resume-Tailored Questions
    - PDF parsing for tech stack and experience extraction
    - Contextual question generation from past projects
- [ ] Webcam Integration
    - Non-verbal cue analysis (eye contact, posture)
    - Executive presence and confidence metrics
- [ ] Session Recording
    - Full video/audio replays for self-review
- [ ] Interactive System Design Board
    - Whiteboard interface for candidate diagrams
    - AI visual context during system design interviews

---

## Data & Infrastructure

### Open Source Resource Pipeline
- [ ] GitHub Migration (from Cloudflare R2)
    - Migrate JSON to structured GitHub repo
    - Community-driven updates via PRs
- [ ] Data Pipeline Optimization
    - Concurrent processing for resource updates
    - Automated validity checks via CI/CD

---

## Quality of Life
- [ ] Global Language Support
    - Native interview support for Mandarin, Hindi, Spanish
