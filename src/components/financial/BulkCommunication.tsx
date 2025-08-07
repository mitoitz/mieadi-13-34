import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Mail, Phone, Send, Users } from "lucide-react";
import { communicationService, ContactInfo } from "@/services/communication.service";
import { toast } from "sonner";

interface BulkCommunicationProps {
  defaulters: any[];
  trigger?: React.ReactNode;
}

export function BulkCommunication({ defaulters, trigger }: BulkCommunicationProps) {
  const [open, setOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [communicationType, setCommunicationType] = useState<'email' | 'whatsapp'>('email');
  const [templateType, setTemplateType] = useState<'payment_reminder' | 'overdue_notice'>('payment_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSelectAll = () => {
    if (selectedContacts.length === defaulters.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(defaulters.map(d => d.id));
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getSelectedDefaulters = () => {
    return defaulters.filter(d => selectedContacts.includes(d.id));
  };

  const handleSendBulk = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato");
      return;
    }

    setSending(true);
    
    try {
      const selectedDefaultersList = getSelectedDefaulters();
      const contacts: ContactInfo[] = selectedDefaultersList.map(defaulter => ({
        id: defaulter.id,
        name: defaulter.student.name,
        email: defaulter.student.email,
        phone: defaulter.student.phone
      }));

      if (useCustomMessage && communicationType === 'whatsapp') {
        // Send custom WhatsApp messages
        for (const contact of contacts) {
          await communicationService.sendWhatsApp(contact, customMessage);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between sends
        }
        toast.success(`Mensagens enviadas para ${contacts.length} contatos`);
      } else {
        // Send template messages
        const result = await communicationService.sendBulkReminders(
          contacts, 
          communicationType, 
          templateType
        );
        
        toast.success(
          `Envio concluído: ${result.successCount} sucessos, ${result.errorCount} erros`
        );
      }

      // Log contact attempts
      for (const defaulter of selectedDefaultersList) {
        await communicationService.logContactAttempt(
          defaulter.student.id, 
          communicationType, 
          true
        );
      }

      setOpen(false);
      setSelectedContacts([]);
    } catch (error) {
      console.error('Error sending bulk communication:', error);
      toast.error("Erro ao enviar comunicação em lote");
    } finally {
      setSending(false);
    }
  };

  const getTemplatePreview = () => {
    return communicationService.getTemplatePreview(templateType, communicationType);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Enviar Lembrete em Lote
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comunicação em Lote - Inadimplentes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuração da Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Comunicação</label>
                  <Select value={communicationType} onValueChange={(value: 'email' | 'whatsapp') => setCommunicationType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Mensagem</label>
                  <Select 
                    value={templateType} 
                    onValueChange={(value: 'payment_reminder' | 'overdue_notice') => setTemplateType(value)}
                    disabled={useCustomMessage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                      <SelectItem value="overdue_notice">Aviso de Vencimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="customMessage" 
                  checked={useCustomMessage}
                  onCheckedChange={(checked) => setUseCustomMessage(checked === true)}
                />
                <label htmlFor="customMessage" className="text-sm font-medium">
                  Usar mensagem personalizada
                </label>
              </div>

              {useCustomMessage ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem Personalizada</label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite sua mensagem personalizada..."
                    rows={6}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prévia da Mensagem</label>
                  <div className="p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap">{getTemplatePreview()}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Selecionar Contatos ({selectedContacts.length}/{defaulters.length})</span>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedContacts.length === defaulters.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {defaulters.map((defaulter) => (
                  <div 
                    key={defaulter.id} 
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        checked={selectedContacts.includes(defaulter.id)}
                        onCheckedChange={() => handleSelectContact(defaulter.id)}
                      />
                      <div>
                        <div className="font-medium">{defaulter.student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {communicationType === 'email' && defaulter.student.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {defaulter.student.email}
                            </span>
                          )}
                          {communicationType === 'whatsapp' && defaulter.student.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {defaulter.student.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        R$ {defaulter.overdueAmount.toFixed(2)}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {defaulter.daysSinceFirstOverdue} dias
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary and Send */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedContacts.length} contatos selecionados
                  </span>
                  {selectedContacts.length > 0 && (
                    <Badge variant="outline">
                      Total: R$ {getSelectedDefaulters().reduce((sum, d) => sum + d.overdueAmount, 0).toFixed(2)}
                    </Badge>
                  )}
                </div>
                
                <Button 
                  onClick={handleSendBulk} 
                  disabled={selectedContacts.length === 0 || sending}
                >
                  {sending ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para {selectedContacts.length} contatos
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}