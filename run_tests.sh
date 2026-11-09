#!/bin/bash
# Script para ejecutar pruebas unitarias TDD de VyV individuales o globales

FEATURE="${1:-all}"
FEATURE_UPPER=$(echo "$FEATURE" | tr '[:lower:]' '[:upper:]')

case "$FEATURE_UPPER" in
    F1)
        NAME="F1: Creacion de Lead (Lead Creation)"
        TEST="tests/unit/Espo/VyV/Lead/LeadCreatorTest.php"
        FILTER="/var/www/html/application/Espo/VyV/Lead"
        ;;
    F2)
        NAME="F2: Calculo de Probabilidad en Oportunidades (Opportunity Probability)"
        TEST="tests/unit/Espo/VyV/Opportunity/OpportunityProbabilityCalculatorTest.php"
        FILTER="/var/www/html/application/Espo/VyV/Opportunity"
        ;;
    F3)
        NAME="F3: Busqueda y Filtrado de Contactos (Contact Search)"
        TEST="tests/unit/Espo/VyV/Contact/ContactSearcherTest.php"
        FILTER="/var/www/html/application/Espo/VyV/Contact"
        ;;
    F4)
        NAME="F4: Validacion Temporal en Reuniones (Meeting Scheduling)"
        TEST="tests/unit/Espo/VyV/Meeting/MeetingSchedulerTest.php"
        FILTER="/var/www/html/application/Espo/VyV/Meeting"
        ;;
    F5)
        NAME="F5: Conversion Transaccional de Lead (Lead Conversion)"
        TEST="tests/unit/Espo/VyV/LeadConversion/LeadConverterTest.php"
        FILTER="/var/www/html/application/Espo/VyV/LeadConversion"
        ;;
    ALL|"")
        NAME="TODAS las funcionalidades (F1 a F5)"
        TEST="tests/unit/Espo/VyV/"
        FILTER="/var/www/html/application/Espo/VyV/"
        ;;
    *)
        echo "Opcion no valida: '$FEATURE'"
        echo "Uso:"
        echo "  ./run_tests.sh      (Ejecuta las 5 funcionalidades)"
        echo "  ./run_tests.sh F1   (Solo F1)"
        echo "  ./run_tests.sh F2   (Solo F2)"
        echo "  ./run_tests.sh F3   (Solo F3)"
        echo "  ./run_tests.sh F4   (Solo F4)"
        echo "  ./run_tests.sh F5   (Solo F5)"
        exit 1
        ;;
esac

echo "================================================================="
echo " Ejecutando $NAME"
echo "================================================================="

docker exec espocrm bash -c "cd /var/www/html && phpunit $TEST --coverage-text --coverage-filter $FILTER --colors=always"
