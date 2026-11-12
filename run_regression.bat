@echo off
cd /d c:\Users\sqluser\Desktop\VyV\espocrm_VyV
echo Running R1...
npx cypress run --spec "cypress/e2e/regression/R1_lead_creation.regression.cy.js" --browser chrome > reg_r1.txt 2>&1
echo R1 ExitCode: %ERRORLEVEL% >> reg_r1.txt
echo Running R2...
npx cypress run --spec "cypress/e2e/regression/R2_opportunity_probability.regression.cy.js" --browser chrome > reg_r2.txt 2>&1
echo R2 ExitCode: %ERRORLEVEL% >> reg_r2.txt
echo Running R3...
npx cypress run --spec "cypress/e2e/regression/R3_contact_search.regression.cy.js" --browser chrome > reg_r3.txt 2>&1
echo R3 ExitCode: %ERRORLEVEL% >> reg_r3.txt
echo Running R4...
npx cypress run --spec "cypress/e2e/regression/R4_meeting_scheduling.regression.cy.js" --browser chrome > reg_r4.txt 2>&1
echo R4 ExitCode: %ERRORLEVEL% >> reg_r4.txt
echo Running R5...
npx cypress run --spec "cypress/e2e/regression/R5_lead_conversion.regression.cy.js" --browser chrome > reg_r5.txt 2>&1
echo R5 ExitCode: %ERRORLEVEL% >> reg_r5.txt
echo ALL DONE

