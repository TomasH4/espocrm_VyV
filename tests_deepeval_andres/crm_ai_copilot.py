"""
Componente de Inteligencia Artificial para EspoCRM: CRM AI Copilot
Autor: Andrés Bedoya Cano (VyV 2026-2)

Este módulo implementa el componente inteligente que evalúa consultas de clientes,
asigna severidades de SLA y recomienda porcentajes de descuento comercial.
"""

from typing import Dict, Any

class CrmAiCopilot:
    """Asistente inteligente incorporado para soporte y ventas en EspoCRM."""

    def __init__(self, name: str = "EspoCRM-VyV-Copilot"):
        self.name = name

    def evaluate_case_severity(self, case_description: str) -> Dict[str, Any]:
        """
        Analiza el reporte de un caso y clasifica su prioridad y tiempo límite de SLA.
        """
        text_lower = case_description.lower()

        if any(w in text_lower for w in ["caído", "servidor", "bloqueo", "urgente", "producción", "down", "crítico"]):
            priority = "Urgent"
            sla_hours = 4
            escalation = "L3-DevOps"
            reason = "Afectación crítica en entorno productivo o disponibilidad global."
        elif any(w in text_lower for w in ["error", "fallo", "bug", "lento", "intermitente"]):
            priority = "High"
            sla_hours = 12
            escalation = "L2-Support"
            reason = "Incidente de funcionalidad severa con posible degradación de servicio."
        else:
            priority = "Normal"
            sla_hours = 24
            escalation = "L1-HelpDesk"
            reason = "Consulta estándar o solicitud informativa regular."

        return {
            "priority": priority,
            "sla_target_hours": sla_hours,
            "escalation_team": escalation,
            "analysis_reason": reason,
            "output_text": f"El incidente reportado sobre '{case_description}' ha sido clasificado con prioridad {priority} debido a {reason.lower()} El SLA de atención máxima garantizado es de {sla_hours} horas con escalado directo a {escalation}."
        }

    def recommend_quote_discount(self, amount: float, customer_tier: str, coupon_code: str = "") -> Dict[str, Any]:
        """
        Calcula el porcentaje de descuento comercial recomendado basado en tramos de volumen y perfil.
        """
        base_rate = 0.0
        if amount >= 15000.0:
            base_rate = 0.15
        elif amount >= 8000.0:
            base_rate = 0.10
        elif amount >= 3000.0:
            base_rate = 0.05

        customer_bonus = 0.05 if customer_tier.upper() == "VIP" else 0.0
        coupon_bonus = 0.05 if coupon_code.upper() == "DESCUENTO2026" else 0.0

        total_rate = min(0.35, base_rate + customer_bonus + coupon_bonus)
        discount_amount = round(amount * total_rate, 2)
        final_amount = round(amount - discount_amount, 2)

        return {
            "total_discount_rate": total_rate,
            "discount_amount": discount_amount,
            "final_amount": final_amount,
            "output_text": f"Para un monto de ${amount:,.2f} y cliente {customer_tier}, se recomienda un descuento de {total_rate * 100:.1f}%, resultando en un valor final de ${final_amount:,.2f}."
        }
