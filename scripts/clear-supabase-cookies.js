/**
 * Script para limpar cookies do Supabase no navegador
 * Execute este script no console do navegador (F12 → Console)
 * 
 * Copie e cole este código no console do navegador:
 */

(function() {
  const projectRef = 'xvbpqlojxwbvqizmixrr';
  const correctPrefix = `sb-${projectRef}-`;
  
  // Listar todos os cookies
  const allCookies = document.cookie.split(';').map(c => c.trim());
  const cookiesToDelete = [];
  
  allCookies.forEach(cookie => {
    const [name] = cookie.split('=');
    // Se for cookie do Supabase mas não do projeto correto
    if (name.startsWith('sb-') && !name.startsWith(correctPrefix)) {
      cookiesToDelete.push(name);
    }
  });
  
  if (cookiesToDelete.length === 0) {
    console.log('✅ Nenhum cookie de outro projeto encontrado!');
    return;
  }
  
  console.log('🗑️ Cookies a serem removidos:', cookiesToDelete);
  
  // Remover cookies
  cookiesToDelete.forEach(cookieName => {
    // Remover do domínio atual
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Remover do domínio com localhost
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
    // Remover do domínio sem especificar
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`;
    console.log(`✅ Removido: ${cookieName}`);
  });
  
  console.log('✅ Limpeza concluída! Recarregue a página e faça login novamente.');
})();

