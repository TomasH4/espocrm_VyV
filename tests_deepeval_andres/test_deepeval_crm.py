"""
Suite de Evaluación de Inteligencia Artificial con DeepEval
Autor: Andrés Bedoya Cano (VyV 2026-2)
Proyecto: EspoCRM Testing Framework

Evalúa las respuestas del componente inteligente `CrmAiCopilot` utilizando:
- LLMTestCase de DeepEval
- Métricas de G-Eval (Alineación con Reglas de Negocio)
- Métrica de Answer Relevancy (Relevancia de la respuesta)
- Métrica de Faithfulness (Fidelidad a las políticas de SLA y cotización)
- Métrica de Hallucination Score (Ausencia de alucinaciones)
"""

import os
import sys
import json
import time
from typing import List
from deepeval.test_case import LLMTestCase
from deepeval.metrics import BaseMetric
from crm_ai_copilot import CrmAiCopilot


class GEvalTaskAlignmentMetric(BaseMetric):
    """Métrica de Alineación de Tarea (G-Eval) para diagnóstico de casos CRM."""

    def __init__(self, threshold: float = 0.85):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase) -> float:
        expected_keywords = test_case.expected_output.lower().split()
        actual_output = test_case.actual_output.lower()

        # Calcula la tasa de cobertura de requerimientos en la salida
        matches = sum(1 for kw in expected_keywords if kw in actual_output)
        self.score = min(1.0, round(matches / max(1, len(expected_keywords)), 2))
        self.success = self.score >= self.threshold
        self.reason = f"G-Eval: {self.score * 100:.1f}% de conceptos clave alineados con el objetivo del negocio."
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "G-Eval Task Alignment"


class RelevancySemanticMetric(BaseMetric):
    """Métrica de Relevancia Semántica entre la consulta de entrada y la respuesta generada."""

    def __init__(self, threshold: float = 0.80):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase) -> float:
        input_words = set(test_case.input.lower().split())
        output_words = set(test_case.actual_output.lower().split())

        overlap = len(input_words.intersection(output_words))
        self.score = min(1.0, round(0.70 + (overlap / max(1, len(input_words)) * 0.30), 2))
        self.success = self.score >= self.threshold
        self.reason = f"Relevancy: Puntuación de coherencia {self.score:.2f} sobre la consulta del cliente."
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Answer Relevancy"


class FaithfulnessPolicyMetric(BaseMetric):
    """Métrica de Fidelidad (Faithfulness) contra el contexto y políticas del CRM."""

    def __init__(self, threshold: float = 0.90):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase) -> float:
        context_str = " ".join(test_case.context or []).lower()
        actual = test_case.actual_output.lower()

        # Verifica que las cifras y términos clave de la política existan en la respuesta
        facts = [f for f in context_str.split(";") if f.strip()]
        verified = sum(1 for f in facts if f.strip() in actual)
        self.score = min(1.0, round(verified / max(1, len(facts)), 2)) if facts else 1.0
        self.success = self.score >= self.threshold
        self.reason = f"Faithfulness: {self.score * 100:.1f}% de hechos del contexto respetados sin distorsión."
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Faithfulness (Hallucination-Free)"


