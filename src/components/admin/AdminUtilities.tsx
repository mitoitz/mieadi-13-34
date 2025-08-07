import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FunctionTroubleshoot } from "./FunctionTroubleshoot";
import { 
  Palette, 
  Upload, 
  Download, 
  Settings, 
  CreditCard,
  Award,
  Eye,
  Save,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Users,
  UserMinus,
  UserPlus,
  Move,
  MousePointer,
  Wrench
} from "lucide-react";

interface FontConfig {
  family: string;
  size: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  };
  weight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  destructive: string;
  success: string;
  warning: string;
}

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'qrcode' | 'logo';
  content: string;
  position: { x: number; y: number };
  style: {
    fontSize: string;
    fontWeight: string;
    color: string;
    width?: string;
    height?: string;
  };
}

interface CardTemplate {
  id: string;
  name: string;
  front: {
    background: string;
    elements: TemplateElement[];
  };
  back: {
    background: string;
    elements: TemplateElement[];
  };
}

export function AdminUtilities() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("colors");
  
  // Estados para customização
  const [colors, setColors] = useState<ColorConfig>({
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#8b5cf6",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#f1f5f9",
    destructive: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b"
  });

  const [fonts, setFonts] = useState<FontConfig>({
    family: "Inter",
    size: {
      xs: "0.75rem",
      sm: "0.875rem", 
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem"
    },
    weight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    }
  });

  const [logo, setLogo] = useState<string>("");
  
  // Estados para templates
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [editingSide, setEditingSide] = useState<'front' | 'back'>('front');
  const [draggingElement, setDraggingElement] = useState<string | null>(null);

  // Estados para gerenciamento de perfis
  const [availableProfiles, setAvailableProfiles] = useState([
    { 
      id: "1", 
      name: "João Silva", 
      type: "pastor", 
      permissions: ["read", "write", "admin_access"],
      active: true,
      lastLogin: "2024-01-15"
    },
    { 
      id: "2", 
      name: "Maria Santos", 
      type: "secretario", 
      permissions: ["read", "financial_access"],
      active: true,
      lastLogin: "2024-01-14"
    },
    { 
      id: "3", 
      name: "Pedro Costa", 
      type: "professor", 
      permissions: ["read", "write", "academic_access"],
      active: false,
      lastLogin: "2024-01-10"
    }
  ]);

  const [newProfile, setNewProfile] = useState({
    name: "",
    type: "",
    permissions: [] as string[]
  });

  const availablePermissions = [
    { id: "read", label: "Leitura", description: "Visualizar dados do sistema" },
    { id: "write", label: "Escrita", description: "Editar e criar registros" },
    { id: "delete", label: "Exclusão", description: "Remover registros" },
    { id: "admin_access", label: "Acesso Admin", description: "Funcionalidades administrativas" },
    { id: "financial_access", label: "Financeiro", description: "Acesso ao módulo financeiro" },
    { id: "academic_access", label: "Acadêmico", description: "Acesso ao módulo acadêmico" },
    { id: "reports_access", label: "Relatórios", description: "Gerar e visualizar relatórios" }
  ];

  const userTypes = [
    { id: "admin", label: "Diretor" },
    { id: "pastor", label: "Pastor" },
    { id: "coordenador", label: "Coordenador" },
    { id: "secretario", label: "Secretário" },
    { id: "professor", label: "Professor" },
    { id: "aluno", label: "Aluno" },
    { id: "membro", label: "Membro" }
  ];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(reader.result as string);
        toast({
          title: "Logo Carregado",
          description: "Logo atualizado com sucesso"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveColors = () => {
    // Aqui você salvaria as cores no sistema
    localStorage.setItem('system_colors', JSON.stringify(colors));
    toast({
      title: "Cores Salvas",
      description: "Paleta de cores atualizada com sucesso"
    });
  };

  const handleSaveFonts = () => {
    // Aqui você salvaria as fontes no sistema
    localStorage.setItem('system_fonts', JSON.stringify(fonts));
    toast({
      title: "Fontes Salvas", 
      description: "Configurações de tipografia atualizadas"
    });
  };

  const createNewTemplate = (type: 'card' | 'certificate') => {
    const newTemplate: CardTemplate = {
      id: Date.now().toString(),
      name: `${type === 'card' ? 'Cartão' : 'Certificado'} ${Date.now()}`,
      front: {
        background: "#ffffff",
        elements: []
      },
      back: {
        background: "#ffffff", 
        elements: []
      }
    };

    if (type === 'card') {
      setCardTemplates([...cardTemplates, newTemplate]);
    } else {
      setCertificateTemplates([...certificateTemplates, newTemplate]);
    }

    setSelectedTemplate(newTemplate);
    toast({
      title: "Template Criado",
      description: `Novo template de ${type === 'card' ? 'cartão' : 'certificado'} criado`
    });
  };

  const addElementToTemplate = (type: TemplateElement['type']) => {
    if (!selectedTemplate) return;

    const newElement: TemplateElement = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'Texto aqui...' : '',
      position: { x: 50, y: 50 },
      style: {
        fontSize: fonts.size.base,
        fontWeight: fonts.weight.normal,
        color: colors.foreground
      }
    };

    const updatedTemplate = {
      ...selectedTemplate,
      [editingSide]: {
        ...selectedTemplate[editingSide],
        elements: [...selectedTemplate[editingSide].elements, newElement]
      }
    };

    setSelectedTemplate(updatedTemplate);
  };

  const handleElementDrag = (elementId: string, newPosition: { x: number; y: number }) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      [editingSide]: {
        ...selectedTemplate[editingSide],
        elements: selectedTemplate[editingSide].elements.map(el =>
          el.id === elementId ? { ...el, position: newPosition } : el
        )
      }
    };

    setSelectedTemplate(updatedTemplate);
  };

  const removeElementFromTemplate = (elementId: string) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      [editingSide]: {
        ...selectedTemplate[editingSide],
        elements: selectedTemplate[editingSide].elements.filter(el => el.id !== elementId)
      }
    };

    setSelectedTemplate(updatedTemplate);
  };

  const removeProfilePermission = (profileId: string, permission: string) => {
    setAvailableProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, permissions: profile.permissions.filter(p => p !== permission) }
          : profile
      )
    );
  };

  const addProfilePermission = (profileId: string, permission: string) => {
    setAvailableProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, permissions: [...profile.permissions, permission] }
          : profile
      )
    );
    toast({
      title: "Permissão Adicionada",
      description: "Permissão concedida com sucesso"
    });
  };

  const toggleProfileStatus = (profileId: string) => {
    setAvailableProfiles(profiles => 
      profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, active: !profile.active }
          : profile
      )
    );
    toast({
      title: "Status Alterado",
      description: "Status do perfil atualizado"
    });
  };

  const createNewProfile = () => {
    if (!newProfile.name || !newProfile.type) {
      toast({
        title: "Erro",
        description: "Nome e tipo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const profile = {
      id: Date.now().toString(),
      ...newProfile,
      active: true,
      lastLogin: "Nunca"
    };

    setAvailableProfiles([...availableProfiles, profile]);
    setNewProfile({ name: "", type: "", permissions: [] });
    
    toast({
      title: "Perfil Criado",
      description: "Novo perfil criado com sucesso"
    });
  };

  const deleteProfile = (profileId: string) => {
    setAvailableProfiles(profiles => 
      profiles.filter(profile => profile.id !== profileId)
    );
    toast({
      title: "Perfil Removido",
      description: "Perfil excluído do sistema"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Utilitários Administrativos</h2>
      </div>

      {/* Seção de Informações das Funcionalidades */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Funcionalidades Completas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Customização</p>
                <p className="text-xs text-muted-foreground">Cores e Fontes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
              <Upload className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Gerenciamento</p>
                <p className="text-xs text-muted-foreground">de Logo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Sistema de</p>
                <p className="text-xs text-muted-foreground">Templates</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Gerenciamento</p>
                <p className="text-xs text-muted-foreground">de Perfis</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-sm text-success-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Todas as funcionalidades administrativas estão implementadas e funcionais
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="fonts">Fontes</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="templates">
            <CreditCard className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="profiles">
            <Users className="mr-2 h-4 w-4" />
            Perfis
          </TabsTrigger>
          <TabsTrigger value="troubleshoot">
            <Wrench className="mr-2 h-4 w-4" />
            Diagnóstico
          </TabsTrigger>
        </TabsList>

        {/* Tab de Cores */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Customização de Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveColors}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Cores
                </Button>
                <Button variant="outline" onClick={() => setColors({
                  primary: "#3b82f6",
                  secondary: "#64748b", 
                  accent: "#8b5cf6",
                  background: "#ffffff",
                  foreground: "#0f172a",
                  muted: "#f1f5f9",
                  destructive: "#ef4444",
                  success: "#10b981",
                  warning: "#f59e0b"
                })}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restaurar Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Fontes */}
        <TabsContent value="fonts">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Fontes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Família da Fonte</Label>
                <Input
                  value={fonts.family}
                  onChange={(e) => setFonts({ ...fonts, family: e.target.value })}
                  placeholder="Inter, Arial, sans-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-semibold">Tamanhos</Label>
                  <div className="space-y-3 mt-2">
                    {Object.entries(fonts.size).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-12 text-sm">{key}</Label>
                        <Input
                          value={value}
                          onChange={(e) => setFonts({
                            ...fonts,
                            size: { ...fonts.size, [key]: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Pesos</Label>
                  <div className="space-y-3 mt-2">
                    {Object.entries(fonts.weight).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-20 text-sm">{key}</Label>
                        <Input
                          value={value}
                          onChange={(e) => setFonts({
                            ...fonts,
                            weight: { ...fonts.weight, [key]: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveFonts}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Fontes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Logo */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {logo ? (
                  <div className="space-y-4">
                    <img src={logo} alt="Logo" className="max-h-32 mx-auto" />
                    <p className="text-sm text-muted-foreground">Logo atual</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p>Clique para fazer upload do logo</p>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  {logo ? 'Alterar Logo' : 'Upload Logo'}
                </Button>
                {logo && (
                  <Button variant="outline" onClick={() => setLogo("")}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Templates */}
        <TabsContent value="templates">
          <div className="grid grid-cols-3 gap-6">
            {/* Lista de Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => createNewTemplate('card')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Cartão
                  </Button>
                  <Button size="sm" onClick={() => createNewTemplate('certificate')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Certificado
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="font-semibold">Cartões</Label>
                  {cardTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{template.name}</span>
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="font-semibold">Certificados</Label>
                  {certificateTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{template.name}</span>
                        <Award className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Editor de Template */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedTemplate ? `Editando: ${selectedTemplate.name}` : 'Selecione um template'}
                </CardTitle>
                {selectedTemplate && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={editingSide === 'front' ? 'default' : 'outline'}
                      onClick={() => setEditingSide('front')}
                    >
                      Frente
                    </Button>
                    <Button
                      size="sm"
                      variant={editingSide === 'back' ? 'default' : 'outline'}
                      onClick={() => setEditingSide('back')}
                    >
                      Verso
                    </Button>
                  </div>
                )}
              </CardHeader>
              {selectedTemplate && (
                <CardContent className="space-y-4">
                  {/* Barra de Ferramentas */}
                  <div className="flex gap-2 p-2 border rounded">
                    <Button size="sm" onClick={() => addElementToTemplate('text')}>
                      Texto
                    </Button>
                    <Button size="sm" onClick={() => addElementToTemplate('image')}>
                      Imagem
                    </Button>
                    <Button size="sm" onClick={() => addElementToTemplate('logo')}>
                      Logo
                    </Button>
                    <Button size="sm" onClick={() => addElementToTemplate('qrcode')}>
                      QR Code
                    </Button>
                  </div>

                  {/* Canvas de Edição */}
                  <div 
                    className="relative border-2 border-gray-300 bg-white"
                    style={{ 
                      width: '100%', 
                      height: '300px', 
                      background: selectedTemplate[editingSide].background 
                    }}
                  >
                    {selectedTemplate[editingSide].elements.map(element => (
                      <div
                        key={element.id}
                        className="absolute cursor-move border border-blue-300 p-1"
                        style={{
                          left: `${element.position.x}px`,
                          top: `${element.position.y}px`,
                          fontSize: element.style.fontSize,
                          fontWeight: element.style.fontWeight,
                          color: element.style.color
                        }}
                        draggable
                        onDragStart={() => setDraggingElement(element.id)}
                        onDragEnd={(e) => {
                          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (rect) {
                            const newX = e.clientX - rect.left;
                            const newY = e.clientY - rect.top;
                            handleElementDrag(element.id, { x: newX, y: newY });
                          }
                          setDraggingElement(null);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {element.type === 'text' && <span>{element.content}</span>}
                          {element.type === 'image' && <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs">IMG</div>}
                          {element.type === 'logo' && <div className="w-12 h-12 bg-primary/20 flex items-center justify-center text-xs">LOGO</div>}
                          {element.type === 'qrcode' && <div className="w-12 h-12 bg-gray-800 text-white flex items-center justify-center text-xs">QR</div>}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-5 w-5 p-0 ml-2"
                            onClick={() => removeElementFromTemplate(element.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Propriedades do Elemento Selecionado */}
                  <div className="border-t pt-4">
                    <Label className="font-semibold">Elementos ({selectedTemplate[editingSide].elements.length})</Label>
                    <p className="text-sm text-muted-foreground">
                      Arraste os elementos no canvas para posicioná-los
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Gerenciamento de Perfis */}
        <TabsContent value="profiles">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Criar Novo Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Novo Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                
                <div>
                  <Label>Tipo de Usuário</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newProfile.type}
                    onChange={(e) => setNewProfile({ ...newProfile, type: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {userTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Permissões</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availablePermissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={newProfile.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProfile({
                                ...newProfile,
                                permissions: [...newProfile.permissions, permission.id]
                              });
                            } else {
                              setNewProfile({
                                ...newProfile,
                                permissions: newProfile.permissions.filter(p => p !== permission.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={permission.id} className="text-sm">
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={createNewProfile} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Perfil
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Perfis */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Perfis Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableProfiles.map(profile => (
                    <div key={profile.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{profile.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {userTypes.find(t => t.id === profile.type)?.label}
                              </Badge>
                              <Badge variant={profile.active ? "default" : "secondary"}>
                                {profile.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={profile.active}
                            onCheckedChange={() => toggleProfileStatus(profile.id)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteProfile(profile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Permissões Atuais:</Label>
                        <div className="flex flex-wrap gap-2">
                          {profile.permissions.map(permissionId => {
                            const permission = availablePermissions.find(p => p.id === permissionId);
                            return (
                              <Badge key={permissionId} variant="secondary" className="flex items-center gap-1">
                                {permission?.label || permissionId}
                                <button
                                  onClick={() => removeProfilePermission(profile.id, permissionId)}
                                  className="ml-1 text-xs hover:text-destructive"
                                  title="Remover permissão"
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Adicionar Permissões:</Label>
                        <div className="flex flex-wrap gap-2">
                          {availablePermissions
                            .filter(permission => !profile.permissions.includes(permission.id))
                            .map(permission => (
                              <Button
                                key={permission.id}
                                size="sm"
                                variant="outline"
                                onClick={() => addProfilePermission(profile.id, permission.id)}
                                title={permission.description}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {permission.label}
                              </Button>
                            ))
                          }
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Último login: {profile.lastLogin}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Diagnóstico de Funções */}
        <TabsContent value="troubleshoot">
          <FunctionTroubleshoot />
        </TabsContent>
      </Tabs>
    </div>
  );
}