export type Album = {
  id: string;
  titulo: string;
  artista: string;
  ano: string;
  genero: string;
  imagem: string;
};

type Categoria = {
  id: string;
  titulo: string;
  albuns: Album[];
};

export default function DadosAlbuns(): Categoria[] {
  return [
    {
      id: '1',
      titulo: 'APOIE ARTISTAS INDEPENDENTES',
      albuns: [
        { id: '1a', titulo: 'Funeral', artista: 'Arcade Fire', ano: '2004', genero: 'Alternative', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/09/6e/2b096e8c-ae65-fc42-a4b1-19abb4100433/886446576442.jpg/600x600bb.jpg' },
        { id: '1b', titulo: 'Either/Or', artista: 'Elliott Smith', ano: '1997', genero: 'Rock', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ff/ea/28/ffea28a4-988a-f02e-7e1a-8566db3cab02/mzi.uoqucyoy.jpg/600x600bb.jpg' },
        { id: '1c', titulo: 'Carrie & Lowell Live', artista: 'Sufjan Stevens', ano: '2017', genero: 'Alternative', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music91/v4/6b/20/6a/6b206ac1-e1b5-316d-334d-59df7b727fb6/656605613666.jpg/600x600bb.jpg' },
      ],
    },
    {
      id: '2',
      titulo: 'Mais tocadas',
      albuns: [
        { id: '2a', titulo: 'Thriller', artista: 'Michael Jackson', ano: '1982', genero: 'Pop', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/600x600bb.jpg' },
        { id: '2b', titulo: '21', artista: 'Adele', ano: '2011', genero: 'Pop', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/600x600bb.jpg' },
        { id: '2c', titulo: '÷ (Deluxe)', artista: 'Ed Sheeran', ano: '2017', genero: 'Pop', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/600x600bb.jpg' },
      ],
    },
    {
      id: '3',
      titulo: 'Metal',
      albuns: [
        { id: '3a', titulo: 'Paranoid', artista: 'Black Sabbath', ano: '1970', genero: 'Metal', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/be/27/91/be279120-2285-16c6-c7ba-9d6643d4a948/075992732727.jpg/600x600bb.jpg' },
        { id: '3b', titulo: 'Master of Reality', artista: 'Black Sabbath', ano: '1971', genero: 'Metal', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c2/9f/a1/c29fa109-8c22-bb7f-82f2-a6891d961c28/075992725323.jpg/600x600bb.jpg' },
        { id: '3c', titulo: 'The Number of the Beast', artista: 'Iron Maiden', ano: '1982', genero: 'Metal', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/1d/cb/ac/1dcbac1b-737d-b7c8-8bed-b5a98ae9df77/0881034134448.jpg/600x600bb.jpg' },
      ],
    },
    {
      id: '4',
      titulo: 'Pop',
      albuns: [
        { id: '4a', titulo: '1989', artista: 'Taylor Swift', ano: '2014', genero: 'Pop', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/89/4a/4a/894a4ab9-b0b0-9ea5-ca41-8da0b9b79453/14UMDIM03405.rgb.jpg/600x600bb.jpg' },
        { id: '4b', titulo: 'Teenage Dream', artista: 'Katy Perry', ano: '2010', genero: 'Pop', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7c/cb/c1/7ccbc1a3-9476-8f85-3c14-4e7e91f67f25/13UABIM57788.rgb.jpg/600x600bb.jpg' },
        { id: '4c', titulo: 'Bad', artista: 'Michael Jackson', ano: '1987', genero: 'Pop', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d5/5f/28/d55f28f4-610c-ee81-dc16-a01cda46bbc4/886443546264.jpg/600x600bb.jpg' },
      ],
    },
    {
      id: '5',
      titulo: 'House',
      albuns: [
        { id: '5a', titulo: 'Homework', artista: 'Daft Punk', ano: '1997', genero: 'Dance', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/dc/68/45/dc684589-af57-6895-1177-4f2acbb93e47/190296240911.jpg/600x600bb.jpg' },
        { id: '5b', titulo: 'Discovery', artista: 'Daft Punk', ano: '2001', genero: 'Dance', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fd/4a/77/fd4a77db-0ebc-d043-41a2-f32fa1bb0fb4/dj.qrikkdwj.jpg/600x600bb.jpg' },
        { id: '5c', titulo: 'Human After All', artista: 'Daft Punk', ano: '2005', genero: 'House', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4e/03/13/4e03130f-918e-cbd2-e99f-26ed67480411/724386091956.jpg/600x600bb.jpg' },
      ],
    },
  ];
}
