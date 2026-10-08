export type Album = {
  id: string;
  titulo: string;
  artista: string;
  ano: string;
  genero: string;
  imagem: string;
};

export type Categoria = {
  id: string;
  titulo: string;
  albuns: Album[];
};

const normalizarTexto = (valor: string) =>
  valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function buscarImagemAlbum(titulo: string, artista: string, imagemFallback: string): Promise<string> {
  if (imagemFallback.startsWith('https://coverartarchive.org/release/')) {
    return imagemFallback;
  }

  try {
    const busca = encodeURIComponent(`${titulo} ${artista}`);
    const resposta = await fetch(`https://musicbrainz.org/ws/2/release/?query=${busca}&fmt=json&limit=5`);

    if (!resposta.ok) {
      return imagemFallback;
    }

    const dados = await resposta.json();
    const releases = Array.isArray(dados?.releases) ? dados.releases : [];

    const release =
      releases.find((item: any) => {
        const tituloRelease = normalizarTexto(item?.title ?? '');
        const artistaRelease = (item?.['artist-credit'] ?? []).some((credit: any) =>
          normalizarTexto(credit?.artist?.name ?? '').includes(normalizarTexto(artista)) ||
          normalizarTexto(artista).includes(normalizarTexto(credit?.artist?.name ?? ''))
        );

        return tituloRelease.includes(normalizarTexto(titulo)) || normalizarTexto(titulo).includes(tituloRelease) || artistaRelease;
      }) ?? releases[0];

    if (!release?.id) {
      return imagemFallback;
    }

    const urls = [
      `https://coverartarchive.org/release/${release.id}/front-500.jpg`,
      `https://coverartarchive.org/release/${release.id}/front-250.jpg`,
      `https://coverartarchive.org/release/${release.id}/front.jpg`,
    ];

    for (const url of urls) {
      const verificacao = await fetch(url, { method: 'HEAD' });
      if (verificacao.ok) {
        return url;
      }
    }

    return imagemFallback;
  } catch {
    return imagemFallback;
  }
}

