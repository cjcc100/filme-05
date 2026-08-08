// Configuração das APIs
// Para produção, configure estas variáveis de ambiente no Vercel
// Para desenvolvimento local, crie um arquivo .env.local com estas variáveis

export const config = {
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '07c1396db17afadc024cbb5f0c3701c2',
    readAccessToken: process.env.TMDB_READ_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2MxMzk2ZGIxN2FmYWRjMDI0Y2JiNWYwYzM3MDFjMiIsIm5iZiI6MTc4NjEyNDk5Ni40MDIsInN1YiI6IjZhNzYxYWM0ZjYyNmIzMWI1YTQxZjk4ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.M3CJ1j7zAQD24Nebt5_PddqLAHQwlhvyZvm2EU1dd40',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  bunny: {
    videoLibraryId: process.env.BUNNY_VIDEO_LIBRARY_ID || '722927',
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME || 'vz-c3b5c7e8-b89.b-cdn.net',
    apiKey: process.env.BUNNY_API_KEY || '1b6e3939-400b-40eb-98d3945f90fe-85f3-4570',
    readOnlyApiKey: process.env.BUNNY_READ_ONLY_API_KEY || '079f4583-e0ea-47dd-bfbeed8904de-2671-47af',
    apiUrl: 'https://video.bunnycdn.com/library',
  },
};
