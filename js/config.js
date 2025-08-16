// 🧪 TEST SIMPLE - SOLO VERIFICAR TABLAS EXISTENTES
// Agrega esto al final de config.js para debuggear

// Test específico para tablas existentes
async function debugExistingTables() {
    if (!supabase) {
        console.error('❌ Cliente Supabase no disponible');
        return;
    }

    console.log('🔍 Debuggeando tablas existentes...');
    
    // Test 1: Listar todas las tablas disponibles
    try {
        console.log('📋 Intentando listar esquema...');
        
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (error) {
            console.log('⚠️ No se puede acceder al esquema:', error.message);
        } else {
            console.log('📊 Tablas disponibles:', tables?.map(t => t.table_name));
        }
    } catch (e) {
        console.log('⚠️ Error listando tablas:', e.message);
    }

    // Test 2: Probar cada tabla que mencionas
    const tablesToTest = ['vendedores', 'clientes', 'proveedores', 'ventas'];
    
    for (const tableName of tablesToTest) {
        await testSingleTable(tableName);
    }
}

async function testSingleTable(tableName) {
    try {
        console.log(`\n🧪 Probando tabla: ${tableName}`);
        
        // Test básico: contar registros
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ ${tableName}:`, error.message);
            
            // Analizar tipo de error
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.log(`  📝 La tabla "${tableName}" no existe`);
            } else if (error.message.includes('permission') || error.message.includes('policy')) {
                console.log(`  🔒 Sin permisos para "${tableName}" - problema de RLS`);
                console.log(`  💡 Solución: Ve a tu dashboard → Authentication → Policies`);
            } else if (error.message.includes('JWT')) {
                console.log(`  🔑 Problema de autenticación`);
            } else {
                console.log(`  ❓ Error desconocido: ${error.message}`);
            }
            
            return false;
        } else {
            console.log(`✅ ${tableName}: ${count || 0} registros`);
            
            // Si hay registros, mostrar uno de ejemplo
            if (count > 0) {
                const { data: sample } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                    
                if (sample && sample[0]) {
                    console.log(`  📄 Ejemplo:`, Object.keys(sample[0]));
                }
            }
            
            return true;
        }
        
    } catch (error) {
        console.error(`💥 Error inesperado en ${tableName}:`, error);
        return false;
    }
}

// Test específico de RLS
async function checkRLSStatus() {
    try {
        console.log('\n🔒 Verificando estado de RLS...');
        
        // Intentar una query que revele información sobre RLS
        const { data, error } = await supabase.rpc('check_rls_status');
        
        if (error) {
            console.log('⚠️ No se puede verificar RLS (función no existe)');
        } else {
            console.log('🔒 Estado RLS:', data);
        }
        
    } catch (e) {
        console.log('⚠️ No se puede verificar RLS:', e.message);
    }
}

// Test de permisos de API key
async function testAPIKeyPermissions() {
    try {
        console.log('\n🔑 Probando permisos de API key...');
        
        // Test 1: Auth básico
        const { data: session } = await supabase.auth.getSession();
        console.log('🔐 Sesión auth:', session ? 'Activa' : 'No activa');
        
        // Test 2: Intentar obtener usuario actual
        const { data: user } = await supabase.auth.getUser();
        console.log('👤 Usuario:', user ? 'Logueado' : 'Anónimo');
        
        // Test 3: Verificar si es anon key
        if (supabaseKey.includes('anon')) {
            console.log('🔓 Usando anon key - correcto para frontend');
        } else {
            console.log('⚠️ No parece ser anon key');
        }
        
    } catch (error) {
        console.error('❌ Error en test de permisos:', error);
    }
}

// Función principal de debugging
async function fullDiagnostic() {
    console.log('🚀 DIAGNÓSTICO COMPLETO DE SUPABASE\n');
    console.log('================================');
    
    await debugExistingTables();
    await checkRLSStatus();
    await testAPIKeyPermissions();
    
    console.log('\n📋 RESUMEN:');
    console.log('- Si ves "Sin permisos" → Problema de RLS policies');
    console.log('- Si ves "no existe" → Nombre de tabla incorrecto');
    console.log('- Si ves "JWT" → Problema de API key');
    console.log('\n✅ Diagnóstico completado');
}

// Ejecutar diagnóstico automáticamente en 2 segundos
setTimeout(() => {
    if (window.NTS_CONFIG?.isSupabaseConnected) {
        fullDiagnostic();
    }
}, 2000);

// Agregar funciones al export global
if (window.NTS_CONFIG) {
    window.NTS_CONFIG.debugTables = debugExistingTables;
    window.NTS_CONFIG.testTable = testSingleTable;
    window.NTS_CONFIG.fullDiagnostic = fullDiagnostic;
}
