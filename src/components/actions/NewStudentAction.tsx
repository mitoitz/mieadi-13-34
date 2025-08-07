
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Camera, Upload, AlertTriangle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { pessoasService } from "@/services/pessoas.service";
import { congregacoesService } from "@/services/congregacoes.service";
import { ImageUploadEditor } from "@/components/ui/image-upload-editor";
import { AbsenceControl } from "@/components/ui/absence-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { NovaPessoa } from "@/services/pessoas.service";

interface NewStudentActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewStudentAction({ isOpen, onClose, onSuccess }: NewStudentActionProps) {
  const [loading, setLoading] = useState(false);
  const [congregations, setCongregations] = useState<any[]>([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showAbsenceControl, setShowAbsenceControl] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    address: "",
    congregation_id: "",
    bio: "",
    status: "ativo",
    absence_alerts: true
  });
  const { toast } = useToast();

  // Load congregations on component mount
  useEffect(() => {
    const loadCongregations = async () => {
      try {
        const data = await congregacoesService.listar();
        setCongregations(data);
      } catch (error) {
        console.error('Error loading congregations:', error);
      }
    };
    
    if (isOpen) {
      loadCongregations();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the student data using the pessoas service
      const studentData: NovaPessoa = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        cpf: formData.cpf,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        congregation_id: formData.congregation_id || null,
        bio: formData.bio || null,
        role: 'aluno',
        status: 'ativo'
        // Remove id - let Supabase generate it automatically
      };

      // Use the pessoas service instead of direct Supabase call
      await pessoasService.criar(studentData);

      toast({
        title: "Aluno cadastrado com sucesso!",
        description: `${formData.full_name} foi adicionado ao sistema.`,
      });

      setFormData({
        full_name: "",
        email: "",
        phone: "",
        cpf: "",
        birth_date: "",
        address: "",
        congregation_id: "",
        bio: "",
        status: "ativo",
        absence_alerts: true
      });

      // Reset image states
      setProfileImage(null);
      setProfileImageUrl(null);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Erro ao cadastrar aluno",
        description: "Ocorreu um erro ao criar o aluno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'A';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Aluno
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto do Perfil */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Foto do Aluno</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="congregation_id">Congregação</Label>
              <Select value={formData.congregation_id} onValueChange={(value) => setFormData({ ...formData, congregation_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma congregação" />
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
          </div>
          
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
                    Receber alertas quando faltar às aulas
                  </Label>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Como aluno, será possível registrar ausências por viagem ou outros motivos,
                permitindo melhor controle de frequência nas aulas.
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
          </div>

          <div>
            <Label htmlFor="bio">Observações</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Informações adicionais sobre o aluno..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Aluno"}
            </Button>
          </div>
        </form>

        {/* Image Upload Editor */}
        <ImageUploadEditor
          isOpen={showImageEditor}
          onClose={() => setShowImageEditor(false)}
          onImageSelected={handleImageSelected}
          title="Selecionar Foto do Aluno"
          aspectRatio={1} // Square aspect ratio for profile pictures
        />

        {/* Absence Control */}
        {formData.full_name && (
          <AbsenceControl
            isOpen={showAbsenceControl}
            onClose={() => setShowAbsenceControl(false)}
            personId="new-student"
            personName={formData.full_name}
            onAbsenceUpdated={() => {
              toast({
                title: "Configuração salva",
                description: "As configurações de ausência foram aplicadas.",
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
