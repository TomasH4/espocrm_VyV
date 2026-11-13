import subprocess
import time
import json
import os
from pathlib import Path

# DeepEval imports
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, HallucinationMetric
from deepeval import GEval

# Load expectations
EXPECTATIONS_PATH = Path(__file__).parent / "deepeval_expectations.json"
with open(EXPECTATIONS_PATH, "r", encoding="utf-8") as f:
    expectations = json.load(f)

# Mapping of test names to tsx commands
TESTS = {
    "F1_lead_creation": "tsx F1_lead_creation.stagehand.ts",
    "F2_opportunity_probability": "tsx F2_opportunity_probability.stagehand.ts",
    "F3_contact_search": "tsx F3_contact_search.stagehand.ts",
    "F4_meeting_scheduling": "tsx F4_meeting_scheduling.stagehand.ts",
    "F5_lead_conversion": "tsx F5_lead_conversion.stagehand.ts",
}

# Directory for the markdown report (artifact folder)
REPORT_PATH = Path(r"C:\\Users\\sqluser\\.gemini\\antigravity\\brain\\6218fdc5-3615-4a6e-9143-68fe4808c96a\\deepeval_report.md")
if not REPORT_PATH.parent.exists():
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

report_lines = ["# DeepEval Evaluation Report", "", f"Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}", ""]

for test_name, cmd in TESTS.items():
    print(f"\nRunning Stagehand test {test_name}...")
    # Run the Stagehand test via npm script (assumes cwd is project root)
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    output = result.stdout + "\n" + result.stderr
    # Simple extraction of Gemini LLM output – look for lines after '[Stagehand]' that contain the model response
    # For a more robust implementation, parse the JSON if Stagehand emits structured data.
    llm_output = "".join([line for line in output.splitlines() if "[Stagehand]" in line])

    # Prepare DeepEval metrics
    faithfulness = FaithfulnessMetric(threshold=0.8)
    relevance = AnswerRelevancyMetric(threshold=0.8)
    hallucination = HallucinationMetric(threshold=0.8)

    # Run metrics (they expect a string answer and optional expected answer list)
    expected_phrases = expectations.get(test_name, {}).get("expected", [])
    # Combine expectations into a single reference text
    reference = " ".join(expected_phrases)

    # Evaluate each metric – wrap in try/except to avoid script crash on a single failure
    try:
        faithfulness_result = faithfulness.evaluate(llm_output, reference)
        relevance_result = relevance.evaluate(llm_output, reference)
        hallucination_result = hallucination.evaluate(llm_output)
    except Exception as e:
        faithfulness_result = relevance_result = hallucination_result = {"score": 0, "reason": str(e)}

    # Optional custom GEval – you can define a rubric file later if desired
    # For now we skip it for simplicity.

    # Append results to report
    report_lines.append(f"## {test_name}")
    report_lines.append(f"- **Faithfulness**: {faithfulness_result.get('score', 0):.2f}")
    report_lines.append(f"- **Relevance**: {relevance_result.get('score', 0):.2f}")
    report_lines.append(f"- **Hallucination**: {hallucination_result.get('score', 0):.2f}")
    report_lines.append("")

# Write markdown report
with open(REPORT_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(report_lines))

print(f"DeepEval report written to {REPORT_PATH}")
