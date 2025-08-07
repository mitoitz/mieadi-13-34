import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CertificateService, type CertificateData } from '@/services/certificate.service';
import { toast } from 'sonner';

export function useGenerateCertificate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      certificateData,
      studentId,
      courseId,
      classId,
      issuedBy
    }: {
      certificateData: CertificateData;
      studentId: string;
      courseId?: string;
      classId?: string;
      issuedBy: string;
    }) => {
      // Gerar PDF
      const fileUrl = await CertificateService.generateCertificate(certificateData);
      
      // Salvar registro no banco
      const certificate = await CertificateService.saveCertificateRecord({
        student_id: studentId,
        course_id: courseId,
        class_id: classId,
        file_url: fileUrl,
        certificate_type: 'conclusao',
        issued_by: issuedBy
      });

      return { certificate, fileUrl };
    },
    onSuccess: ({ fileUrl }) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificado gerado com sucesso!');
      
      // Abrir certificado em nova aba
      window.open(fileUrl, '_blank');
    },
    onError: (error) => {
      console.error('Error generating certificate:', error);
      toast.error('Erro ao gerar certificado');
    },
  });
}

export function useStudentCertificates(studentId?: string) {
  return useQuery({
    queryKey: ['certificates', 'student', studentId],
    queryFn: () => CertificateService.getCertificatesByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useValidateCertificate() {
  return useMutation({
    mutationFn: (validationCode: string) => 
      CertificateService.validateCertificate(validationCode),
    onError: (error) => {
      console.error('Error validating certificate:', error);
      toast.error('Código de validação inválido');
    },
  });
}