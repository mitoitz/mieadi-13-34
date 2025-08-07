
import { useState } from "react";
import { NewStudentAction } from "./NewStudentAction";
import { NewClassAction } from "./NewClassAction";
import { NewPaymentAction } from "./NewPaymentAction";
import { ScheduleClassAction } from "./ScheduleClassAction";
import { CreateAssessmentAction } from "./CreateAssessmentAction";
import { AttendanceControlAction } from "./AttendanceControlAction";
import { SendNotificationAction } from "./SendNotificationAction";
import { NewSubjectAction } from "./NewSubjectAction";
import { NewCourseAction } from "./NewCourseAction";
import { GenerateReportAction } from "./GenerateReportAction";
import { MockQuickAction } from "./MockQuickAction";

interface QuickActionsManagerProps {
  activeAction: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const getActionTitle = (actionId: string): string => {
  const actionTitles: Record<string, string> = {
    "new-class": "Nova Turma",
    "schedule-class": "Agendar Aula",
    "new-payment": "Lançar Pagamento",
    "create-assessment": "Nova Avaliação",
    "attendance-control": "Controle de Presença",
    "generate-report": "Gerar Relatório",
    "send-notification": "Enviar Comunicado",
    "new-course": "Novo Curso",
    "new-subject": "Nova Disciplina"
  };
  return actionTitles[actionId] || "Ação";
};

export function QuickActionsManager({ activeAction, onClose, onSuccess }: QuickActionsManagerProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  // Implemented actions
  const implementedActions = [
    "new-student", 
    "new-class", 
    "schedule-class", 
    "new-payment", 
    "create-assessment",
    "attendance-control",
    "send-notification", 
    "new-subject",
    "new-course",
    "generate-report"
  ];
  const isMockAction = activeAction && !implementedActions.includes(activeAction);

  return (
    <>
      <NewStudentAction
        isOpen={activeAction === "new-student"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <NewClassAction
        isOpen={activeAction === "new-class"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <ScheduleClassAction
        isOpen={activeAction === "schedule-class"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <NewPaymentAction
        isOpen={activeAction === "new-payment"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <CreateAssessmentAction
        isOpen={activeAction === "create-assessment"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <AttendanceControlAction
        isOpen={activeAction === "attendance-control"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <SendNotificationAction
        isOpen={activeAction === "send-notification"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <NewSubjectAction
        isOpen={activeAction === "new-subject"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <NewCourseAction
        isOpen={activeAction === "new-course"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      <GenerateReportAction
        isOpen={activeAction === "generate-report"}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
      {isMockAction && (
        <MockQuickAction
          isOpen={!!isMockAction}
          onClose={onClose}
          onSuccess={handleSuccess}
          actionTitle={getActionTitle(activeAction)}
        />
      )}
    </>
  );
}

export { QuickActionsManager as default };