export async function carregarDadosAlbunsComCapa(): Promise<Categoria[]> {
  const categorias = DadosAlbuns();

  const categoriasAtualizadas = await Promise.all(
    categorias.map(async (categoria) => ({
      ...categoria,
      albuns: await Promise.all(
        categoria.albuns.map(async (album) => ({
          ...album,
          imagem: await buscarImagemAlbum(album.titulo, album.artista, album.imagem),
        }))
      ),
    }))
  );

  return categoriasAtualizadas;
}

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
    {
      id: '6',
      titulo: 'Jazz',
      albuns: [
        { id: '6a', titulo: 'Kind of Blue', artista: 'Miles Davis', ano: '1959', genero: 'Jazz', imagem: 'https://coverartarchive.org/release/e32a3f0b-1c19-3170-bb1c-650893774744/front-500.jpg' },
        { id: '6b', titulo: 'A Love Supreme', artista: 'John Coltrane', ano: '1965', genero: 'Jazz', imagem: 'https://coverartarchive.org/release/75a79676-af3d-4efa-a89d-ef613874f696/front-500.jpg' },
        { id: '6c', titulo: 'Bitches Brew', artista: 'Miles Davis', ano: '1969', genero: 'Jazz Fusion', imagem: 'https://coverartarchive.org/release/b7cf6ab3-1fab-45cd-97a2-8e684ffcada1/front-500.jpg' },
      ],
    },
    {
      id: '7',
      titulo: 'Hip-Hop',
      albuns: [
        { id: '7a', titulo: 'Illmatic', artista: 'Nas', ano: '1994', genero: 'Hip-Hop', imagem: 'https://coverartarchive.org/release/ea966345-14e2-433d-a530-dd31bde84ef9/front-500.jpg' },
        { id: '7b', titulo: 'The Blueprint', artista: 'Jay-Z', ano: '2001', genero: 'Hip-Hop', imagem: 'https://coverartarchive.org/release/567f3594-40e5-4cf0-bca1-7bd3e1a1346b/front-500.jpg' },
        { id: '7c', titulo: 'To Pimp a Butterfly', artista: 'Kendrick Lamar', ano: '2015', genero: 'Hip-Hop', imagem: 'https://coverartarchive.org/release/88ab7a5c-fd27-421e-85f0-f107ed86a43f/front-500.jpg' },
      ],
    },
    {
      id: '8',
      titulo: 'R&B',
      albuns: [
        { id: '8a', titulo: 'SOS', artista: 'SZA', ano: '2022', genero: 'R&B', imagem: 'https://coverartarchive.org/release/6b1d5b1a-e915-4451-9b4e-5229d8a7b418/front-500.jpg' },
        { id: '8b', titulo: 'After Hours', artista: 'The Weeknd', ano: '2020', genero: 'R&B', imagem: 'https://coverartarchive.org/release/ba4aa206-67ef-425f-8b1e-0f99dffd30e6/front-500.jpg' },
        { id: '8c', titulo: '24K Magic', artista: 'Bruno Mars', ano: '2016', genero: 'R&B', imagem: 'https://coverartarchive.org/release/379cfe1f-6374-421e-8897-79df3e68f10e/front-500.jpg' },
      ],
    },
    {
      id: '9',
      titulo: 'Indie',
      albuns: [
        { id: '9a', titulo: 'The National', artista: 'The National', ano: '2008', genero: 'Indie Rock', imagem: 'https://coverartarchive.org/release/d23a97c6-cf55-4ba5-84ee-1e18e9ebcbff/front-500.jpg' },
        { id: '9b', titulo: 'Lonerism', artista: 'Tame Impala', ano: '2012', genero: 'Indie Pop', imagem: 'https://coverartarchive.org/release/fcdec7a6-51a7-43b2-97e7-638f710bc163/front-500.jpg' },
        { id: '9c', titulo: 'Currents', artista: 'Tame Impala', ano: '2015', genero: 'Indie Pop', imagem: 'https://coverartarchive.org/release/f942ccca-07a9-45cd-8981-a0ad8f0dc788/front-500.jpg' },
      ],
    },
    {
      id: '10',
      titulo: 'Eletrônica',
      albuns: [
        { id: '10a', titulo: 'Random Access Memories', artista: 'Daft Punk', ano: '2013', genero: 'Electro Funk', imagem: 'https://coverartarchive.org/release/e69e2f55-a2c0-472e-b30b-f43b565b3fbe/front-500.jpg' },
        { id: '10b', titulo: 'Skrillex', artista: 'Skrillex', ano: '2014', genero: 'Dubstep', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/65/e0/44/65e0443d-f5ca-1136-7b6d-5513f1c4c8a9/886444630112.jpg/600x600bb.jpg' },
        { id: '10c', titulo: 'FUTURE', artista: 'Future', ano: '2017', genero: 'Electronic', imagem: 'https://coverartarchive.org/release/ee884f13-5cef-4ea1-954c-2925cf8594e2/front-500.jpg' },
      ],
    },
    {
      id: '11',
      titulo: 'Rock',
      albuns: [
        { id: '11a', titulo: 'Back in Black', artista: 'AC/DC', ano: '1980', genero: 'Rock', imagem: 'https://coverartarchive.org/release/9ec3fe51-4bf1-49ac-bf28-78076a74ed84/front-500.jpg' },
        { id: '11b', titulo: 'Nevermind', artista: 'Nirvana', ano: '1991', genero: 'Grunge', imagem: 'https://coverartarchive.org/release/8e061dc4-790e-4587-ba53-011e7852f88d/front-500.jpg' },
        { id: '11c', titulo: 'The Wall', artista: 'Pink Floyd', ano: '1979', genero: 'Progressive Rock', imagem: 'https://coverartarchive.org/release/93c4f215-15ae-34a2-981a-9a5fbd700004/front-500.jpg' },
      ],
    },
    {
      id: '12',
      titulo: 'Country',
      albuns: [
        { id: '12a', titulo: 'Red', artista: 'Taylor Swift', ano: '2012', genero: 'Country Pop', imagem: 'https://coverartarchive.org/release/70eaea91-7f52-4d24-b5c3-c619795ccc7e/front-500.jpg' },
        { id: '12b', titulo: 'Fearless', artista: 'Taylor Swift', ano: '2008', genero: 'Country', imagem: 'https://coverartarchive.org/release/36a43883-c36e-4107-92ee-147ad80e7626/front-500.jpg' },
        { id: '12c', titulo: 'Traveller', artista: 'Chris Stapleton', ano: '2015', genero: 'Country', imagem: 'https://coverartarchive.org/release/19e20058-8d12-4e59-8cf9-7bb9aa1b64c5/front-500.jpg' },
      ],
    },
    {
      id: '13',
      titulo: 'Latino',
      albuns: [
        { id: '13a', titulo: 'Vives', artista: 'Juanes', ano: '2013', genero: 'Latin Rock', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/54/09/8f/54098f3f-c1b1-45b2-b4b7-6f4a79f0100b/00602537279326.rgb.jpg/600x600bb.jpg' },
        { id: '13b', titulo: 'El Dorado', artista: 'Shakira', ano: '2017', genero: 'Pop Latino', imagem: 'https://coverartarchive.org/release/86078d9c-f6d7-47f4-809f-13b862e24e7f/front-500.jpg' },
        { id: '13c', titulo: 'X 100PRE', artista: 'Bad Bunny', ano: '2022', genero: 'Reggaeton', imagem: 'https://coverartarchive.org/release/4c2001fd-93e7-4efb-ba2b-f8a747bcd4d3/front-500.jpg' },
      ],
    },
    {
      id: '14',
      titulo: 'Clássica',
      albuns: [
        { id: '14a', titulo: 'The Four Seasons', artista: 'Vivaldi', ano: '1725', genero: 'Clássica', imagem: 'https://coverartarchive.org/release/ce80057e-6a04-3ef3-9644-52e9dafee708/front-500.jpg' },
        { id: '14b', titulo: 'Symphony No. 5', artista: 'Ludwig van Beethoven', ano: '1808', genero: 'Clássica', imagem: 'https://coverartarchive.org/release/2500c2e3-3cb6-4c66-ba03-7973830b2b69/front-500.jpg' },
        { id: '14c', titulo: 'Moonlight Sonata', artista: 'Ludwig van Beethoven', ano: '1801', genero: 'Clássica', imagem: 'https://coverartarchive.org/release/9a8eea3a-ba26-4c43-b63b-9952218b226d/front-500.jpg' },
      ],
    },
    {
      id: '16',
      titulo: 'Punk',
      albuns: [
        { id: '16a', titulo: 'Never Mind the Bollocks', artista: 'Sex Pistols', ano: '1977', genero: 'Punk', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/17/5a/9f/175a9f90-97bd-3683-ff7a-770382f3f89a/00602537950268.rgb.jpg/600x600bb.jpg' },
        { id: '16b', titulo: 'The Clash', artista: 'The Clash', ano: '1977', genero: 'Punk Rock', imagem: 'https://coverartarchive.org/release/838a6c81-c736-45db-adf1-6444ab65c3ce/front-500.jpg' },
        { id: '16c', titulo: 'Dookie', artista: 'Green Day', ano: '1994', genero: 'Punk Rock', imagem: 'https://coverartarchive.org/release/4216f31c-f319-4d7b-86df-9fa39db5a1fd/front-500.jpg' },
      ],
    },
    {
      id: '17',
      titulo: 'Soul',
      albuns: [
        { id: '17a', titulo: "What's Going On", artista: 'Marvin Gaye', ano: '1971', genero: 'Soul', imagem: 'https://coverartarchive.org/release/ba91f9e2-2391-4bbd-9114-c9eff138fd98/front-500.jpg' },
        { id: '17b', titulo: 'A New Day', artista: 'Alicia Keys', ano: '2007', genero: 'Soul', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/37/1a/59/371a5968-9f04-4707-a3c4-7e664f3e8f4f/886445555483.jpg/600x600bb.jpg' },
        { id: '17c', titulo: 'Back to Black', artista: 'Amy Winehouse', ano: '2006', genero: 'Soul', imagem: 'https://coverartarchive.org/release/bef386f1-3b81-461a-85c6-f97a2e61ac9e/front-500.jpg' },
      ],
    },
    {
      id: '18',
      titulo: 'Funk',
      albuns: [
        { id: '18a', titulo: 'Songs in the Key of Life', artista: 'Stevie Wonder', ano: '1976', genero: 'Funk', imagem: 'https://coverartarchive.org/release/4f0d5cb0-d9af-438f-b4c1-645cd233975c/front-500.jpg' },
        { id: '18b', titulo: 'Off the Wall', artista: 'Michael Jackson', ano: '1979', genero: 'Funk', imagem: 'https://coverartarchive.org/release/c59f3056-1d3d-4bd4-ab7d-8b036976649a/front-500.jpg' },
        { id: '18c', titulo: 'Funkadelic', artista: 'Parliament-Funkadelic', ano: '1978', genero: 'Funk Rock', imagem: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1c/80/50/1c805081-639a-4e28-bd0e-7a53d6d79d7b/00602547976694.rgb.jpg/600x600bb.jpg' },
      ],
    },
    {
      id: '20',
      titulo: 'Ambient',
      albuns: [
        { id: '20a', titulo: 'Ambient 1: Music for Airports', artista: 'Brian Eno', ano: '1978', genero: 'Ambient', imagem: 'https://coverartarchive.org/release/b3060207-bdec-393a-bd9c-165e0300e6e7/front-500.jpg' },
        { id: '20b', titulo: 'Selected Ambient Works 85-92', artista: 'Aphex Twin', ano: '1992', genero: 'Ambient', imagem: 'https://images.unsplash.com/photo-1493225457124-cac27ac0d2b5?auto=format&fit=crop&w=600&q=80' },
        { id: '20c', titulo: 'A Winged Victory for the Sullen', artista: 'A Winged Victory for the Sullen', ano: '2011', genero: 'Ambient', imagem: 'https://coverartarchive.org/release/d345656a-7fe7-4f2c-a7ff-d7097ad73787/front-500.jpg' },
      ],
    },
  ];
}
