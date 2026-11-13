import os
import json
import subprocess
import time
from pathlib import Path

# Simple expectation matcher (avoids OpenAI/OpenAIModel requirements)
def expectation_score(output: str, expected: list[str]) -> float:
    if not expected:
        return 1.0
    matches = sum(1 for phrase in expected if phrase.lower() in output.lower())
    return matches / len(expected)

# Load expectations
EXPECTATIONS_PATH = Path(__file__).parent / "deepeval_expectations.json"
with open(EXPECTATIONS_PATH, "r", encoding="utf-8") as f:
    expectations = json.load(f)

# Mapping of test names to tsx commands
TESTS = {
    "F1_lead_creation": "npm --prefix tests_stagehand run test:lead",
    "F2_opportunity_probability": "npm --prefix tests_stagehand run test:opportunity",
    "F3_contact_search": "npm --prefix tests_stagehand run test:contact",
    "F4_meeting_scheduling": "npm --prefix tests_stagehand run test:meeting",
    "F5_lead_conversion": "npm --prefix tests_stagehand run test:conversion",
}

# Report path (artifact folder)
REPORT_PATH = Path(os.getenv("AGY_ARTIFACT_DIR", "")) / "deepeval_report.md"
if not REPORT_PATH.parent.exists():
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

report_lines = ["# DeepEval Evaluation Report", "", f"Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}", ""]

for test_name, cmd in TESTS.items():
    print(f"\nRunning Stagehand test {test_name}…")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    output = result.stdout + "\n" + result.stderr
    # Extract Gemini LLM output lines (contain '[Stagehand]')
    llm_output = "\n".join([line for line in output.splitlines() if "[Stagehand]" in line])
    expected_phrases = expectations.get(test_name, {}).get("expected", [])
    score = expectation_score(llm_output, expected_phrases)
    report_lines.append(f"## {test_name}")
    report_lines.append(f"- **Expectation match**: {score:.2f}")
    report_lines.append("")

with open(REPORT_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(report_lines))

print(f"DeepEval report written to {REPORT_PATH}")
