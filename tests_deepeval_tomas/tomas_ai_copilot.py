"""
Componente de Inteligencia Artificial para EspoCRM: Tomás CRM AI Copilot
Autor: Tomás Henao (VyV 2026-2)
Proyecto: EspoCRM Testing Framework

Este módulo implementa el copiloto inteligente que asiste a los usuarios
en las funcionalidades asignadas a Tomás:
- F1 / F5: Calificación de Leads y estrategia de conversión transaccional (B2B vs B2C).
- F2: Estimación y asignación de probabilidad para etapas de Oportunidades.
- F4: Planificación temporal y cálculo automático de duración de Reuniones.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta


class TomasCrmAiCopilot:
    """Copiloto inteligente para operaciones de Leads, Oportunidades y Reuniones."""

    def __init__(self, name: str = "Tomas-EspoCRM-Copilot"):
        self.name = name

    def qualify_and_plan_lead_conversion(
        self,
        first_name: str,
        last_name: str,
        email: str,
        phone: str = "",
        company_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        F1 / F5: Califica un Lead y determina la estrategia óptima de conversión.
        Si incluye empresa, recomienda conversión B2B completa (Contacto + Cuenta).
        Si es persona natural sin empresa, recomienda conversión B2C (Contacto únicamente).
        """
        if not last_name or not last_name.strip():
            return {
                "status": "Disqualified",
                "reason": "El apellido es obligatorio para la persistencia del Lead en EspoCRM.",
                "target_scopes": [],
                "output_text": "Lead rechazado: falta el apellido obligatorio."
            }

        full_name = f"{first_name} {last_name}".strip()
        is_b2b = bool(company_name and company_name.strip())
        target_scopes = ["Contact", "Account"] if is_b2b else ["Contact"]
        lead_type = "B2B Corporativo" if is_b2b else "B2C Persona Natural"
        score = 95 if is_b2b and "@" in email else 80

        company_info = f"de la empresa {company_name} " if is_b2b else ""
        output_text = (
            f"El Lead {full_name} {company_info}con email {email} ha sido calificado como {lead_type} con score de {score}/100. "
            f"Estrategia de conversión recomendada: crear ámbitos {', '.join(target_scopes)}."
        )

        return {
            "status": "Qualified",
            "score": score,
            "lead_type": lead_type,
            "target_scopes": target_scopes,
            "output_text": output_text
        }

    def predict_opportunity_probability(
        self,
        opportunity_name: str,
        stage: str,
        amount: float
    ) -> Dict[str, Any]:
        """
        F2: Determina la probabilidad de cierre según la etapa de negocio de EspoCRM.
        Reglas de negocio:
          - Prospecting: 10%
          - Qualification: 20%
          - Proposal: 50%
          - Negotiation: 80%
          - Closed Won: 100%
          - Closed Lost: 0%
        """
        stage_probabilities = {
            "Prospecting": 10,
            "Qualification": 20,
            "Proposal": 50,
            "Negotiation": 80,
            "Closed Won": 100,
            "Closed Lost": 0
        }

        probability = stage_probabilities.get(stage, 10)
        weighted_value = round(amount * (probability / 100.0), 2)

        output_text = (
            f"La Oportunidad '{opportunity_name}' en etapa '{stage}' tiene una probabilidad de éxito asignada del {probability}%. "
            f"Para un monto total de ${amount:,.2f}, el valor ponderado esperado en pipeline es de ${weighted_value:,.2f}."
        )

        return {
            "stage": stage,
            "probability": probability,
            "amount": amount,
            "weighted_value": weighted_value,
            "output_text": output_text
        }

    def calculate_meeting_duration(
        self,
        meeting_title: str,
        date_start_str: str,
        time_start_str: str,
        date_end_str: str = "",
        time_end_str: str = "",
        manual_duration_min: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        F4: Planificación temporal y cálculo automático de duración de reuniones.
        - Si se especifican inicio y fin, calcula la duración exacta en minutos.
        - Si se especifica duración manual, proyecta la fecha/hora de fin.
        - Valida que la fecha de fin no sea anterior al inicio.
        """
        format_dt = "%d.%m.%Y %H:%M"

        try:
            start_dt = datetime.strptime(f"{date_start_str} {time_start_str}", format_dt)
        except ValueError:
            return {
                "valid": False,
                "error": "Formato de fecha de inicio inválido (se espera DD.MM.YYYY HH:MM)",
                "output_text": "Error en formato de inicio de reunión."
            }

        if manual_duration_min is not None:
            end_dt = start_dt + timedelta(minutes=manual_duration_min)
            duration = manual_duration_min
        elif date_end_str and time_end_str:
            try:
                end_dt = datetime.strptime(f"{date_end_str} {time_end_str}", format_dt)
            except ValueError:
                return {
                    "valid": False,
                    "error": "Formato de fecha fin inválido",
                    "output_text": "Error en formato de fin de reunión."
                }
            if end_dt <= start_dt:
                return {
                    "valid": False,
                    "error": "La fecha de fin debe ser posterior a la fecha de inicio",
                    "output_text": "Inconsistencia temporal: fin menor o igual al inicio."
                }
            duration = int((end_dt - start_dt).total_seconds() / 60)
        else:
            duration = 60
            end_dt = start_dt + timedelta(minutes=duration)

        output_text = (
            f"Reunión '{meeting_title}' programada desde {start_dt.strftime(format_dt)} hasta {end_dt.strftime(format_dt)}. "
            f"Duración calculada: {duration} minutos. Consistencia temporal validada con éxito."
        )

        return {
            "valid": True,
            "duration_minutes": duration,
            "date_start": start_dt.strftime(format_dt),
            "date_end": end_dt.strftime(format_dt),
            "output_text": output_text
        }
