USE loginBD;

CREATE TABLE IF NOT EXISTS favoritos_albuns (
    usuario_id INT NOT NULL,
    album_id INT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, album_id),
    KEY idx_favoritos_albuns_album (album_id),
    CONSTRAINT fk_favoritos_albuns_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_albuns_album
        FOREIGN KEY (album_id) REFERENCES albuns (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
