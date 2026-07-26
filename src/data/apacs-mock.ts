/**
 * Dados mockados para a demonstração do dashboard.
 *
 * Enquanto a camada de API não existe, tudo aqui é estático. Os campos
 * `apacNumber`, `procedureName`, `procedureCode`, `pendency` e `unit` ainda não
 * existem no contrato de `.docs/api-backend.md` — são projeções do mockup e
 * precisam ser confirmadas com o backend antes de virarem integração real.
 *
 * Nenhum CPF/CNS real: os valores abaixo são fictícios e mascarados.
 */
import type { ApacPriority, ApacProcedure, ApacStatus, UserRole } from "@/lib/apac"

export type PendingApac = {
  id: string
  apacNumber: string
  patientName: string
  procedure: ApacProcedure
  procedureName: string
  procedureCode: string
  pendencyTitle: string
  pendencyDetail: string
  /** Bloqueia o andamento da APAC — destacado como destrutivo na tabela. */
  blocking: boolean
  status: ApacStatus
  priority: ApacPriority
  municipality: string
  unit: string
  requestedAt: string
}

export type CurrentUser = {
  name: string
  role: UserRole
  unit: string
}

export const CURRENT_USER: CurrentUser = {
  name: "Juliana Oliveira",
  role: "REGULADOR",
  unit: "Policlínica Municipal São João",
}

export const UNITS = [
  "Policlínica Municipal São João",
  "UBS Centro",
  "UBS Nova Esperança",
  "Hospital Municipal Dr. Ramos",
] as const

export const MUNICIPALITIES = ["São José dos Ramos", "João Pessoa", "Sapé", "Caldas Brandão", "Mari"] as const

export const DOCTORS = [
  "Dra. Helena Martins — CRM 12345",
  "Dr. Rafael Nogueira — CRM 23456",
  "Dra. Camila Prado — CRM 34567",
  "Dr. Bruno Teixeira — CRM 45678",
] as const

export const PROCEDURE_OPTIONS = [
  { code: "0309010036", name: "Hemodiálise", procedure: "EXAME" },
  { code: "0304010026", name: "Oncologia Clínica", procedure: "CIRURGIA" },
  { code: "0205010030", name: "Tomografia Computadorizada", procedure: "EXAME" },
  { code: "0205020045", name: "Ressonância Magnética", procedure: "EXAME" },
  { code: "0304020011", name: "Quimioterapia", procedure: "CIRURGIA" },
  { code: "0211060100", name: "Ecocardiograma", procedure: "EXAME" },
] as const

export const PENDING_APACS: PendingApac[] = [
  {
    id: "1",
    apacNumber: "2024.05.000123",
    patientName: "João da Silva",
    procedure: "EXAME",
    procedureName: "Hemodiálise",
    procedureCode: "0309010036",
    pendencyTitle: "Documento faltando",
    pendencyDetail: "Laudo médico",
    blocking: true,
    status: "PENDENTE",
    priority: "URGENTE",
    municipality: "São José dos Ramos",
    unit: "Policlínica Municipal São João",
    requestedAt: "2024-05-06",
  },
  {
    id: "2",
    apacNumber: "2024.05.000124",
    patientName: "Maria de Souza",
    procedure: "CIRURGIA",
    procedureName: "Oncologia Clínica",
    procedureCode: "0304010026",
    pendencyTitle: "Aguardando autorização",
    pendencyDetail: "Enviada para o Estado",
    blocking: false,
    status: "AGUARDO",
    priority: "URGENTE",
    municipality: "João Pessoa",
    unit: "Hospital Municipal Dr. Ramos",
    requestedAt: "2024-05-07",
  },
  {
    id: "3",
    apacNumber: "2024.05.000125",
    patientName: "Pedro Lima",
    procedure: "EXAME",
    procedureName: "Tomografia Computadorizada",
    procedureCode: "0205010030",
    pendencyTitle: "Enviar ao Estado",
    pendencyDetail: "Documentação completa, aguardando envio",
    blocking: false,
    status: "AGUARDO",
    priority: "NORMAL",
    municipality: "São José dos Ramos",
    unit: "UBS Centro",
    requestedAt: "2024-05-09",
  },
  {
    id: "4",
    apacNumber: "2024.05.000126",
    patientName: "Ana Paula Santos",
    procedure: "EXAME",
    procedureName: "Ressonância Magnética",
    procedureCode: "0205020045",
    pendencyTitle: "Exame não anexado",
    pendencyDetail: "Anexar exames de imagem",
    blocking: true,
    status: "PENDENTE",
    priority: "NORMAL",
    municipality: "Sapé",
    unit: "UBS Nova Esperança",
    requestedAt: "2024-05-11",
  },
  {
    id: "5",
    apacNumber: "2024.05.000127",
    patientName: "Carlos Eduardo Farias",
    procedure: "CIRURGIA",
    procedureName: "Quimioterapia",
    procedureCode: "0304020011",
    pendencyTitle: "CID incorreto",
    pendencyDetail: "Rever CID informado no laudo",
    blocking: false,
    status: "AGUARDO",
    priority: "URGENTE",
    municipality: "São José dos Ramos",
    unit: "Policlínica Municipal São João",
    requestedAt: "2024-05-13",
  },
  {
    id: "6",
    apacNumber: "2024.05.000128",
    patientName: "Rita Bezerra",
    procedure: "EXAME",
    procedureName: "Ecocardiograma",
    procedureCode: "0211060100",
    pendencyTitle: "CNS não confere",
    pendencyDetail: "Validar cartão do paciente",
    blocking: true,
    status: "PENDENTE",
    priority: "NORMAL",
    municipality: "Mari",
    unit: "UBS Centro",
    requestedAt: "2024-05-15",
  },
  {
    id: "7",
    apacNumber: "2024.05.000129",
    patientName: "Sebastião Alves",
    procedure: "EXAME",
    procedureName: "Hemodiálise",
    procedureCode: "0309010036",
    pendencyTitle: "Autorização negada",
    pendencyDetail: "Justificativa clínica insuficiente",
    blocking: true,
    status: "NEGADO",
    priority: "URGENTE",
    municipality: "São José dos Ramos",
    unit: "Hospital Municipal Dr. Ramos",
    requestedAt: "2024-05-16",
  },
  {
    id: "8",
    apacNumber: "2024.05.000130",
    patientName: "Luciana Ferreira",
    procedure: "CIRURGIA",
    procedureName: "Oncologia Clínica",
    procedureCode: "0304010026",
    pendencyTitle: "Solicitação médica ilegível",
    pendencyDetail: "Reescanear a solicitação",
    blocking: true,
    status: "PENDENTE",
    priority: "NORMAL",
    municipality: "Caldas Brandão",
    unit: "UBS Nova Esperança",
    requestedAt: "2024-05-18",
  },
]
