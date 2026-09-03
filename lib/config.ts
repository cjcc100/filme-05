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
  streamtape: {
    login: process.env.STREAMTAPE_LOGIN || '4db68bae5deec46b3a4b',
    key: process.env.STREAMTAPE_KEY || 'a7azDDb68ACx8dP',
    apiUrl: 'https://api.streamtape.com',
  },
};
