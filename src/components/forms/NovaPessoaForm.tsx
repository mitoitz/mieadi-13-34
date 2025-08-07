import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Camera, Upload, UserCheck, UserMinus, AlertTriangle } from "lucide-react";
import { ImageUploadEditor } from "@/components/ui/image-upload-editor";
import { ScheduledAbsenceManager } from "@/components/absence/ScheduledAbsenceManager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreatePessoa, useUpdatePessoa } from "@/hooks/usePessoas";

interface NovaPessoaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function NovaPessoaForm({ isOpen, onClose, onSuccess, initialData }: NovaPessoaFormProps) {
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showAbsenceControl, setShowAbsenceControl] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [congregations, setCongregations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    cpf: "",
    phone: "",
    birth_date: "",
    address: "",
    bio: "",
    role: "membro" as "admin" | "pastor" | "professor" | "coordenador" | "secretario" | "aluno" | "membro",
    congregation_id: "",
    position: "",
    specialization: "",
    is_active: true,
    education_level: "",
    marital_status: "",
    emergency_contact: "",
    emergency_phone: "",
    baptism_date: "",
    membership_date: "",
    status: "ativo",
    absence_alerts: true,
    password: ""
  });
  const { toast } = useToast();
  
  // React Query mutations
  const createPessoa = useCreatePessoa();
  const updatePessoa = useUpdatePessoa();
  
  const loading = createPessoa.isPending || updatePessoa.isPending;

  useEffect(() => {
    loadCongregations();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        cpf: initialData.cpf || "",
        phone: initialData.phone || "",
        birth_date: initialData.birth_date || "",
        address: initialData.address || "",
        bio: initialData.bio || "",
        role: initialData.role || "membro",
        congregation_id: initialData.congregation_id || "",
        position: initialData.ministerial_position || "",
        specialization: initialData.specialization || "",
        is_active: initialData.status === "ativo",
        education_level: initialData.education_level || "",
        marital_status: initialData.civil_status || "",
        emergency_contact: initialData.emergency_contact_name || "",
        emergency_phone: initialData.emergency_contact_phone || "",
        baptism_date: initialData.baptism_date || "",
        membership_date: initialData.member_since || "",
        status: initialData.status || "ativo",
        absence_alerts: true,
        password: ""
      });
      setProfileImageUrl(initialData.photo_url || initialData.avatar_url || null);
    }
  }, [initialData]);

  const loadCongregations = async () => {
    try {
      const { congregacoesService } = await import("@/services/congregacoes.service");
      const data = await congregacoesService.listar();
      setCongregations(data || []);
    } catch (error) {
      console.error('Error loading congregations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pessoaData = {
      full_name: formData.full_name,
      email: formData.email,
      cpf: formData.cpf,
      phone: formData.phone,
      birth_date: formData.birth_date || null,
      address: formData.address,
      bio: formData.bio,
      role: formData.role,
      status: formData.status as 'ativo' | 'inativo' | 'pendente',
      congregation_id: formData.congregation_id || null,
      ministerial_position: formData.position,
      civil_status: formData.marital_status,
      education_level: formData.education_level,
      emergency_contact_name: formData.emergency_contact,
      emergency_contact_phone: formData.emergency_phone,
      member_since: formData.membership_date || null,
      photo_url: profileImageUrl,
      avatar_url: profileImageUrl
    };

    if (initialData) {
      updatePessoa.mutate({ id: initialData.id, data: pessoaData }, {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        }
      });
    } else {
      createPessoa.mutate(pessoaData, {
        onSuccess: () => {
          // Reset form only if not editing
          setFormData({
            full_name: "",
            email: "",
            cpf: "",
            phone: "",
            birth_date: "",
            address: "",
            bio: "",
            role: "membro",
            congregation_id: "",
            position: "",
            specialization: "",
            is_active: true,
            education_level: "",
            marital_status: "",
            emergency_contact: "",
            emergency_phone: "",
            baptism_date: "",
            membership_date: "",
            status: "ativo",
            absence_alerts: true,
            password: ""
          });

          // Reset image states
          setProfileImage(null);
          setProfileImageUrl(null);
          
          onSuccess?.();
          onClose();
        }
      });
    }
  };

  const handleImageSelected = (file: File) => {
    setProfileImage(file);
    const url = URL.createObjectURL(file);
    setProfileImageUrl(url);
  };

  const removeImage = () => {
    if (profileImageUrl) {
      URL.revokeObjectURL(profileImageUrl);
    }
    setProfileImage(null);
    setProfileImageUrl(null);
  };

  const changeRole = (newRole: string) => {
    setFormData(prev => ({ ...prev, role: newRole as any }));
    
    // Alert about role changes
    if (newRole === 'aluno') {
      toast({
        title: "Função alterada para Aluno",
        description: "Agora será possível acompanhar frequência e notas acadêmicas.",
      });
    } else if (newRole === 'membro') {
      toast({
        title: "Função alterada para Membro",
        description: "Agora terá acesso às funcionalidades de membro da congregação.",
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {initialData ? "Editar Pessoa" : "Nova Pessoa"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto do Perfil */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Foto do Perfil</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {formData.full_name ? getInitials(formData.full_name) : <Camera className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                {profileImageUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeImage}
                  >
                    ×
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageEditor(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {profileImageUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Clique para selecionar uma imagem ou tirar uma foto
                </p>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Ex: João Silva Santos"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email 
                  {['admin', 'professor', 'coordenador', 'secretario'].includes(formData.role) && ' *'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Ex: joao@email.com"
                  required={['admin', 'professor', 'coordenador', 'secretario'].includes(formData.role)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="marital_status">Estado Civil</Label>
                <Select value={formData.marital_status} onValueChange={(value) => setFormData({...formData, marital_status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de senha condicional para perfis administrativos */}
              {['admin', 'professor', 'coordenador', 'secretario'].includes(formData.role) && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Digite uma senha segura"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Necessário para perfis administrativos acessarem por email/senha
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Ex: Rua das Flores, 123 - Centro"
              />
            </div>
          </div>

          {/* Dados Eclesiásticos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados Eclesiásticos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Cargo/Função *</Label>
                <Select value={formData.role} onValueChange={changeRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Diretor</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="secretario">Secretário</SelectItem>
                    <SelectItem value="aluno">Aluno</SelectItem>
                    <SelectItem value="membro">Membro</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Role Change Actions */}
                {formData.role && (
                  <div className="flex gap-2 mt-2">
                    {formData.role === 'aluno' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => changeRole('membro')}
                        className="flex items-center gap-1"
                      >
                        <UserCheck className="h-3 w-3" />
                        Promover a Membro
                      </Button>
                    )}
                    {formData.role === 'membro' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => changeRole('aluno')}
                        className="flex items-center gap-1"
                      >
                        <UserMinus className="h-3 w-3" />
                        Alterar para Aluno
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="congregation_id">Congregação</Label>
                <Select value={formData.congregation_id} onValueChange={(value) => setFormData({...formData, congregation_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((congregation) => (
                      <SelectItem key={congregation.id} value={congregation.id}>
                        {congregation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Posição/Ministério</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Ex: Diácono, Presbítero, Líder de Louvor"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baptism_date">Data do Batismo</Label>
                <Input
                  id="baptism_date"
                  type="date"
                  value={formData.baptism_date}
                  onChange={(e) => setFormData({...formData, baptism_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="membership_date">Data de Entrada</Label>
                <Input
                  id="membership_date"
                  type="date"
                  value={formData.membership_date}
                  onChange={(e) => setFormData({...formData, membership_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="education_level">Nível de Escolaridade</Label>
                <Select value={formData.education_level} onValueChange={(value) => setFormData({...formData, education_level: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                    <SelectItem value="medio">Ensino Médio</SelectItem>
                    <SelectItem value="superior">Ensino Superior</SelectItem>
                    <SelectItem value="pos-graduacao">Pós-Graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contato de Emergência */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato de Emergência</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Nome do Contato</Label>
                <Input
                  id="emergency_contact"
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  placeholder="Ex: Maria Silva"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Telefone do Contato</Label>
                <Input
                  id="emergency_phone"
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Controle de Status e Ausências */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Controle de Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="transferido">Transferido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alertas de Ausência</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.absence_alerts}
                    onCheckedChange={(checked) => setFormData({...formData, absence_alerts: checked})}
                  />
                  <Label className="text-sm">
                    Receber alertas quando faltar às atividades
                  </Label>
                </div>
              </div>
            </div>

            {(formData.role === 'aluno' || formData.role === 'membro') && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Como {formData.role}, será possível registrar ausências por viagem ou outros motivos,
                    permitindo melhor controle de frequência.
                  </AlertDescription>
                </Alert>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAbsenceControl(true)}
                  className="w-full"
                >
                  Configurar Controle de Ausências
                </Button>
              </>
            )}
          </div>

          {/* Informações Acadêmicas */}
          {(formData.role === "professor" || formData.role === "coordenador") && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Acadêmicas</h3>
              <div className="space-y-2">
                <Label htmlFor="specialization">Especialização</Label>
                <Input
                  id="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="Ex: Teologia Sistemática, Educação Cristã"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia/Observações</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Informações adicionais sobre a pessoa..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.full_name || !formData.cpf || (['admin', 'professor', 'coordenador', 'secretario'].includes(formData.role) && !formData.email)} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {initialData ? "Atualizando..." : "Cadastrando..."}
                </>
              ) : (
                initialData ? "Atualizar Pessoa" : "Cadastrar Pessoa"
              )}
            </Button>
          </div>
        </form>

        {/* Image Upload Editor */}
        <ImageUploadEditor
          isOpen={showImageEditor}
          onClose={() => setShowImageEditor(false)}
          onImageSelected={handleImageSelected}
          title="Selecionar Foto do Perfil"
          aspectRatio={1} // Square aspect ratio for profile pictures
        />

        {/* Scheduled Absence Manager */}
        {initialData && formData.full_name && (
          <Dialog open={showAbsenceControl} onOpenChange={setShowAbsenceControl}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurar Ausência Programada</DialogTitle>
              </DialogHeader>
              <ScheduledAbsenceManager
                personId={initialData.id}
                personName={formData.full_name}
                currentAbsenceData={{
                  isAbsent: initialData.is_absent || false,
                  reason: initialData.absence_reason,
                  startDate: initialData.absence_start_date,
                  endDate: initialData.absence_end_date
                }}
                onAbsenceUpdate={() => {
                  toast({
                    title: "Configuração salva",
                    description: "As configurações de ausência foram aplicadas.",
                  });
                  setShowAbsenceControl(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}