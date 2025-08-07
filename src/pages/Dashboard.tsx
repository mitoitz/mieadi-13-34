import { MieadiDashboard } from "@/components/dashboard/MieadiDashboard";
import { ProfessorDashboard } from "./professor/ProfessorDashboard";
import { SecretarioDashboard } from "./secretario/SecretarioDashboard";
import { CoordenadorDashboard } from "./coordenador/CoordenadorDashboard";
import { AlunoDashboard } from "./aluno/AlunoDashboard";
import { MembroDashboard } from "./membro/MembroDashboard";
import { PastorDashboard } from "./pastor/PastorDashboard";

interface DashboardProps {
  userType: "diretor" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";
  user: {
    name: string;
    userType: "diretor" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";
    congregacao?: string;
  };
}

export function Dashboard({ userType, user }: DashboardProps) {
  return (
    <div>
      <div className="mb-6 px-6 pt-6">
        <h1 className="text-3xl font-bold">
          Bem-vindo, {user.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {userType === "diretor" && "Painel diretivo do sistema MIEADI"}
          {userType === "pastor" && `Painel do pastor - ${user.congregacao}`}
          {userType === "aluno" && "Seu painel acadêmico personalizado"}
          {userType === "professor" && "Painel do professor - Gerencie suas turmas e avaliações"}
          {userType === "coordenador" && "Painel do coordenador - Coordenação acadêmica e pedagógica"}
          {userType === "secretario" && "Painel do secretário - Gestão administrativa completa"}
          {userType === "membro" && "Seu perfil de membro - Acompanhe suas atividades na igreja"}
        </p>
      </div>

      {userType === "professor" ? (
        <ProfessorDashboard user={{ ...user, id: "temp-id" }} />
      ) : userType === "secretario" ? (
        <SecretarioDashboard user={{ ...user, id: "temp-id" }} />
      ) : userType === "coordenador" ? (
        <CoordenadorDashboard user={{ ...user, id: "temp-id" }} />
      ) : userType === "aluno" ? (
        <AlunoDashboard user={{ ...user, id: "temp-id" }} />
      ) : userType === "membro" ? (
        <MembroDashboard user={{ ...user, id: "temp-id" }} />
      ) : userType === "pastor" ? (
        <PastorDashboard user={{ ...user, id: "temp-id" }} />
      ) : (
        <MieadiDashboard userType={userType} />
      )}
    </div>
  );
}