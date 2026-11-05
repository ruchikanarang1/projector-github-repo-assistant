import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.app.services.llm_service import LLMService

class DocGenerator:
    @staticmethod
    async def generate_architecture_doc(
        project_name: str,
        tech_stack: List[str],
        file_tree: List[Dict[str, Any]],
        readme: str,
        custom_instructions: Optional[str] = None
    ) -> str:
        prompt = f"""
You are a Staff Software Architect preparing production-grade documentation for a software project named '{project_name}'.
Tech Stack: {', '.join(tech_stack) if tech_stack else 'Auto-detected'}
Total Files: {len(file_tree)}

Top Files Sample:
{json.dumps([f['path'] for f in file_tree[:35]], indent=2)}

README Excerpt:
{readme[:2500] if readme else 'No README provided.'}

Additional Instructions: {custom_instructions or 'None'}

Please produce an in-depth, executive-ready 'System Architecture & Technical Design Document' in GitHub-flavored Markdown. Include:
1. Executive Summary & Purpose
2. Core Architectural Paradigm (e.g. Monolith, Decoupled SPA + REST API, Microservices)
3. Tech Stack Breakdown with technical justification for each technology choice
4. Component Topology & Separation of Concerns
5. Data Storage & Persistence Strategy
6. Security, Authentication & Environment Isolation
7. Production Deployment & Scalability Considerations
"""
        system = "You are an elite Software Architect and technical writer. Provide clear, comprehensive, and accurate architecture documentation."
        return await LLMService.generate_response(prompt, system_instruction=system)

    @staticmethod
    async def generate_mermaid_diagrams(
        project_name: str,
        tech_stack: List[str],
        file_tree: List[Dict[str, Any]]
    ) -> str:
        prompt = f"""
Generate Mermaid.js diagrams for the repository '{project_name}'.
Tech Stack: {', '.join(tech_stack)}
File Paths:
{json.dumps([f['path'] for f in file_tree[:40]], indent=2)}

Create 3 distinct Mermaid diagrams in markdown format:
1. High-Level Architecture Component Diagram (using graph TD or flowchart TD)
2. Core User Request / Data Flow Sequence Diagram (using sequenceDiagram)
3. State / Lifecycle Workflow (using flowchart LR or stateDiagram-v2)

Format: Wrap each diagram in ```mermaid ... ``` code blocks with explanatory paragraphs before and after each.
Ensure Mermaid syntax is 100% valid, quote labels containing parentheses or special characters.
"""
        system = "You are an expert systems designer who writes clean, valid Mermaid.js diagrams for system architectures."
        return await LLMService.generate_response(prompt, system_instruction=system)

    @staticmethod
    async def generate_modules_guide(
        project_name: str,
        tech_stack: List[str],
        file_tree: List[Dict[str, Any]]
    ) -> str:
        prompt = f"""
Create a comprehensive 'Module & Directory Breakdown Guide' for '{project_name}'.
Tech Stack: {', '.join(tech_stack)}

All Files:
{json.dumps([f['path'] for f in file_tree[:60]], indent=2)}

For each key folder and primary file:
- Detail its exact responsibility and role in the system.
- Highlight key functions / classes / exports.
- Explain dependencies (which modules it imports and which depend on it).
- Mention any notable design patterns used (e.g. Singleton, Dependency Injection, Repository Pattern, Factory).

Format in structured Markdown with tables and bullet points.
"""
        return await LLMService.generate_response(prompt)

    @staticmethod
    async def generate_tradeoffs_doc(
        project_name: str,
        tech_stack: List[str],
        file_tree: List[Dict[str, Any]]
    ) -> str:
        prompt = f"""
You are preparing a Senior Engineer for technical interview discussions on '{project_name}'.
Tech Stack: {', '.join(tech_stack)}
Files: {json.dumps([f['path'] for f in file_tree[:30]], indent=2)}

Generate a deep 'Technical Decisions, Tradeoffs, & Architecture Retrospective' covering:
1. Key Decisions Made & Why (e.g. Choice of DB, Framework, Sync vs Async, State Management)
2. Tradeoffs Accepted (e.g. Speed of development vs extreme concurrency, Memory vs CPU)
3. Alternative Approaches Considered & Why They Were Rejected
4. What Would You Do Differently Today (Technical Debt & Version 2.0 Roadmap)
5. Scaling Bottlenecks: What breaks first if traffic increases by 100x? How would you solve it?
"""
        return await LLMService.generate_response(prompt)

    @staticmethod
    async def generate_interview_cheatsheet(
        project_name: str,
        tech_stack: List[str],
        file_tree: List[Dict[str, Any]],
        readme: str
    ) -> str:
        prompt = f"""
Generate the Ultimate 'Interview Master Cheatsheet' for '{project_name}'.
Tech Stack: {', '.join(tech_stack)}
README: {readme[:1500] if readme else 'N/A'}

Provide:
1. **The 60-Second Pitch ("Tell me about this project")**: A concise, impactful pitch highlighting problem solved, tech stack, and personal contributions.
2. **Top 5 Hardest Technical Questions an Interviewer Might Ask** with model STAR-format answers:
   - Architecture & Design
   - Tricky Edge Cases & Bug Resolution
   - Performance Optimization
   - Security & Authentication
   - Concurrency & Reliability
3. **STAR Stories (Situation, Task, Action, Result)**: 2 ready-to-use stories highlighting leadership, problem solving, and engineering excellence.
4. **Key Code Reference Points**: Exact areas to mention during a live interview.
"""
        return await LLMService.generate_response(prompt)

    @staticmethod
    async def generate_api_specs(
        project_name: str,
        tech_stack: List[str],
        file_tree: List[Dict[str, Any]]
    ) -> str:
        prompt = f"""
Analyze the files for '{project_name}' and produce an 'API Contracts, Data Models & Configuration Specification'.
Tech Stack: {', '.join(tech_stack)}
Files: {json.dumps([f['path'] for f in file_tree[:50]], indent=2)}

Include:
1. Discovered or Probable API Endpoints (Method, Path, Request Payload, Response format)
2. Core Entity / Database Models (fields, relationships, constraints)
3. Environment Configuration & Secrets (`.env` variables needed)
4. Local Quickstart & Testing Commands
"""
        return await LLMService.generate_response(prompt)
