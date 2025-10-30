import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do arquivo .env
config({ path: resolve(__dirname, '../.env') });

// Importar após carregar as variáveis
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function removeAdminAccess() {
  try {
    console.log('🔧 Configuração:');
    console.log('   Supabase URL:', supabaseUrl ? '✓ Configurada' : '✗ Não configurada');
    console.log('   Service Key:', supabaseServiceKey ? '✓ Configurada' : '✗ Não configurada');
    console.log('');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas!');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const emailToRemove = 'eduspires123@gmail.com';

    console.log('🔍 Procurando usuário:', emailToRemove);

    // 1. Listar todos os usuários do Supabase Auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }

    console.log('\n📋 Usuários encontrados no Supabase Auth:');
    authUsers.users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}) - Role: ${user.user_metadata?.role || 'N/A'}`);
    });

    // 2. Encontrar o usuário específico
    const userToRemove = authUsers.users.find(u => u.email === emailToRemove);

    if (userToRemove) {
      console.log(`\n🎯 Usuário encontrado: ${userToRemove.email}`);
      console.log(`   ID: ${userToRemove.id}`);
      console.log(`   Role atual: ${userToRemove.user_metadata?.role || 'N/A'}`);

      // 3. Atualizar role para USER (removendo permissão de admin)
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        userToRemove.id,
        {
          user_metadata: {
            ...userToRemove.user_metadata,
            role: 'USER'
          }
        }
      );

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError);
        return;
      }

      console.log('✅ Acesso admin removido com sucesso do Supabase Auth!');

      // 4. Atualizar também na tabela User se existir
      const { data: dbUser, error: dbError } = await supabase
        .from('User')
        .select('*')
        .eq('email', emailToRemove)
        .maybeSingle();

      if (dbUser) {
        console.log('\n📊 Usuário encontrado na tabela User');
        const { error: updateDbError } = await supabase
          .from('User')
          .update({ role: 'USER' })
          .eq('email', emailToRemove);

        if (updateDbError) {
          console.error('❌ Erro ao atualizar tabela User:', updateDbError);
        } else {
          console.log('✅ Role atualizada na tabela User também!');
        }
      } else {
        console.log('\n⚠️ Usuário não encontrado na tabela User (apenas no Auth)');
      }

    } else {
      console.log(`\n⚠️ Usuário ${emailToRemove} não encontrado no Supabase Auth`);
    }

    // 5. Listar usuários admin restantes
    console.log('\n\n👥 Usuários com acesso ADMIN após a remoção:');
    const { data: remainingUsers } = await supabase.auth.admin.listUsers();
    remainingUsers?.users
      .filter(u => u.user_metadata?.role === 'ADMIN' || u.user_metadata?.role === 'EDITOR')
      .forEach(user => {
        console.log(`  ✓ ${user.email} - Role: ${user.user_metadata?.role}`);
      });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

removeAdminAccess();

