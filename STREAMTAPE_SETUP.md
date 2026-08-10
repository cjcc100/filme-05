# Configuração do Streamtape API

Este projeto agora suporta tanto Bunny CDN quanto Streamtape API para streaming de vídeos.

## Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Streamtape API Credentials
STREAMTAPE_LOGIN=seu_login_aqui
STREAMTAPE_KEY=sua_chave_api_aqui

# Configuração do Player
USE_STREAMTAPE=true
```

## Como obter credenciais do Streamtape

1. Acesse sua conta no Streamtape
2. Vá para "Account Settings" 
3. Copie o "API Login" e "API Key"
4. Configure as variáveis de ambiente acima

## Alternar entre Bunny e Streamtape

### Para usar Streamtape:
```env
USE_STREAMTAPE=true
STREAMTAPE_LOGIN=seu_login
STREAMTAPE_KEY=sua_chave
```

### Para usar Bunny CDN:
```env
USE_STREAMTAPE=false
# Não precisa configurar STREAMTAPE_LOGIN e STREAMTAPE_KEY
```

## Diferenças entre as APIs

### Bunny CDN
- Usa GUID para identificar vídeos
- Tem sistema de coleções para séries
- Player via iframe: `https://iframe.mediadelivery.net/embed/{libraryId}/{videoGuid}`

### Streamtape
- Usa file ID (linkid) para identificar vídeos
- Usa sistema de pastas (folders)
- Player via iframe: `https://streamtape.com/e/{fileId}`
- Não tem sistema nativo de coleções como o Bunny

## Arquivos Modificados

1. `lib/config.ts` - Adicionadas configurações do Streamtape
2. `app/api/streamtape/route.ts` - Nova API route para Streamtape
3. `components/WatchButton.tsx` - Suporte para ambos os players
4. `app/movie/[id]/page.tsx` - Integração com Streamtape
5. `app/page.tsx` - Busca vídeos do Streamtape quando configurado
6. `app/api/mapping/route.ts` - Suporte para mapeamento de ambos os serviços

## Funcionalidades Mantidas

- Busca de metadados do TMDb (capas, títulos, sinopses)
- Mapeamento automático de vídeos com filmes do TMDb
- Sistema de séries (coleções) - apenas com Bunny CDN
- Player responsivo com modal
- Navegação entre filmes
