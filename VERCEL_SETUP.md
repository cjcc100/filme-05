# Configuração de Variáveis de Ambiente na Vercel

## Variáveis de Ambiente Necessárias

Adicione estas variáveis de ambiente nas configurações do projeto na Vercel:

### TMDb API (usado como fallback)
- `TMDB_API_KEY`: `07c1396db17afadc024cbb5f0c3701c2`
- `TMDB_READ_ACCESS_TOKEN`: `eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2MxMzk2ZGIxN2FmYWRjMDI0Y2JiNWYwYzM3MDFjMiIsIm5iZiI6MTc4NjEyNDk5Ni40MDIsInN1YiI6IjZhNzYxYWM0ZjYyNmIzMWI1YTQxZjk4ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.M3CJ1j7zAQD24Nebt5_PddqLAHQwlhvyZvm2EU1dd40`

### Bunny.net API (principal)
- `BUNNY_VIDEO_LIBRARY_ID`: `722927`
- `BUNNY_CDN_HOSTNAME`: `vz-c3b5c7e8-b89.b-cdn.net`
- `BUNNY_API_KEY`: `1b6e3939-400b-40eb-98d3945f90fe-85f3-4570`
- `BUNNY_READ_ONLY_API_KEY`: `079f4583-e0ea-47dd-bfbeed8904de-2671-47af`

### Outra Variável
- `NEXT_PUBLIC_BASE_URL`: URL do seu site na Vercel (ex: `https://seu-projeto.vercel.app`)

## Como Configurar na Vercel

1. Acesse o dashboard do seu projeto na Vercel
2. Vá em Settings > Environment Variables
3. Adicione cada variável com seu valor correspondente
4. Clique em Save e depois redeploy o projeto

## Desenvolvimento Local

Para desenvolvimento local, crie um arquivo `.env.local` na raiz do projeto com as mesmas variáveis:

```env
TMDB_API_KEY=07c1396db17afadc024cbb5f0c3701c2
TMDB_READ_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2MxMzk2ZGIxN2FmYWRjMDI0Y2JiNWYwYzM3MDFjMiIsIm5iZiI6MTc4NjEyNDk5Ni40MDIsInN1YiI6IjZhNzYxYWM0ZjYyNmIzMWI1YTQxZjk4ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.M3CJ1j7zAQD24Nebt5_PddqLAHQwlhvyZvm2EU1dd40
BUNNY_VIDEO_LIBRARY_ID=722927
BUNNY_CDN_HOSTNAME=vz-c3b5c7e8-b89.b-cdn.net
BUNNY_API_KEY=1b6e3939-400b-40eb-98d3945f90fe-85f3-4570
BUNNY_READ_ONLY_API_KEY=079f4583-e0ea-47dd-bfbeed8904de-2671-47af
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático será realizado
4. Acesse a URL gerada pela Vercel

## Funcionalidades do Projeto

- **Filmes Populares**: Filmes uploadados sem coleção (Bunny.net)
- **Séries e Coleções**: Coleções do Bunny.net organizadas por categorias
- **Destaque**: Filme em destaque do catálogo Bunny.net
- **Imagens**: Thumbnails do Bunny CDN
- **Cache**: Revalidação automática para melhor performance

## Organização Recomendada

- **Filmes**: Deixe todos sem coleção (aparecem em "Filmes Populares")
- **Séries**: Organize em coleções (cada temporada = uma coleção)
- **Vídeos Privados**: Use API key principal para acessar todos os vídeos

## Adicionar Novas Séries

Para adicionar novas séries com capas do TMDb:

1. **Crie a coleção no Bunny.net** com os episódios
2. **Encontre o ID da série no TMDb** (ex: https://www.themoviedb.org/tv/ID-SERIE)
3. **Adicione o mapeamento** nos arquivos:
   - `app/page.tsx` - Adicione em `collectionMappings`
   - `app/collection/[id]/page.tsx` - Adicione em `collectionMappings`

Exemplo:
```typescript
const collectionMappings: Record<string, { seriesId: string; seasonNumber: string }> = {
  'f079e325-68b5-4771-8f0d-15bb8929ab58': { seriesId: '4604', seasonNumber: '1' }, // Smallville Temporada 1
  'OUTRO-COLLECTION-ID': { seriesId: '12345', seasonNumber: '2' }, // Outra Série Temporada 2
};
```
