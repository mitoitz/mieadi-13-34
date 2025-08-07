import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, File, Video, Image, Link, Trash2, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MaterialUploadProps {
  professorId: string;
  turmas: any[];
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  external_url?: string;
  turma_id: string;
  turma_name?: string;
  created_at: string;
  file_size?: number;
}

export function MaterialUpload({ professorId, turmas }: MaterialUploadProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_materials')
        .select(`
          *,
          classes (name)
        `)
        .eq('uploaded_by', professorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const materialsWithTurma = data?.map(material => ({
        ...material,
        turma_id: material.class_id, // Map class_id to turma_id for compatibility
        turma_name: material.classes?.name || 'Turma não encontrada'
      })) || [];

      setMaterials(materialsWithTurma);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error("Erro ao carregar materiais");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !selectedTurma) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (uploadMode === "file" && !file) {
      toast.error("Selecione um arquivo");
      return;
    }

    if (uploadMode === "link" && !externalUrl) {
      toast.error("Informe o link externo");
      return;
    }

    try {
      setLoading(true);
      let fileUrl = "";
      let fileType = "";
      let fileSize = 0;

      if (uploadMode === "file" && file) {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `materials/${professorId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileType = file.type;
        fileSize = file.size;
      } else {
        fileUrl = externalUrl;
        fileType = "external_link";
      }

      // Save material metadata to database
      const { error } = await supabase
        .from('class_materials')
        .insert({
          title,
          description,
          file_type: fileType,
          file_url: fileUrl,
          file_size: fileSize,
          class_id: selectedTurma,
          uploaded_by: professorId,
          is_public: false
        });

      if (error) throw error;

      toast.success("Material enviado com sucesso!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedTurma("");
      setFile(null);
      setExternalUrl("");
      
      // Reload materials
      loadMaterials();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error("Erro ao enviar material");
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('class_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast.success("Material removido com sucesso!");
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error("Erro ao remover material");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "external_link") return <Link className="h-4 w-4" />;
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Material *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Apostila - Módulo 1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turma">Turma *</Label>
                <Select value={selectedTurma} onValueChange={setSelectedTurma} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o conteúdo do material..."
                rows={3}
              />
            </div>

            {/* Upload Mode Selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={uploadMode === "file" ? "default" : "outline"}
                onClick={() => setUploadMode("file")}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload de Arquivo
              </Button>
              <Button
                type="button"
                variant={uploadMode === "link" ? "default" : "outline"}
                onClick={() => setUploadMode("link")}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                Link Externo
              </Button>
            </div>

            {uploadMode === "file" ? (
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Formatos suportados: PDF, DOC, DOCX, PPT, PPTX, imagens, vídeos, áudio, ZIP
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="url">Link Externo *</Label>
                <Input
                  id="url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://exemplo.com/material"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Ex: YouTube, Google Drive, Dropbox, sites educacionais
                </p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Enviar Material"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materiais Enviados</CardTitle>
          <Button onClick={loadMaterials} variant="outline" size="sm">
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center p-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum material enviado</h3>
              <p className="text-muted-foreground">
                Comece enviando materiais para suas turmas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.title}</p>
                          {material.description && (
                            <p className="text-sm text-muted-foreground">
                              {material.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.turma_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(material.file_type)}
                          <span className="text-sm">
                            {material.file_type === "external_link" ? "Link" : material.file_type.split('/')[0]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {material.file_size ? formatFileSize(material.file_size) : "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(material.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(material.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMaterial(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}