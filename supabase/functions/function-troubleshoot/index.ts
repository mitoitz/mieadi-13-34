import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TroubleshootRequest {
  functionName: string
  procedureName?: string
  action: 'check_function' | 'check_permissions' | 'check_search_path' | 'suggest_fix'
}

interface TroubleshootResponse {
  success: boolean
  data?: any
  suggestion?: string
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { functionName, procedureName, action }: TroubleshootRequest = await req.json()

    console.log(`Troubleshooting function: ${functionName}, action: ${action}`)

    let result: TroubleshootResponse = { success: false }

    switch (action) {
      case 'check_function':
        result = await checkFunctionExists(supabaseClient, functionName)
        break
      
      case 'check_permissions':
        result = await checkFunctionPermissions(supabaseClient, functionName)
        break
      
      case 'check_search_path':
        result = await checkSearchPath(supabaseClient)
        break
      
      case 'suggest_fix':
        result = await suggestFix(supabaseClient, functionName, procedureName)
        break
      
      default:
        result = { success: false, error: 'Ação inválida' }
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in function-troubleshoot:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})

async function checkFunctionExists(supabaseClient: any, functionName: string): Promise<TroubleshootResponse> {
  try {
    const { data, error } = await supabaseClient.rpc('execute_sql', {
      query: `
        SELECT n.nspname AS schema, p.proname AS function_name,
               pg_get_function_result(p.oid) as return_type,
               pg_get_function_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = $1
      `,
      params: [functionName]
    })

    if (error) {
      return { success: false, error: `Erro ao verificar função: ${error.message}` }
    }

    if (!data || data.length === 0) {
      return { 
        success: false, 
        error: `Função '${functionName}' não encontrada`,
        suggestion: `Verifique se a função existe e se o nome está correto. Use: CREATE FUNCTION ${functionName}() ...`
      }
    }

    return { 
      success: true, 
      data: data[0],
      suggestion: data[0].schema !== 'public' 
        ? `Função encontrada no schema '${data[0].schema}'. Use: ${data[0].schema}.${functionName}()` 
        : `Função encontrada no schema public. Use: ${functionName}() ou public.${functionName}()`
    }
  } catch (error) {
    return { success: false, error: `Erro ao executar consulta: ${error.message}` }
  }
}

async function checkFunctionPermissions(supabaseClient: any, functionName: string): Promise<TroubleshootResponse> {
  try {
    const { data, error } = await supabaseClient.rpc('execute_sql', {
      query: `SELECT has_function_privilege(current_user, 'public.${functionName}()', 'EXECUTE') as has_permission`,
      params: []
    })

    if (error) {
      return { success: false, error: `Erro ao verificar permissões: ${error.message}` }
    }

    const hasPermission = data[0]?.has_permission

    return { 
      success: true, 
      data: { has_permission: hasPermission },
      suggestion: hasPermission 
        ? 'Usuário tem permissão para executar a função'
        : `Usuário não tem permissão. Execute: GRANT EXECUTE ON FUNCTION public.${functionName}() TO current_user`
    }
  } catch (error) {
    return { success: false, error: `Erro ao verificar permissões: ${error.message}` }
  }
}

async function checkSearchPath(supabaseClient: any): Promise<TroubleshootResponse> {
  try {
    const { data, error } = await supabaseClient.rpc('execute_sql', {
      query: 'SHOW search_path',
      params: []
    })

    if (error) {
      return { success: false, error: `Erro ao verificar search_path: ${error.message}` }
    }

    return { 
      success: true, 
      data: data[0],
      suggestion: `Search path atual: ${data[0].search_path}. Se o schema da função não estiver incluído, use o nome qualificado`
    }
  } catch (error) {
    return { success: false, error: `Erro ao verificar search_path: ${error.message}` }
  }
}

async function suggestFix(supabaseClient: any, functionName: string, procedureName?: string): Promise<TroubleshootResponse> {
  try {
    // Verificar se a função existe
    const functionCheck = await checkFunctionExists(supabaseClient, functionName)
    
    if (!functionCheck.success) {
      return functionCheck
    }

    const schema = functionCheck.data.schema
    const qualifiedName = schema === 'public' ? functionName : `${schema}.${functionName}`

    const suggestions = [
      `1. Use o nome qualificado da função: ${qualifiedName}()`,
      `2. Se for uma função que retorna valor, use SELECT: SELECT ${qualifiedName}();`,
      `3. Se for uma procedure, use CALL: CALL ${qualifiedName}();`,
      `4. Se for em uma PROCEDURE/FUNCTION, use PERFORM para descartar resultado: PERFORM ${qualifiedName}();`
    ]

    if (procedureName) {
      suggestions.push(`5. Exemplo de correção na procedure ${procedureName}:`)
      suggestions.push(`
CREATE OR REPLACE PROCEDURE ${procedureName}()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Chame a função corretamente
  PERFORM ${qualifiedName}();
END;
$$;`)
    }

    return {
      success: true,
      suggestion: suggestions.join('\n')
    }
  } catch (error) {
    return { success: false, error: `Erro ao gerar sugestões: ${error.message}` }
  }
}