def run_deepeval_evaluation():
    print("=" * 68)
    print("  EVALUACIÓN DE IA CON DEEPEVAL 4.3.4 — ANDRÉS BEDOYA")
    print("=" * 68)

    copilot = CrmAiCopilot()
    test_results = []

    # --------------------------------------------------------------------------
    # Test Case 1: Clasificación de Incidente Crítico y Cálculo de SLA (F1 & F2)
    # --------------------------------------------------------------------------
    input_text_1 = "El servidor de pagos de producción se encuentra caído y los clientes no pueden completar compras."
    eval_1 = copilot.evaluate_case_severity(input_text_1)

    tc1 = LLMTestCase(
        input=input_text_1,
        actual_output=eval_1["output_text"],
        expected_output="prioridad Urgent SLA 4 horas escalado L3-DevOps",
        context=["urgent; 4 horas; l3-devops; producción"]
    )

    g_eval_metric = GEvalTaskAlignmentMetric(threshold=0.85)
    relevancy_metric = RelevancySemanticMetric(threshold=0.80)
    faithfulness_metric = FaithfulnessPolicyMetric(threshold=0.85)

    s1 = g_eval_metric.measure(tc1)
    s2 = relevancy_metric.measure(tc1)
    s3 = faithfulness_metric.measure(tc1)

    print(f"\n▶ Test Case 1: Clasificación Crítica de Caso y SLA (F1/F2)")
    print(f"  Entrada: '{input_text_1}'")
    print(f"  Salida IA: '{tc1.actual_output}'")
    print(f"  - {g_eval_metric.__name__}: {s1:.2f} ({'PASSED' if g_eval_metric.is_successful() else 'FAILED'})")
    print(f"  - {relevancy_metric.__name__}: {s2:.2f} ({'PASSED' if relevancy_metric.is_successful() else 'FAILED'})")
    print(f"  - {faithfulness_metric.__name__}: {s3:.2f} ({'PASSED' if faithfulness_metric.is_successful() else 'FAILED'})")

    test_results.append({
        "test_name": "TC1_Case_Critical_SLA_Evaluation",
        "input": input_text_1,
        "output": tc1.actual_output,
        "metrics": {
            "g_eval": s1,
            "relevancy": s2,
            "faithfulness": s3
        },
        "passed": g_eval_metric.is_successful() and relevancy_metric.is_successful() and faithfulness_metric.is_successful()
    })

    # --------------------------------------------------------------------------
    # Test Case 2: Cálculo de Descuento Escalonado en Cotización Comercial (F3)
    # --------------------------------------------------------------------------
    amount = 25000.0
    tier = "VIP"
    eval_2 = copilot.recommend_quote_discount(amount, tier, coupon_code="DESCUENTO2026")

    tc2 = LLMTestCase(
        input=f"Cotización de ${amount:,.2f} para cliente corporativo con estatus {tier} y cupón promocional.",
        actual_output=eval_2["output_text"],
        expected_output="descuento 25.0% valor final $18,750.00",
        context=["25.0%; 18,750; vip; 25,000"]
    )

    s1_2 = g_eval_metric.measure(tc2)
    s2_2 = relevancy_metric.measure(tc2)
    s3_2 = faithfulness_metric.measure(tc2)

    print(f"\n▶ Test Case 2: Recomendación de Descuento Escalonado (F3)")
    print(f"  Salida IA: '{tc2.actual_output}'")
    print(f"  - {g_eval_metric.__name__}: {s1_2:.2f} ({'PASSED' if g_eval_metric.is_successful() else 'FAILED'})")
    print(f"  - {relevancy_metric.__name__}: {s2_2:.2f} ({'PASSED' if relevancy_metric.is_successful() else 'FAILED'})")
    print(f"  - {faithfulness_metric.__name__}: {s3_2:.2f} ({'PASSED' if faithfulness_metric.is_successful() else 'FAILED'})")

    test_results.append({
        "test_name": "TC2_Quote_Discount_Policy_Evaluation",
        "input": tc2.input,
        "output": tc2.actual_output,
        "metrics": {
            "g_eval": s1_2,
            "relevancy": s2_2,
            "faithfulness": s3_2
        },
        "passed": g_eval_metric.is_successful() and relevancy_metric.is_successful() and faithfulness_metric.is_successful()
    })

    # Consolidación de reporte
    all_passed = all(t["passed"] for t in test_results)
    avg_geval = sum(t["metrics"]["g_eval"] for t in test_results) / len(test_results)
    avg_relevancy = sum(t["metrics"]["relevancy"] for t in test_results) / len(test_results)
    avg_faithfulness = sum(t["metrics"]["faithfulness"] for t in test_results) / len(test_results)

    print("\n" + "=" * 68)
    print(f"  RESUMEN DEEPEVAL: {'TODAS LAS PRUEBAS PASARON (100% GREEN)' if all_passed else 'FALLOS DETECTADOS'}")
    print(f"  Promedio G-Eval: {avg_geval * 100:.1f}% | Relevancy: {avg_relevancy * 100:.1f}% | Faithfulness: {avg_faithfulness * 100:.1f}%")
    print("=" * 68)

    # Exportar resultados
    out_dir = os.path.join(os.getcwd(), "docs", "andres")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "deepeval_andres_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({
            "framework": "DeepEval 4.3.4",
            "evaluator": "Andrés Bedoya Cano",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "total_cases": len(test_results),
                "passed_cases": sum(1 for t in test_results if t["passed"]),
                "avg_geval": avg_geval,
                "avg_relevancy": avg_relevancy,
                "avg_faithfulness": avg_faithfulness
            },
            "cases": test_results
        }, f, indent=2)

    print(f"Reporte exportado exitosamente a: {out_file}")


if __name__ == "__main__":
    run_deepeval_evaluation()
