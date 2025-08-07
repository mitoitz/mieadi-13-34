import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateRequest {
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'set_default';
  template_id?: string;
  template_data?: {
    name: string;
    description?: string;
    template_type: 'attendance' | 'payment' | 'certificate';
    template_data: any;
    paper_size?: string;
    is_active?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, template_id, template_data }: TemplateRequest = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'list':
        result = await listTemplates(supabaseClient, req);
        break;
      case 'get':
        result = await getTemplate(supabaseClient, template_id);
        break;
      case 'create':
        result = await createTemplate(supabaseClient, template_data, req);
        break;
      case 'update':
        result = await updateTemplate(supabaseClient, template_id, template_data, req);
        break;
      case 'delete':
        result = await deleteTemplate(supabaseClient, template_id, req);
        break;
      case 'set_default':
        result = await setDefaultTemplate(supabaseClient, template_id, req);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in receipt-templates function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function listTemplates(supabaseClient: any, req: Request) {
  const url = new URL(req.url);
  const templateType = url.searchParams.get('type');
  const activeOnly = url.searchParams.get('active_only') === 'true';

  let query = supabaseClient
    .from('receipt_templates')
    .select(`
      id,
      name,
      description,
      template_type,
      paper_size,
      is_default,
      is_active,
      created_at,
      updated_at,
      profiles!receipt_templates_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (templateType) {
    query = query.eq('template_type', templateType);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data: templates, error } = await query;

  if (error) {
    throw error;
  }

  return {
    success: true,
    templates: templates.map(template => ({
      ...template,
      created_by_name: template.profiles?.full_name,
      profiles: undefined, // Remove dados nested
    })),
    total: templates.length,
  };
}

async function getTemplate(supabaseClient: any, templateId: string) {
  if (!templateId) {
    return { error: 'template_id é obrigatório', status: 400 };
  }

  const { data: template, error } = await supabaseClient
    .from('receipt_templates')
    .select(`
      *,
      profiles!receipt_templates_created_by_fkey(id, full_name)
    `)
    .eq('id', templateId)
    .single();

  if (error || !template) {
    return { error: 'Template não encontrado', status: 404 };
  }

  return {
    success: true,
    template: {
      ...template,
      created_by_name: template.profiles?.full_name,
      profiles: undefined,
    },
  };
}

async function createTemplate(supabaseClient: any, templateData: any, req: Request) {
  if (!templateData) {
    return { error: 'template_data é obrigatório', status: 400 };
  }

  const { name, description, template_type, template_data: data, paper_size, is_active } = templateData;

  if (!name || !template_type || !data) {
    return { error: 'name, template_type e template_data são obrigatórios', status: 400 };
  }

  // Validar template_data
  const validationResult = validateTemplateData(data, template_type);
  if (!validationResult.valid) {
    return { error: validationResult.error, status: 400 };
  }

  // Obter usuário atual
  const { data: { user } } = await supabaseClient.auth.getUser();

  const insertData = {
    name,
    description,
    template_type,
    template_data: data,
    paper_size: paper_size || 'thermal_58mm',
    is_active: is_active !== false,
    created_by: user?.id,
  };

  const { data: newTemplate, error } = await supabaseClient
    .from('receipt_templates')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(`Template created: ${newTemplate.name} (${newTemplate.id})`);

  return {
    success: true,
    message: 'Template criado com sucesso',
    template: newTemplate,
  };
}

async function updateTemplate(supabaseClient: any, templateId: string, templateData: any, req: Request) {
  if (!templateId) {
    return { error: 'template_id é obrigatório', status: 400 };
  }

  if (!templateData) {
    return { error: 'template_data é obrigatório', status: 400 };
  }

  // Verificar se template existe
  const { data: existingTemplate, error: fetchError } = await supabaseClient
    .from('receipt_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError || !existingTemplate) {
    return { error: 'Template não encontrado', status: 404 };
  }

  const { name, description, template_type, template_data: data, paper_size, is_active } = templateData;

  // Validar template_data se fornecido
  if (data && template_type) {
    const validationResult = validateTemplateData(data, template_type);
    if (!validationResult.valid) {
      return { error: validationResult.error, status: 400 };
    }
  }

  const updateData: any = {};
  
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (template_type !== undefined) updateData.template_type = template_type;
  if (data !== undefined) updateData.template_data = data;
  if (paper_size !== undefined) updateData.paper_size = paper_size;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: updatedTemplate, error } = await supabaseClient
    .from('receipt_templates')
    .update(updateData)
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(`Template updated: ${updatedTemplate.name} (${updatedTemplate.id})`);

  return {
    success: true,
    message: 'Template atualizado com sucesso',
    template: updatedTemplate,
  };
}

async function deleteTemplate(supabaseClient: any, templateId: string, req: Request) {
  if (!templateId) {
    return { error: 'template_id é obrigatório', status: 400 };
  }

  // Verificar se template existe e não é padrão
  const { data: template, error: fetchError } = await supabaseClient
    .from('receipt_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError || !template) {
    return { error: 'Template não encontrado', status: 404 };
  }

  if (template.is_default) {
    return { error: 'Não é possível excluir template padrão', status: 400 };
  }

  // Verificar se está em uso
  const { count } = await supabaseClient
    .from('attendance_receipts')
    .select('*', { count: 'exact' })
    .eq('template_id', templateId);

  if (count && count > 0) {
    return { 
      error: 'Template está em uso e não pode ser excluído',
      receipts_count: count,
      status: 400 
    };
  }

  const { error } = await supabaseClient
    .from('receipt_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    throw error;
  }

  console.log(`Template deleted: ${template.name} (${templateId})`);

  return {
    success: true,
    message: 'Template excluído com sucesso',
  };
}

async function setDefaultTemplate(supabaseClient: any, templateId: string, req: Request) {
  if (!templateId) {
    return { error: 'template_id é obrigatório', status: 400 };
  }

  // Verificar se template existe e está ativo
  const { data: template, error: fetchError } = await supabaseClient
    .from('receipt_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError || !template) {
    return { error: 'Template não encontrado', status: 404 };
  }

  if (!template.is_active) {
    return { error: 'Não é possível definir template inativo como padrão', status: 400 };
  }

  // Remover padrão de outros templates do mesmo tipo
  await supabaseClient
    .from('receipt_templates')
    .update({ is_default: false })
    .eq('template_type', template.template_type);

  // Definir novo padrão
  const { error } = await supabaseClient
    .from('receipt_templates')
    .update({ is_default: true })
    .eq('id', templateId);

  if (error) {
    throw error;
  }

  console.log(`Default template set: ${template.name} (${templateId})`);

  return {
    success: true,
    message: 'Template definido como padrão',
    template,
  };
}

function validateTemplateData(data: any, templateType: string): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'template_data deve ser um objeto' };
  }

  switch (templateType) {
    case 'attendance':
      return validateAttendanceTemplate(data);
    case 'payment':
      return validatePaymentTemplate(data);
    case 'certificate':
      return validateCertificateTemplate(data);
    default:
      return { valid: false, error: 'template_type inválido' };
  }
}

function validateAttendanceTemplate(data: any): { valid: boolean; error?: string } {
  const requiredFields = ['header', 'body', 'footer'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `Campo ${field} é obrigatório no template de frequência` };
    }
  }

  if (!data.header.title) {
    return { valid: false, error: 'header.title é obrigatório' };
  }

  if (!data.body.fields || !Array.isArray(data.body.fields)) {
    return { valid: false, error: 'body.fields deve ser um array' };
  }

  return { valid: true };
}

function validatePaymentTemplate(data: any): { valid: boolean; error?: string } {
  const requiredFields = ['header', 'body', 'footer'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `Campo ${field} é obrigatório no template de pagamento` };
    }
  }

  return { valid: true };
}

function validateCertificateTemplate(data: any): { valid: boolean; error?: string } {
  const requiredFields = ['header', 'body', 'footer'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `Campo ${field} é obrigatório no template de certificado` };
    }
  }

  return { valid: true };
}